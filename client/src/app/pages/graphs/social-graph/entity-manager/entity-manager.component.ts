import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomEntity, TabState } from '../../../../shared/model/social/social-scan.models';
import { GraphOrchestratorService } from '../services/graph-orchestrator.service';
import { TabManagerService } from '../../shared/services/tab-manager.service';
import { EntityMenuComponent } from '../entity-menu/entity-menu.component';
import { AddEntityData } from './add-entity-modal/add-entity-modal.component';
@Component({
  selector: 'app-entity-manager',
  standalone: true,
  imports: [CommonModule, EntityMenuComponent],
  templateUrl: './entity-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityManagerComponent {
  private graphOrchestrator = inject(GraphOrchestratorService);
  private tabManager = inject(TabManagerService);

  isCollapsed = input.required<boolean>();
  isSmallScreen = input.required<boolean>();
  activeTabState = input.required<TabState>();
  toggle = output<void>();
  addEntityModalData = signal<AddEntityData | null>(null);

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
      this.closeAddEntityModal();
      return;
    }
    const state = this.activeTabState();
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
      status: 'added'
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
    this.graphOrchestrator.deleteCustomEntity(this.activeTabState(), nodeId);
    this.tabManager.scheduleSave();
  }
}
