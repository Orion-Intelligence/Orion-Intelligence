import { Injectable, signal, computed } from '@angular/core';
import { Job, PlatformResult, TabState, SerializableTabState, Tab } from '../../../../shared/model/social/social-scan.models';
import { ApiService } from '../../../../shared/services/api.service';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { GraphReportExportType, GraphReportPayload, GraphReportTableRow } from '../../../../shared/model/report/report-export.model';
@Injectable({
  providedIn: 'root',
})
export class TabManagerService {
  private readonly maxTabsAllowed = 5;
  private readonly sessionType = 'social';
  private readonly saveDebounceMs = 300;
  private static tabCounter = 1;
  private hasLoadedState = false;
  private hasPendingSave = false;
  private saveTimeoutId: any;
  private isSaveInFlight = false;
  private shouldResaveAfterCurrent = false;
  private lastSavedSignature = '';

  tabs = signal<Tab[]>([]);
  activeTabId = signal<string>('');
  editingTabId = signal<string | null>(null);
  activeTab = computed(() => this.tabs().find(t => t.id === this.activeTabId()));

  constructor(private api: ApiService, private graphReportExport: ReportExportService) {
    this.loadState();
  }

  private createNewState(): TabState {
    return {
      homeMenuSearchTerm: signal(''),
      jobs: signal<Job[]>([]),
      scanResults: signal(new Map<string, PlatformResult[]>()),
      isHomeMenuCollapsed: signal(false),
      activeUsername: signal<string | null>(null),
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
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }
    this.saveTimeoutId = setTimeout(() => {
      this.saveTimeoutId = null;
      this.flushScheduledSave();
    }, this.saveDebounceMs);
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

  private flushScheduledSave() {
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
    if (this.isSaveInFlight) {
      this.shouldResaveAfterCurrent = true;
      return;
    }
    const serializableState = this.buildSerializableState();
    const nextSignature = JSON.stringify(serializableState);
    if (nextSignature === this.lastSavedSignature) {
      this.hasPendingSave = false;
      return;
    }
    this.isSaveInFlight = true;
    this.api.post<any>(`social/session/upsert?graph_type=${this.sessionType}`, serializableState).subscribe({
      next: () => {
        this.lastSavedSignature = nextSignature;
        this.hasPendingSave = false;
        this.isSaveInFlight = false;
        if (this.shouldResaveAfterCurrent) {
          this.shouldResaveAfterCurrent = false;
          this.scheduleSave();
        }
      },
      error: () => {
        this.isSaveInFlight = false;
        if (this.shouldResaveAfterCurrent) {
          this.shouldResaveAfterCurrent = false;
          this.scheduleSave();
        }
      },
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
    this.api.post<any>(`social/session/tab/add?graph_type=${this.sessionType}`, tabPayload).subscribe();
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
    this.api.get<any>(`social/session/tabs?graph_type=${this.sessionType}`).subscribe({
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
      const target = (newState as any)[key];
      if (!target) {
        continue;
      }
      let value = (plainState as any)[key];
      if (value && value.__type === 'Map') {
        target.set(new Map(value.value));
      }
      else if (value && value.__type === 'Set') {
        target.set(new Set(value.value));
      }
      else {
        target.set(value);
      }
    }
    return newState;
  }

  private buildSocialReportPayload(): GraphReportPayload | null {
    const active = this.activeTab();
    if (!active) {
      return null;
    }
    const platforms = Array.from(active.state.scanResults().values()).flat();
    const scannedUsers = active.state.scanResults().size;
    const completedJobs = active.state.jobs().filter(job => job.status === 'completed').length;
    const tables: GraphReportTableRow[] = platforms.length > 0
      ? [{
        title: 'Social Scan Snapshot',
        values: {
          profiles: String(platforms.length),
          scannedUsers: String(scannedUsers),
          completedJobs: String(completedJobs),
        }
      }]
      : [];
    return {
      graphKind: 'social',
      title: 'Social Intelligence Report',
      sessionName: active.name,
      generatedAtIso: new Date().toISOString(),
      nodes: [],
      edges: [],
      summary: {
        scannedUsers,
        scannedPlatforms: platforms.length,
        completedJobs
      },
      tables
    };
  }
}
