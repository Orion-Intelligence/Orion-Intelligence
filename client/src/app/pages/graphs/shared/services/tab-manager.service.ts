import { Injectable, signal, computed } from '@angular/core';
import { NetworkData, Job, PlatformResult, CustomEntity, TabState, SerializableTabState, Tab, NetworkNode, GraphPlatformBatch, ProfileLeakSessionData, ProfileMetadataSessionData } from '../../../../shared/model/social/social-scan.models';
import { ApiService } from '../../../../shared/services/api.service';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { GraphReportExportType, GraphReportPayload } from '../../../../shared/model/report/report-export.model';
@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  private readonly maxTabsAllowed = 5;
  private readonly graphType = 'social';
  private static tabCounter = 1;
  private hasLoadedState = false;
  private hasPendingSave = false;
  private autosaveIntervalId: any;
  private lastSavedSignature = '';

  tabs = signal<Tab[]>([]);
  activeTabId = signal<string>('');
  editingTabId = signal<string | null>(null);
  activeTab = computed(() => this.tabs().find(t => t.id === this.activeTabId()));

  constructor(private api: ApiService, private graphReportExport: ReportExportService) {
    this.startPeriodicSave();
    this.loadState();
  }

  private createNewState(): TabState {
    return {
      searchTerm: signal(''),
      homeMenuSearchTerm: signal(''),
      jobs: signal<Job[]>([]),
      networkData: signal<NetworkData>({ nodes: [], edges: [] }),
      scanResults: signal(new Map<string, PlatformResult[]>()),
      activeUsernames: signal(new Set<string>()),
      customEntities: signal<CustomEntity[]>([]),
      isEditMode: signal(false),
      isHomeMenuCollapsed: signal(false),
      isEntityMenuCollapsed: signal(false),
      activeHomeMenuTab: signal<'history' | 'entities'>('history'),
      isPhysicsEnabled: signal(true),
      viewMode: signal<'graph' | 'list'>('graph'),
      expandedGroupDataByUser: signal<{
                [username: string]: NetworkNode | null;
            }>({}),
      graphPlatformBatches: signal(new Map<string, GraphPlatformBatch>()),
      profileLeakIntelligenceByUser: signal<Record<string, ProfileLeakSessionData>>({}),
      profileMetadataByUser: signal<Record<string, ProfileMetadataSessionData>>({}),
    };
  }

  addTab() {
    if (this.tabs().length >= this.maxTabsAllowed) {
      return;
    }
    const newTab: Tab = {
      id: self.crypto.randomUUID(),
      name: `Session ${TabManagerService.tabCounter++}`,
      state: this.createNewState(),
    };
    this.tabs.update(tabs => [...tabs, newTab]);
    this.persistAddedTab(newTab);
    this.selectTab(newTab.id);
  }

  selectTab(id: string) {
    this.activeTabId.set(id);
    this.scheduleSave();
  }

  closeTab(id: string) {
    const tabs = this.tabs();
    if (tabs.length <= 1) {
      return;
    }
    const tabIndex = tabs.findIndex(t => t.id === id);
    this.tabs.update(currentTabs => currentTabs.filter(t => t.id !== id));
    if (this.activeTabId() === id) {
      const newActiveTab = tabs[tabIndex - 1] || tabs[tabIndex + 1];
      this.selectTab(newActiveTab.id);
    }
    else {
      this.scheduleSave();
    }
  }

  startEditing(id: string) {
    this.editingTabId.set(id);
  }

  stopEditing() {
    this.editingTabId.set(null);
  }

  renameTab(id: string, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      this.stopEditing();
      return;
    }
    this.tabs.update(tabs => tabs.map(tab => (tab.id === id ? { ...tab, name: trimmedName } : tab)));
    this.stopEditing();
    this.scheduleSave();
  }

  exportActiveTab() {
    const active = this.activeTab();
    if (!active) {
      return;
    }
    const tabDataToExport = {
      name: active.name,
      state: this.serializeTabState(active.state)
    };
    const jsonString = JSON.stringify(tabDataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeFilename = active.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `orion-intelligence-session-${safeFilename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportActiveTabReport(type: GraphReportExportType): void {
    const payload = this.buildSocialReportPayload();
    if (!payload) {
      return;
    }
    this.graphReportExport.exportByType(payload, type);
  }

  importTab(jsonString: string): void {
    if (this.tabs().length >= this.maxTabsAllowed) {
      return;
    }
    try {
      const importedData = JSON.parse(jsonString);
      if (typeof importedData.name !== 'string' || typeof importedData.state !== 'object' || importedData.state === null) {
        return;
      }
      const newTab: Tab = {
        id: self.crypto.randomUUID(),
        name: importedData.name,
        state: this.deserializeTabState(importedData.state),
      };
      this.tabs.update(tabs => [...tabs, newTab]);
      this.persistAddedTab(newTab);
      this.selectTab(newTab.id);
    }
    catch {
      throw new Error('Invalid session file content.');
    }
  }

  scheduleSave() {
    if (!this.hasLoadedState) {
      return;
    }
    this.hasPendingSave = true;
  }

  private buildSerializableState() {
    return {
      active_tab_id: this.activeTabId(),
      tab_counter: TabManagerService.tabCounter,
      tabs: this.tabs().map(tab => ({
        id: tab.id,
        name: tab.name,
        state: this.serializeTabState(tab.state),
      })),
    };
  }

  private startPeriodicSave() {
    this.autosaveIntervalId = setInterval(() => this.tryPeriodicSave(), 5000);
  }

  private tryPeriodicSave() {
    if (!this.hasAuthToken()) {
      this.hasPendingSave = false;
      return;
    }
    if (!this.hasLoadedState) {
      return;
    }
    if (!this.hasPendingSave) {
      return;
    }
    const serializableState = this.buildSerializableState();
    const nextSignature = JSON.stringify(serializableState);
    if (nextSignature === this.lastSavedSignature) {
      this.hasPendingSave = false;
      return;
    }
    this.api.post<any>(`social/session/upsert?graph_type=${this.graphType}`, serializableState).subscribe({
      next: () => {
        this.lastSavedSignature = nextSignature;
        this.hasPendingSave = false;
      },
      error: () => { },
    });
  }

  private persistAddedTab(tab: Tab) {
    if (!this.hasAuthToken()) {
      return;
    }
    if (!this.hasLoadedState) {
      return;
    }
    const tabPayload = {
      id: tab.id,
      name: tab.name,
      state: this.serializeTabState(tab.state),
    };
    this.api.post<any>(`social/session/tab/add?graph_type=${this.graphType}`, tabPayload).subscribe({
      next: () => { },
      error: () => { },
    });
  }

  private loadState() {
    if (!this.hasAuthToken()) {
      this.hasLoadedState = true;
      this.hasPendingSave = false;
      if (this.tabs().length === 0) {
        const localTab: Tab = {
          id: self.crypto.randomUUID(),
          name: `Session ${TabManagerService.tabCounter++}`,
          state: this.createNewState(),
        };
        this.tabs.set([localTab]);
        this.activeTabId.set(localTab.id);
      }
      return;
    }
    this.api.get<any>(`social/session/tabs?graph_type=${this.graphType}`).subscribe({
      next: (savedState) => {
        const savedTabs = Array.isArray(savedState?.tabs) ? savedState.tabs : [];
        if (savedTabs.length === 0) {
          this.hasLoadedState = true;
          this.addTab();
          return;
        }
        const loadedTabs: Tab[] = savedTabs.map((savedTab: any, index: number) => {
          const tabId = typeof savedTab?.id === 'string' && savedTab.id.length > 0 ? savedTab.id : self.crypto.randomUUID();
          const tabName = typeof savedTab?.name === 'string' && savedTab.name.trim().length > 0 ? savedTab.name : `Session ${index + 1}`;
          const tabState = savedTab?.state && typeof savedTab.state === 'object' ? this.deserializeTabState(savedTab.state as SerializableTabState) : this.createNewState();
          return {
            id: tabId,
            name: tabName,
            state: tabState,
          } as Tab;
        });
        this.tabs.set(loadedTabs);
        this.activeTabId.set(loadedTabs[0]?.id || '');
        TabManagerService.tabCounter = loadedTabs.length + 1;
        this.hasLoadedState = true;
        this.hasPendingSave = false;
        this.lastSavedSignature = JSON.stringify(this.buildSerializableState());
      },
      error: () => {
        this.hasLoadedState = true;
        this.hasPendingSave = false;
        this.addTab();
      },
    });
  }

  private hasAuthToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private serializeTabState(state: TabState): SerializableTabState {
    const plainState: any = {};
    for (const key in state) {
      let value = (state as any)[key]();
      if (value instanceof Map) {
        value = { __type: 'Map', value: Array.from(value.entries()) };
      }
      else if (value instanceof Set) {
        value = { __type: 'Set', value: Array.from(value.values()) };
      }
      plainState[key] = value;
    }
    return plainState;
  }

  private deserializeTabState(plainState: SerializableTabState): TabState {
    const newState = this.createNewState();
    for (const key in plainState) {
      if (key === 'isEditMode') {
        // Edit mode should never survive a reload/imported tab restore.
        continue;
      }
      let value = (plainState as any)[key];
      if (value && value.__type === 'Map') {
        (newState as any)[key].set(new Map(value.value));
      }
      else if (value && value.__type === 'Set') {
        (newState as any)[key].set(new Set(value.value));
      }
      else if ((newState as any)[key]) {
        (newState as any)[key].set(value);
      }
    }
    return newState;
  }

  private buildSocialReportPayload(): GraphReportPayload | null {
    const active = this.activeTab();
    if (!active) {
      return null;
    }
    const network = active.state.networkData();
    const nodes = network.nodes.map(node => ({
      id: String(node.id ?? ''),
      label: String(node.label ?? ''),
      type: this.getNodeType(node)
    }));
    const edges = network.edges.map((edge: any) => ({
      id: String(edge.id ?? `${edge.from}->${edge.to}`),
      from: String(edge.from ?? ''),
      to: String(edge.to ?? ''),
      label: edge.label ? String(edge.label) : ''
    }));
    const byType: Record<string, number> = {};
    nodes.forEach(node => {
      byType[node.type] = (byType[node.type] ?? 0) + 1;
    });
    const platforms = Array.from(active.state.scanResults().values()).flat();
    const activeUsers = active.state.activeUsernames().size;
    const tables = platforms.length > 0
      ? [{
        title: 'Scan Snapshot',
        values: {
          platforms: String(platforms.length),
          activeUsers: String(activeUsers),
          customEntities: String(active.state.customEntities().length),
          view: active.state.viewMode()
        }
      }]
      : [];
    return {
      graphKind: 'social',
      title: 'Social Graph Intelligence Report',
      sessionName: active.name,
      generatedAtIso: new Date().toISOString(),
      nodes,
      edges,
      graphImageDataUrl: this.captureSocialGraphSnapshot(),
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        groupedNodes: byType['group'] ?? 0,
        customEntities: active.state.customEntities().length,
        scannedPlatforms: platforms.length
      },
      tables
    };
  }

  private captureSocialGraphSnapshot(): string | undefined {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const canvases = document.querySelectorAll('app-network-graph canvas');
    if (canvases.length === 0) {
      return undefined;
    }
    try {
      const base = canvases[0] as HTMLCanvasElement;
      const merged = document.createElement('canvas');
      merged.width = base.width;
      merged.height = base.height;
      const ctx = merged.getContext('2d');
      if (!ctx) {
        return undefined;
      }
      canvases.forEach(node => {
        const canvas = node as HTMLCanvasElement;
        if (canvas.width === merged.width && canvas.height === merged.height) {
          ctx.drawImage(canvas, 0, 0);
        }
      });
      const pad = Math.round(Math.max(merged.width, merged.height) * 0.06);
      const padded = document.createElement('canvas');
      padded.width = merged.width + (pad * 2);
      padded.height = merged.height + (pad * 2);
      const pctx = padded.getContext('2d');
      if (!pctx) {
        return merged.toDataURL('image/jpeg', 0.92);
      }
      pctx.fillStyle = '#0f172a';
      pctx.fillRect(0, 0, padded.width, padded.height);
      pctx.drawImage(merged, pad, pad);
      return padded.toDataURL('image/jpeg', 0.92);
    }
    catch {
      return undefined;
    }
  }

  private getNodeType(node: NetworkNode): string {
    const nodeId = String(node.id ?? '');
    if ((node.groupedPlatforms?.length ?? 0) > 0) {
      return 'group';
    }
    if (nodeId.startsWith('user-')) {
      return 'user';
    }
    if (nodeId.startsWith('platform-')) {
      return 'platform';
    }
    if (nodeId.startsWith('entity-')) {
      return 'entity';
    }
    if (nodeId.startsWith('relationship-node-')) {
      return 'relationship';
    }
    if (node.shape) {
      const shape = String(node.shape).toLowerCase();
      if (shape === 'icon' || shape === 'circularimage') {
        return 'entity';
      }
      return shape;
    }
    return 'node';
  }
}
