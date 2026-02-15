import { Injectable, signal, computed } from '@angular/core';
import { NetworkData, Job, PlatformResult, CustomEntity, TabState, SerializableTabState, Tab, NetworkNode, GraphPlatformBatch } from '../../../shared/model/social/social-scan.models';

const STORAGE_KEY = 'orion-intelligence-sessions';

@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  private static tabCounter = 1;
  private saveTimeout: any;

  tabs = signal<Tab[]>([]);
  activeTabId = signal<string>('');
  editingTabId = signal<string | null>(null);

  activeTab = computed(() => this.tabs().find(t => t.id === this.activeTabId()));

  constructor() {
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
      expandedGroupDataByUser: signal<{ [username: string]: NetworkNode | null }>({}),
      graphPlatformBatches: signal(new Map<string, GraphPlatformBatch>()),
    };
  }

  addTab() {
    if (this.tabs().length >= 4) {
	return;

}
    const newTab: Tab = {
      id: self.crypto.randomUUID(),
      name: `Session ${TabManagerService.tabCounter++}`,
      state: this.createNewState(),
    };

    this.tabs.update(tabs => [...tabs, newTab]);
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

    if (this.activeTabId() === id)
{
      const newActiveTab = tabs[tabIndex - 1] || tabs[tabIndex + 1];
      this.selectTab(newActiveTab.id);
    } else {
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
    this.tabs.update(tabs =>
      tabs.map(tab => (tab.id === id ? { ...tab, name: trimmedName } : tab))
    );
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

  importTab(jsonString: string): void {
    if (this.tabs().length >= 4) {
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
      this.selectTab(newTab.id);

    } catch {
      throw new Error('Invalid session file content.');
    }
  }

  scheduleSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveState(), 500);
  }

  private saveState() {
    const serializableState = {
      activeTabId: this.activeTabId(),
      tabCounter: TabManagerService.tabCounter,
      tabs: this.tabs().map(tab => ({
        id: tab.id,
        name: tab.name,
        state: this.serializeTabState(tab.state),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
  }

  private loadState() {
    const savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
      try {
        const savedState = JSON.parse(savedStateJSON);
        TabManagerService.tabCounter = savedState.tabCounter || 1;

        const loadedTabs = savedState.tabs.map((savedTab: any) => ({
            id: savedTab.id,
            name: savedTab.name,
            state: this.deserializeTabState(savedTab.state),
        }));

        this.tabs.set(loadedTabs);
        this.activeTabId.set(savedState.activeTabId);

        if (!this.activeTab()) {
          this.selectTab(this.tabs()[0]?.id);
        }
      } catch {
        this.addTab();
      }
    } else {
      this.addTab();
    }
  }

  private serializeTabState(state: TabState): SerializableTabState {
    const plainState: any = {};
    for (const key in state) {
      let value = (state as any)[key]();
      if (value instanceof Map) {
        value = { __type: 'Map', value: Array.from(value.entries()) };
      } else if (value instanceof Set)
{
        value = { __type: 'Set', value: Array.from(value.values()) };
      }
      plainState[key] = value;
    }
    return plainState;
  }

  private deserializeTabState(plainState: SerializableTabState): TabState {
    const newState = this.createNewState();
    for (const key in plainState) {
        let value = (plainState as any)[key];
        if (value && value.__type === 'Map') {
            (newState as any)[key].set(new Map(value.value));
        } else if (value && value.__type === 'Set')
{
            (newState as any)[key].set(new Set(value.value));
        } else if ((newState as any)[key])
{
            (newState as any)[key].set(value);
        }
    }
    return newState;
  }
}
