import { Component, ChangeDetectionStrategy, input, output, signal, inject, effect, DestroyRef } from '@angular/core';

import { CustomEntity, TabState } from '../../../../shared/model/social/social-scan.models';
import { GraphOrchestratorService } from '../services/graph-orchestrator.service';
import { TabManagerService } from '../../shared/services/tab-manager.service';
import { EntityMenuComponent } from '../entity-menu/entity-menu.component';
import { AddEntityData } from './add-entity-modal/add-entity-modal.component';
import { ApiService } from '../../../../shared/services/api.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-entity-manager',
  standalone: true,
  imports: [EntityMenuComponent],
  templateUrl: './entity-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityManagerComponent {
  private graphOrchestrator = inject(GraphOrchestratorService);
  private tabManager = inject(TabManagerService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private extractionTasks = new Map<string, { intervalId: ReturnType<typeof setInterval>; subscription?: Subscription; pollTimeoutId?: ReturnType<typeof setTimeout>; }>();
  private isDestroyed = false;

  isCollapsed = input.required<boolean>();
  isSmallScreen = input.required<boolean>();
  activeTabState = input.required<TabState>();
  toggle = output<undefined>();
  deleteEntityRequested = output<string>();
  addEntityModalData = signal<AddEntityData | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
      Array.from(this.extractionTasks.keys()).forEach(id => {
        this.cleanupExtractionTask(id);
      });
    });

    effect(() => {
      if (this.isDestroyed) {
        return;
      }
      const state = this.activeTabState();
      const entities = state.customEntities();
      for (const entity of entities) {
        if (
          (entity.status === 'pending' || entity.status === 'in_progress') &&
          !!this.getApiConfig(entity.type, entity.value) &&
          !this.extractionTasks.has(entity.id)
        ) {
          this.startApiPolling(entity.id, entity.type, entity.value, entity.label);
        }
      }
    });
  }

  ngOnDestroy() {
    Array.from(this.extractionTasks.keys()).forEach(id => {
      this.cleanupExtractionTask(id);
    });
  }

  openAddEntityModal(type: CustomEntity['type']) {
    const state = this.activeTabState();
    state.activeHomeMenuTab.set('entities');
    state.homeMenuSearchTerm.set('');
    this.addEntityModalData.set({ type, value: '', label: '', mode: 'add' });
  }

  openEditEntityModal(entityId: string) {
    const state = this.activeTabState();
    const entity = state.customEntities().find(current => current.id === entityId);
    if (!entity) {
      return;
    }
    state.activeHomeMenuTab.set('entities');
    state.homeMenuSearchTerm.set('');
    this.addEntityModalData.set({
      type: entity.type,
      value: entity.value,
      label: entity.label === entity.value ? '' : entity.label,
      mode: 'edit',
      entityId: entity.id
    });
  }

  closeAddEntityModal() {
    this.addEntityModalData.set(null);
  }

  confirmAddEntity(entityData: AddEntityData) {
    const { type, value, label } = entityData;
    const normalizedValue = value.trim();
    const displayLabel = label.trim() || normalizedValue;
    if (!normalizedValue) {
      if (entityData.inputMode !== 'api') {
        this.closeAddEntityModal();
        return;
      }
    }
    const state = this.activeTabState();
    const inputMode = entityData.inputMode || 'manual';

    if (inputMode === 'api' && entityData.mode !== 'edit') {
      this.startApiExtraction(type, entityData.apiQuery?.trim() || '', label.trim());
      this.closeAddEntityModal();
      return;
    }

    if (entityData.mode === 'edit' && entityData.entityId) {
      state.customEntities.update(entities => entities.map(entity => {
        if (entity.id === entityData.entityId) {
          return { ...entity, label: displayLabel, value: normalizedValue };
        }
        return entity;
      }));
      state.networkData.update(networkData => ({
        ...networkData,
        nodes: networkData.nodes.map(node => {
          if (node.id.toString() === entityData.entityId) {
            const existingTitle = node.title ? `${node.title}` : '';
            const titleParts = existingTitle.split('|');
            const typeTitle = titleParts.length > 0 && titleParts[0].trim() ? titleParts[0].trim() : type.toUpperCase();
            return {
              ...node,
              label: displayLabel,
              title: `${typeTitle} | ${displayLabel} | ${normalizedValue}`
            };
          }
          return node;
        })
      }));
      state.activeHomeMenuTab.set('entities');
      state.homeMenuSearchTerm.set('');
      this.closeAddEntityModal();
      this.tabManager.scheduleSave();
      return;
    }
    const newEntity: CustomEntity = {
      id: `custom-${type}-${self.crypto.randomUUID()}`,
      type,
      label: displayLabel,
      value: normalizedValue,
      onGraph: false,
      status: 'added',
      source: 'manual',
      reportData: null
    };
    state.customEntities.update(entities => [newEntity, ...entities]);
    state.activeHomeMenuTab.set('entities');
    state.homeMenuSearchTerm.set('');
    this.closeAddEntityModal();
    this.tabManager.scheduleSave();
  }

  public addEntityToGraph(entityId: string) {
    this.graphOrchestrator.addEntityToGraph(this.activeTabState(), entityId);
    this.tabManager.scheduleSave();
  }

  public deleteCustomEntity(nodeId: string) {
    this.cleanupExtractionTask(nodeId);
    this.graphOrchestrator.deleteCustomEntity(this.activeTabState(), nodeId);
    this.tabManager.scheduleSave();
  }

  public cancelEntityScan(entityId: string) {
    this.cleanupExtractionTask(entityId);
    const state = this.activeTabState();
    state.customEntities.update(entities => entities.map(entity => entity.id === entityId ? {
      ...entity,
      status: 'failed',
      step: 'Cancelled',
      progress: entity.progress ?? 0
    } : entity));
    this.tabManager.scheduleSave();
  }

  private getApiConfig(type: CustomEntity['type'], query: string): {
    endpoint: string;
    payload: any;
  } | null {
    switch (type) {
      case 'email-breach':
        return { endpoint: 'dynamic/user', payload: { text: { username: query } } };
      case 'social-scanner':
        return { endpoint: 'dynamic/social', payload: { text: { username: query } } };
      case 'wanted-list':
        return { endpoint: 'dynamic/wanted', payload: { text: { query } } };
      case 'national-identity':
        return { endpoint: 'dynamic/national-identity', payload: { text: { pak_query: query } } };
      case 'playstore-scanner':
        return { endpoint: 'dynamic/cracked', payload: { text: { playstore: query } } };
      case 'software-scanner':
        return { endpoint: 'dynamic/software', payload: { text: { name: query } } };
      case 'phone':
        return { endpoint: 'social/phone/recon', payload: { query } };
      case 'domain-scan':
        return { endpoint: 'urlscan/domain', payload: { text: { domain: query } } };
      case 'subdomains-scan':
        return { endpoint: 'urlscan/subdomains', payload: { domain: query, scanType: 'subdomains', checkLive: false } };
      case 'dns-scan':
        return { endpoint: 'urlscan/dns', payload: { text: { domain: query } } };
      case 'wayback-scan':
        return { endpoint: 'urlscan/wayback', payload: { text: { domain: query } } };
      case 'crypto-scanner':
        return { endpoint: 'crypto/scan', payload: { text: { wallet: query } } };
      default:
        return null;
    }
  }

  private flattenStrings(input: any, bucket: string[] = []): string[] {
    if (typeof input === 'string') {
      const v = input.trim();
      if (v) {
        bucket.push(v);
      }
      return bucket;
    }
    if (Array.isArray(input)) {
      input.forEach(v => this.flattenStrings(v, bucket));
      return bucket;
    }
    if (input && typeof input === 'object') {
      Object.values(input).forEach(v => this.flattenStrings(v, bucket));
      return bucket;
    }
    return bucket;
  }

  private extractBestValue(response: any, fallback: string): string {
    const nestedResult = response?.result?.result ?? response?.result ?? response;
    const prioritized = [
      nestedResult?.number,
      nestedResult?.phone,
      nestedResult?.query,
      nestedResult?.username,
      nestedResult?.email,
      response?.query,
      response?.phone
    ].find(v => typeof v === 'string' && v.trim().length > 0);
    if (prioritized) {
      return prioritized.trim();
    }
    const candidates = this.flattenStrings(response);
    const valid = candidates.find(v => v.length > 2 && v.length < 260);
    return valid || fallback;
  }

  private startApiExtraction(type: CustomEntity['type'], query: string, label: string) {
    const apiConfig = this.getApiConfig(type, query);
    if (!apiConfig || !query) {
      return;
    }
    const state = this.activeTabState();
    const entityId = `custom-${type}-${self.crypto.randomUUID()}`;
    const entityLabel = label || query;
    state.activeHomeMenuTab.set('entities');
    state.homeMenuSearchTerm.set('');
    state.customEntities.update(entities => [{
      id: entityId,
      type,
      label: entityLabel,
      value: query,
      onGraph: false,
      status: 'in_progress',
      progress: 5,
      step: 'Queued',
      source: 'api',
      reportData: null
    }, ...entities]);
    this.startApiPolling(entityId, type, query, entityLabel);
  }

  private startApiPolling(entityId: string, type: CustomEntity['type'], query: string, label: string) {
    if (this.isDestroyed || this.extractionTasks.has(entityId)) {
      return;
    }
    const apiConfig = this.getApiConfig(type, query);
    if (!apiConfig) {
      return;
    }
    const state = this.activeTabState();
    let progress = Math.max(5, state.customEntities().find(entity => entity.id === entityId)?.progress ?? 5);
    const intervalId = setInterval(() => {
      if (this.isDestroyed || !this.extractionTasks.has(entityId)) {
        this.cleanupExtractionTask(entityId);
        return;
      }
      progress = Math.min(progress + 6, 88);
      state.customEntities.update(entities => entities.map(entity => entity.id === entityId ? {
        ...entity,
        progress: Math.max(entity.progress ?? 0, progress),
        step: entity.step || 'Extracting...',
        status: entity.status === 'pending' ? 'pending' : 'in_progress'
      } : entity));
    }, 600);

    this.extractionTasks.set(entityId, { intervalId });
    const executePoll = () => {
      if (this.isDestroyed || !this.extractionTasks.has(entityId)) {
        this.cleanupExtractionTask(entityId);
        return;
      }
      const subscription = this.api.post<any>(apiConfig.endpoint, apiConfig.payload).subscribe({
        next: (response) => {
          if (this.isDestroyed || !this.extractionTasks.has(entityId)) {
            this.cleanupExtractionTask(entityId);
            return;
          }
          const rawStatus = `${response?.status || response?.result?.status || ''}`.toLowerCase();
          const progressValue = Number(response?.progress ?? response?.result?.progress ?? progress);
          const rawProgress = Number.isFinite(progressValue) ? progressValue : progress;
          const rawStep = `${response?.step || response?.result?.step || 'Queued'}`;

          if (rawStatus === 'pending' || rawStatus === 'in_progress') {
            state.customEntities.update(entities => entities.map(entity => entity.id === entityId ? {
              ...entity,
              status: rawStatus === 'pending' ? 'pending' : 'in_progress',
              progress: Math.max(entity.progress ?? 0, rawProgress),
              step: rawStep,
              reportData: response ?? null
            } : entity));
            this.tabManager.scheduleSave();
            const task = this.extractionTasks.get(entityId);
            if (task) {
              task.pollTimeoutId = setTimeout(executePoll, 2500);
            }
            return;
          }

          const bestValue = this.extractBestValue(response, query);
          state.customEntities.update(entities => entities.map(entity => entity.id === entityId ? {
            ...entity,
            label,
            value: bestValue,
            status: 'added',
            progress: 100,
            step: rawStep === 'Queued' ? 'Completed' : rawStep,
            reportData: response ?? null
          } : entity));
          this.tabManager.scheduleSave();
          this.cleanupExtractionTask(entityId);
        },
        error: () => {
          if (this.isDestroyed) {
            this.cleanupExtractionTask(entityId);
            return;
          }
          this.cleanupExtractionTask(entityId);
          state.customEntities.update(entities => entities.map(entity => entity.id === entityId ? {
            ...entity,
            status: 'failed',
            step: 'Extraction failed',
            progress: entity.progress ?? progress
          } : entity));
          this.tabManager.scheduleSave();
        }
      });
      const task = this.extractionTasks.get(entityId);
      if (task) {
        task.subscription = subscription;
      }
    };
    executePoll();
  }

  private cleanupExtractionTask(entityId: string) {
    const task = this.extractionTasks.get(entityId);
    if (!task) {
      return;
    }
    clearInterval(task.intervalId);
    if (task.pollTimeoutId) {
      clearTimeout(task.pollTimeoutId);
    }
    if (task.subscription && !task.subscription.closed) {
      task.subscription.unsubscribe();
    }
    this.extractionTasks.delete(entityId);
  }
}
