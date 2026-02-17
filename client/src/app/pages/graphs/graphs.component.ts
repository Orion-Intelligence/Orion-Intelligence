import { Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Color, Edge, Network, Node } from 'vis-network';
import { DataSet } from 'vis-data';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { CtiSidebarComponent } from './cti-sidebar/cti-sidebar.component';
import { GraphContextMenuComponent } from './context-menu/context-menu.component';
import { NgClass, NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute } from '@angular/router';
import { ProfileComponent } from '../../shared/partials/profile/profile.component';
import {
  ExtendedNode,
  GraphResultItem,
  GraphSessionState,
  GraphSessionTab,
  NodeVisualState
} from '../../shared/model/graph/cti-graph.model';

@Component({
  selector: 'app-graphs',
  standalone: true,
  templateUrl: './graphs.component.html',
  animations: [fadeInDashboardItem],
  imports: [FormsModule, CtiSidebarComponent, GraphContextMenuComponent, ProfileComponent, NgIf, NgClass, NgFor]
})
export class GraphComponent implements OnInit, OnDestroy {
  private readonly maxNodeLabelLength = 28;
  private readonly groupingThreshold = 30;
  private readonly maxGroupSize = 25;
  @ViewChild('networkContainer')
  set networkContainerRef(ref: ElementRef | undefined) {
    if (ref) {
      this.networkContainer = ref;
      this.tryApplyPendingFilters();
    }
  }
  networkContainer?: ElementRef;

  private readonly edgeBaseColor = 'rgba(75, 85, 99, 0.8)';
  private readonly edgeHighlightColor = '#a78bfa';
  private readonly nodeFillColor = '#334155';
  private readonly nodePrimaryBorder = '#818cf8';
  private readonly nodeSecondaryBorder = '#94a3b8';
  private readonly nodeClusterBorder = '#f59e0b';
  private readonly nodeDocumentBorder = '#f97316';
  private readonly nodePropertyBorder = '#38bdf8';
  private readonly nodeFocusColor = '#facc15';
  private readonly nodeGroupBorder = '#7dd3fc';

  private readonly iconMap: Record<string, string> = {
    cluster: 'diagram-3-fill',
    document: 'file-earmark-text-fill',
    property: 'tags-fill',
    encoded: 'code-slash',
    document_id: 'file-earmark-lock-fill',
    ip: 'hdd-network-fill',
    phone: 'telephone-fill',
    email: 'envelope-fill',
    domain: 'globe2',
    url: 'link-45deg',
    country: 'flag-fill',
    file: 'folder-fill',
    card: 'credit-card-2-front-fill',
    crypto: 'currency-bitcoin',
    bank: 'bank2',
    platform: 'cpu-fill',
    company: 'building-fill',
    person: 'person-fill',
    location: 'geo-alt-fill',
    language: 'translate',
    hashtag: 'hash',
    mention: 'at',
    xmpp: 'chat-dots-fill',
    tactic: 'bullseye',
    technique: 'tools',
    script: 'braces'
  };

  public rawNodes: ExtendedNode[] = [];
  public rawEdges: Edge[] = [];
  public nodeSet!: DataSet<ExtendedNode>;
  public edgeSet!: DataSet<Edge>;

  private groupInfo: Record<string, string[]> = {};
  private groupedSubNodesByParent: Record<string, Set<string>> = {};
  private groupParentByGroupId: Record<string, string> = {};
  private groupExpandedState: Record<string, boolean> = {};
  private highlightedNodeId: string | null = null;
  contextMenuNodeId = '';
  private physicsTimeoutId: any = null;
  private readonly minZoomScale = 0.35;
  private minZoomLockPosition: { x: number; y: number } | null = null;
  private readonly originalNodeState = new Map<string, NodeVisualState>();
  private readonly sessionSearchKey = 'cti_graph_node_search';
  private readonly sessionPhysicsKey = 'cti_graph_physics_enabled';

  network!: Network;
  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxEdge: any = 1;
  maxDepth: any = 25;
  loading = false;
  physicsEnabled = true;
  expandEnabled = false;
  isEmpty = false;
  limitReached = false;
  result: any[] = [];
  flattenedDocuments: any[] = [];
  contextMenuNode: ExtendedNode | null = null;
  copied = false;
  copiedX = 0;
  copiedY = 0;
  orignalColor: string | Color = '';
  currentCategory = '';
  isSidebarCollapsed = false;
  isTailwindReady = false;
  nodeSearchText = '';
  isGraphView = true;
  isListingsCollapsed = true;
  searchMatchedCount = 0;
  listRows: Array<{ id: string; label: string; cluster: string }> = [];
  showMaxEdgeNotice = false;
  private readonly twId = 'tw-social';
  private tailwindLinkEl: HTMLLinkElement | null = null;
  private ownsTailwindLink = false;
  private readonly graphType = 'graph';
  private hasLoadedSessions = false;
  private lastSavedSessionSignature = '';
  tabs: GraphSessionTab[] = [];
  activeTabId = '';
  editingTabId: string | null = null;
  isAddMenuVisible = false;
  isHeaderMenuVisible = false;
  private static sessionCounter = 1;
  private pendingFilters: {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
  } | null = null;

  constructor(
    private api: ApiService,
    private clipboard: Clipboard,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.loadTailwindStyles();
    this.restoreSessionState();
    this.loadSessions();
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'all';
      this.propertyType = params['propertyType'] || 'all';
      this.propertyValue = params['propertyValue'] || '';
      this.maxEdge =
        (+params['maxEdge'] > 800 || +params['maxEdge'] < 0) ? '25' : (params['maxEdge'] || '25');
      this.maxDepth =
        (+params['maxDepth'] > 5 || +params['maxDepth'] < 0) ? '1' : (params['maxDepth'] || '1');

      // Keep graph generation independent from sidebar emit timing.
      this.onSidebarApply({
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: Number(this.maxEdge),
        maxDepth: Number(this.maxDepth)
      });
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.ownsTailwindLink) {
      this.tailwindLinkEl?.remove();
      this.tailwindLinkEl = null;
    }
  }

  onSidebarCollapsedChange(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }

  private loadTailwindStyles(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.markTailwindReady();
      return;
    }

    const existingLink = document.getElementById(this.twId) as HTMLLinkElement | null;
    if (existingLink) {
      this.tailwindLinkEl = existingLink;
      if (existingLink.dataset['ready'] === 'true' || !!existingLink.sheet) {
        this.markTailwindReady();
        return;
      }
      existingLink.addEventListener('load', () => this.markTailwindReady(), { once: true });
      existingLink.addEventListener('error', () => this.markTailwindReady(), { once: true });
      return;
    }

    const link = document.createElement('link');
    link.id = this.twId;
    link.rel = 'stylesheet';
    link.href = 'tailwind-social.css';
    link.addEventListener('load', () => {
      link.dataset['ready'] = 'true';
      this.markTailwindReady();
    }, { once: true });
    link.addEventListener('error', () => this.markTailwindReady(), { once: true });
    document.head.appendChild(link);
    this.tailwindLinkEl = link;
    this.ownsTailwindLink = true;
  }

  private markTailwindReady(): void {
    this.isTailwindReady = true;
    this.tryApplyPendingFilters();
  }

  private tryApplyPendingFilters(): void {
    if (!this.isTailwindReady || !this.networkContainer || !this.pendingFilters) {
      return;
    }
    const queued = this.pendingFilters;
    this.pendingFilters = null;
    this.onSidebarApply(queued);
  }

  private createDefaultSessionState(): GraphSessionState {
    return {
      selectedType: 'cluster',
      singleInput: 'all',
      propertyType: 'all',
      propertyValue: '',
      maxEdge: 25,
      maxDepth: 1,
      nodeSearchText: '',
      physicsEnabled: true,
      isGraphView: true,
      isListingsCollapsed: true,
      expandEnabled: false
    };
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `graph-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private getActiveTab(): GraphSessionTab | undefined {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  private saveSessions(): void {
    if (!isPlatformBrowser(this.platformId) || !this.hasLoadedSessions) {
      return;
    }
    const payload = {
      tab_counter: GraphComponent.sessionCounter,
      active_tab_id: this.activeTabId,
      tabs: this.tabs
    };
    const nextSignature = JSON.stringify(payload);
    if (nextSignature === this.lastSavedSessionSignature) {
      return;
    }
    this.api.post<any>(`social/session/upsert?graph_type=${this.graphType}`, payload).subscribe({
      next: () => {
        this.lastSavedSessionSignature = nextSignature;
      },
      error: () => {}
    });
  }

  private loadSessions(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.hasLoadedSessions = true;
      this.addSession();
      return;
    }
    this.api.get<any>(`social/session/tabs?graph_type=${this.graphType}`).subscribe({
      next: (savedState) => {
        const savedTabs = Array.isArray(savedState?.tabs) ? savedState.tabs : [];
        if (savedTabs.length === 0) {
          this.hasLoadedSessions = true;
          this.addSession();
          return;
        }

        this.tabs = savedTabs.map((savedTab: any, index: number) => ({
          id: typeof savedTab?.id === 'string' && savedTab.id.length > 0 ? savedTab.id : this.generateId(),
          name: typeof savedTab?.name === 'string' && savedTab.name.trim().length > 0 ? savedTab.name : `Session ${index + 1}`,
          state: { ...this.createDefaultSessionState(), ...(savedTab?.state || {}) }
        } as GraphSessionTab));

        GraphComponent.sessionCounter = Number(savedState?.tab_counter ?? savedState?.counter) || (this.tabs.length + 1);
        this.activeTabId = savedState?.active_tab_id ?? savedState?.activeTabId ?? this.tabs[0].id;
        if (!this.tabs.some(t => t.id === this.activeTabId)) {
          this.activeTabId = this.tabs[0].id;
        }
        this.hasLoadedSessions = true;
        this.lastSavedSessionSignature = JSON.stringify({
          tab_counter: GraphComponent.sessionCounter,
          active_tab_id: this.activeTabId,
          tabs: this.tabs
        });
        this.applySession(this.activeTabId);
      },
      error: () => {
        this.hasLoadedSessions = true;
        this.addSession();
      }
    });
  }

  addSession(): void {
    const newTab: GraphSessionTab = {
      id: this.generateId(),
      name: `Session ${GraphComponent.sessionCounter++}`,
      state: this.createDefaultSessionState()
    };
    this.tabs = [...this.tabs, newTab];
    this.activeTabId = newTab.id;
    this.applySession(newTab.id);
    this.saveSessions();
  }

  selectSession(id: string): void {
    if (this.activeTabId === id) {
      return;
    }
    this.activeTabId = id;
    this.applySession(id);
    this.saveSessions();
  }

  closeSession(id: string): void {
    if (this.tabs.length <= 1) {
      return;
    }
    const idx = this.tabs.findIndex(t => t.id === id);
    this.tabs = this.tabs.filter(t => t.id !== id);
    if (this.activeTabId === id) {
      const next = this.tabs[idx - 1] || this.tabs[idx] || this.tabs[0];
      this.activeTabId = next.id;
      this.applySession(this.activeTabId);
    }
    this.saveSessions();
  }

  startEditing(id: string): void {
    this.editingTabId = id;
  }

  stopEditing(): void {
    this.editingTabId = null;
  }

  renameSession(id: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) {
      this.stopEditing();
      return;
    }
    this.tabs = this.tabs.map(tab => (tab.id === id ? { ...tab, name: trimmed } : tab));
    this.stopEditing();
    this.saveSessions();
  }

  exportActiveSession(): void {
    const active = this.getActiveTab();
    if (!active) {
      return;
    }
    const jsonString = JSON.stringify({ name: active.name, state: active.state }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = active.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `cti-graph-session-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importSessionFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = String(e.target?.result ?? '');
        const parsed = JSON.parse(content);
        if (!parsed?.state || typeof parsed.state !== 'object') {
          return;
        }
        const imported: GraphSessionTab = {
          id: this.generateId(),
          name: String(parsed.name || `Session ${GraphComponent.sessionCounter++}`),
          state: { ...this.createDefaultSessionState(), ...parsed.state }
        };
        this.tabs = [...this.tabs, imported];
        this.activeTabId = imported.id;
        this.applySession(imported.id);
        this.saveSessions();
      } catch {
      }
    };
    reader.readAsText(input.files[0]);
    input.value = '';
  }

  toggleAddMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAddMenuVisible = !this.isAddMenuVisible;
    this.isHeaderMenuVisible = false;
  }

  toggleHeaderMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isHeaderMenuVisible = !this.isHeaderMenuVisible;
    this.isAddMenuVisible = false;
  }

  closeMenus(): void {
    this.isAddMenuVisible = false;
    this.isHeaderMenuVisible = false;
  }

  private applySession(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) {
      return;
    }
    const s = tab.state;
    this.nodeSearchText = s.nodeSearchText;
    this.physicsEnabled = s.physicsEnabled;
    this.isGraphView = s.isGraphView;
    this.isListingsCollapsed = s.isListingsCollapsed;
    this.expandEnabled = s.expandEnabled;
    this.onSidebarApply({
      selectedType: s.selectedType,
      singleInput: s.singleInput,
      propertyType: s.propertyType,
      propertyValue: s.propertyValue,
      maxEdge: s.maxEdge,
      maxDepth: s.maxDepth
    });
  }

  private updateActiveSessionState(partial: Partial<GraphSessionState>): void {
    const active = this.getActiveTab();
    if (!active) {
      return;
    }
    this.tabs = this.tabs.map(tab =>
      tab.id === active.id ? { ...tab, state: { ...tab.state, ...partial } } : tab
    );
    this.saveSessions();
  }

  resetGraph(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null!;
    }

    if (this.nodeSet) this.nodeSet.clear();
    if (this.edgeSet) this.edgeSet.clear();

    this.nodeSet = new DataSet<ExtendedNode>();
    this.edgeSet = new DataSet<Edge>();

    this.rawNodes = [];
    this.rawEdges = [];
    this.groupInfo = {};
    this.groupedSubNodesByParent = {};
    this.groupParentByGroupId = {};
    this.groupExpandedState = {};
    this.highlightedNodeId = null;
    this.contextMenuNode = null;
    this.contextMenuNodeId = '';
    this.currentCategory = '';
    this.result = [];

    this.originalNodeState.clear();

    const container = this.networkContainer?.nativeElement;
    if (container) container.innerHTML = '';
  }

  loadGraphByNode(data_point_type: string, type: string, value: string, maxEdge: string, maxDepth: string): void {
    this.expandEnabled = false;
    let params = new HttpParams();
    this.loading = false;

    if (data_point_type) params = params.set('data_point_type', data_point_type);
    if (type) params = params.set('model_type', type);
    if (value) params = params.set('query_value', value);
    if (maxEdge) params = params.set('edge', maxEdge);
    if (maxDepth) params = params.set('depth', maxDepth);

    this.resetGraph();

    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', { params }).subscribe({
      next: response => {
        const { results, limit_reached } = response;
        this.result = results;
        this.renderGraph(this.result);
        this.limitReached = limit_reached;
        this.loading = true;
        this.initListings(results);
      },
      error: _ => {
        this.isEmpty = true;
        this.limitReached = false;
        this.loading = true;
      }
    });
  }

  initListings(results: any[]): void {
    this.flattenedDocuments = [];
    this.listRows = [];

    results.forEach(item => {
      const doc = item.vertex;
      const edge = item.edge;

      let path = 'unknown';
      const from = (edge?._from || '').toLowerCase().trim();
      const to = (edge?._to || '').toLowerCase().trim();

      if (from.includes('general') || to.includes('general')) path = 'strategic/all';
      else if (from.includes('leak') || to.includes('leak')) path = 'breach/all';
      else if (from.includes('defacement') || to.includes('defacement')) path = 'defacement/archive';
      else if (from.includes('chat') || to.includes('chat')) path = 'social/telegram';
      else if (from.includes('exploit') || to.includes('exploit')) path = 'exploit/cve';

      if (doc?.type === 'document') {
        const docId = doc.m_document_id || doc._key;
        const docType = doc.type;
        this.listRows.push({
          id: doc?._id ?? '',
          label: doc?._key ?? '',
          cluster: (edge?._from ?? '').split('/').pop() ?? 'unknown'
        });

        Object.entries(doc).forEach(([key, value]) => {
          if (key.startsWith('m_') && Array.isArray(value)) {
            value.forEach(val => {
              this.flattenedDocuments.push({
                m_document_id: docId,
                type: docType,
                property: key,
                value: val,
                path: path
              });
            });
          }
        });
      }
    });
  }

  showContextMenu(node: ExtendedNode) {
    const menu = document.getElementById('customContextMenu');
    if (!menu) return;

    const nodeId = node?.id;
    if (node && node.color) this.orignalColor = node.color;

    if (node && typeof node.id === 'string') {
      const nodeId = node.id;
      const center = this.network.getPositions([nodeId])[nodeId];
      const box = this.network.getBoundingBox(node.id);
      const radiusX = Math.max(16, (box.right - box.left) / 2);
      const topRightDom = this.network.canvasToDOM({
        x: center.x + radiusX,
        y: center.y
      });
      let left = topRightDom.x + 146;
      let top = topRightDom.y - 10;

      const menuWidth = menu.offsetWidth || 256;
      const menuHeight = menu.offsetHeight || 260;
      const viewportPadding = 12;

      if (left + menuWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - menuWidth - viewportPadding;
      }
      if (top + menuHeight > window.innerHeight - viewportPadding) {
        top = window.innerHeight - menuHeight - viewportPadding;
      }
      if (left < viewportPadding) {
        left = viewportPadding;
      }
      if (top < viewportPadding) {
        top = viewportPadding;
      }

      menu.classList.remove('hidden');
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      menu.style.zIndex = '10000';
      this.contextMenuNodeId = node.id;
      this.contextMenuNode = node;
      if (node.color) this.orignalColor = node.color;
      this.nodeSet.update({
        id: nodeId,
        color: {
          border: this.nodeFocusColor,
          background: this.nodeFillColor,
          highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
          hover: { border: this.nodeFocusColor, background: this.nodeFillColor }
        }
      });
    }
  }

  hideContextMenu() {
    const menu = document.getElementById('customContextMenu');
    const listingMenu = document.getElementById('contextMenu');
    if (listingMenu) listingMenu.style.display = 'none';

    if (menu) {
      menu.classList.add('hidden');
      if (this.contextMenuNodeId) {
        this.nodeSet.update({ id: this.contextMenuNodeId, color: this.orignalColor });
      }
    }
  }

  private getEdgeIdsToRemove(fromId: string, toIds: string[]): string[] {
    const sourceId = this.groupParentByGroupId[fromId] ?? fromId;
    return this.rawEdges
      .filter(e => e.from === sourceId && toIds.includes(e.to as string))
      .map(e => e.id as string);
  }

  private removeSubNodesAndEdges(fromId: string, subNodes: string[]): void {
    subNodes.forEach(subId => {
      if (this.nodeSet.get(subId)) this.nodeSet.remove(subId);
    });
    const edgeIdsToRemove = this.getEdgeIdsToRemove(fromId, subNodes);
    this.edgeSet.remove(edgeIdsToRemove);
  }

  private buildCircularSubNodes(
    subNodes: string[],
    centerPos: { x: number; y: number },
    radius: number
  ): ExtendedNode[] {
    const newNodes: ExtendedNode[] = [];
    const denom = subNodes.length || 1;

    subNodes.forEach((subId, index) => {
      if (this.nodeSet.get(subId)) return;

      const rawNode = this.rawNodes.find(n => n.id === subId);
      if (!rawNode) return;

      const angle = (2 * Math.PI * index) / denom;
      const x = centerPos.x + radius * Math.cos(angle);
      const y = centerPos.y + radius * Math.sin(angle);

      newNodes.push({ ...rawNode, x, y, physics: true });
    });

    return newNodes;
  }

  private expandGroupFromNodeId(nodeId: string, subNodes: string[], radius: number): void {
    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (isExpanded) return;

    const sourceId = this.groupParentByGroupId[nodeId] ?? nodeId;
    const centerPos = this.network.getPositions([nodeId])[nodeId];

    const newEdges = this.rawEdges.filter(e => e.from === sourceId && subNodes.includes(e.to as string));
    this.edgeSet.add(newEdges);

    const newNodes = this.buildCircularSubNodes(subNodes, centerPos, radius);
    this.nodeSet.add(newNodes);

    this.groupExpandedState[nodeId] = true;
  }

  private collapseGroupFromNodeId(nodeId: string, subNodes: string[]): void {
    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (!isExpanded) return;
    this.removeSubNodesAndEdges(nodeId, subNodes);
    this.groupExpandedState[nodeId] = false;
  }

  expandGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id as string;

    const subNodes = node.subNodes ?? [];
    if (!nodeId || subNodes.length === 0) return;

    this.expandGroupFromNodeId(nodeId, subNodes, 200);

    this.nodeSet.update({
      id: nodeId,
      color: { background: '#bf80ff', border: '#bf80ff' }
    });
    this.hideContextMenu();
  }

  collapseGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id as string;

    if (!nodeId) return;

    if (node.isGroup && (node.subNodes ?? []).length > 0) {
      this.collapseGroupFromNodeId(nodeId, node.subNodes ?? []);

      this.nodeSet.update({
        id: nodeId,
        color: { background: '#F2F3F4', border: '#F2F3F4' }
      });
    } else {
      this.nodeSet.remove(nodeId);

      const connectedEdgeIds = this.rawEdges
        .filter(e => e.from === nodeId || e.to === nodeId)
        .map(e => e.id as string);

      this.edgeSet.remove(connectedEdgeIds);
    }
    this.hideContextMenu();
  }

  openCTI() {
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    const parts = this.contextMenuNodeId.split('/');
    const singleInput = parts[parts.length - 1];

    const params = new URLSearchParams({
      selectedType: 'document',
      singleInput: singleInput
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
    this.hideContextMenu();
  }

  copyNodeLabel(event: MouseEvent) {
    const _label = this.contextMenuNode?.label;
    if (_label) {
      this.clipboard.copy(_label);
      this.showCopiedMessage(event);
      this.hideContextMenu();
    }
  }

  private hasClusterEdge(nodeId: string, clusterId: string): boolean {
    return this.rawEdges.some(
      edge =>
        (edge.from === nodeId && edge.to === clusterId) ||
        (edge.to === nodeId && edge.from === clusterId)
    );
  }

  private getReportCategory(nodeId: string): string {
    const checks: Array<[string, string]> = [
      ['general', 'cti_vertices/general'],
      ['leak', 'cti_vertices/leak'],
      ['defacement', 'cti_vertices/defacement'],
      ['exploit', 'cti_vertices/exploit'],
      ['chat', 'cti_vertices/chat']
    ];

    for (const [cat, clusterId] of checks) {
      if (this.hasClusterEdge(nodeId, clusterId)) return cat;
    }
    return '';
  }

  viewReport() {
    this.hideContextMenu();

    const nodeId = this.contextMenuNodeId;
    const parts = nodeId.split('/');
    const singleInput = parts[parts.length - 1];

    const category = this.getReportCategory(nodeId);

    const open = (path: string) => window.open(`${window.location.origin}${path}/${singleInput}`, '_blank');

    if (category === 'leak') open('/dashboard/breach/all');
    else if (category === 'defacement') open('/dashboard/defacement/archive');
    else if (category === 'general') open('/dashboard/strategic/all');
    else if (category === 'chat') open('/dashboard/social/telegram');
    else if (category === 'exploit') open('/dashboard/exploit/cve');

    this.hideContextMenu();
  }

  showCopiedMessage(event: MouseEvent) {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    this.copiedX = buttonRect.right + 10;
    this.copiedY = buttonRect.top + window.scrollY;
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }

  onPhysicsToggled(enabled: boolean): void {
    this.physicsEnabled = enabled;
    this.updateActiveSessionState({ physicsEnabled: this.physicsEnabled });
    this.persistSessionState();
    if (this.network) {
      this.network.setOptions({ physics: { enabled } });
    }
  }

  togglePhysics(): void {
    this.onPhysicsToggled(!this.physicsEnabled);
  }

  onNodeSearchChange(value: string): void {
    this.nodeSearchText = value ?? '';
    this.updateActiveSessionState({ nodeSearchText: this.nodeSearchText });
    this.persistSessionState();
    this.applyNodeSearchHighlight();
  }

  setViewMode(isGraphView: boolean): void {
    this.isGraphView = isGraphView;
    this.updateActiveSessionState({ isGraphView: this.isGraphView });
  }

  toggleViewMode(): void {
    this.isGraphView = !this.isGraphView;
    this.updateActiveSessionState({ isGraphView: this.isGraphView });
  }

  toggleListingsCollapsed(): void {
    this.isListingsCollapsed = !this.isListingsCollapsed;
    this.updateActiveSessionState({ isListingsCollapsed: this.isListingsCollapsed });
  }

  toggleExpandCollapseAll(): void {
    this.expandEnabled = !this.expandEnabled;
    this.updateActiveSessionState({ expandEnabled: this.expandEnabled });

    this.nodeSet.get().forEach(node => {
      const groupNode = node as ExtendedNode;
      if (!groupNode.isGroup || !groupNode.subNodes || !groupNode.id) {
        return;
      }

      const nodeId = String(groupNode.id);
      if (this.expandEnabled) {
        this.expandGroupFromNodeId(nodeId, groupNode.subNodes, 200);
      } else {
        this.collapseGroupFromNodeId(nodeId, groupNode.subNodes);
      }
    });

    this.captureOriginalNodeColors();
    this.applyNodeSearchHighlight();
  }

  onSidebarApply(filters: {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
  }): void {
    if (!this.isTailwindReady || !this.networkContainer) {
      this.pendingFilters = { ...filters };
      return;
    }

    this.selectedType = filters.selectedType;
    this.singleInput = filters.singleInput;
    this.propertyType = filters.propertyType;
    this.propertyValue = filters.propertyValue;
    this.maxEdge = filters.maxEdge;
    this.maxDepth = filters.maxDepth;
    this.showMaxEdgeNotice = Number(this.maxEdge) > 50;
    this.updateActiveSessionState({
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: Number(this.maxEdge),
      maxDepth: Number(this.maxDepth)
    });

    if (filters.selectedType === 'property' && filters.propertyType && filters.propertyValue) {
      this.loadGraphByNode(
        this.selectedType,
        filters.propertyType,
        filters.propertyValue,
        this.maxEdge.toString(),
        this.maxDepth.toString()
      );
    } else if ((filters.selectedType === 'cluster' || filters.selectedType === 'document') && filters.singleInput) {
      this.loadGraphByNode(
        this.selectedType,
        filters.selectedType,
        filters.singleInput,
        this.maxEdge.toString(),
        this.maxDepth.toString()
      );
    }
  }

  cleanString(input: string): string {
    const parts = input.replace(/['"]/g, '').split(',');
    const uniqueParts = Array.from(new Set(parts.map(part => part.trim())));
    return uniqueParts[0];
  }

  private renderGraph(data: GraphResultItem[], _ = false): void {
    this.resetGraph();
    this.isEmpty = data.length === 0;

    this.rawNodes = [];
    this.rawEdges = [];
    this.groupInfo = {};
    this.groupedSubNodesByParent = {};
    this.groupParentByGroupId = {};
    this.groupExpandedState = {};

    const edgeMap = this.buildEdgesAndEdgeMap(data);
    const rawNodeMap = this.buildRawNodeMap(data);
    const nodeTypeMap = this.buildNodeTypeMap(data);

    this.rawNodes = this.buildRawNodes(rawNodeMap, nodeTypeMap, edgeMap);

    const { visibleNodes, visibleEdges } = this.buildVisibleSets();
    this.nodeSet = new DataSet(visibleNodes);
    this.edgeSet = new DataSet(visibleEdges);
    this.captureOriginalNodeColors();

    this.initNetwork();
    this.applyPhysicsAutoDisableIfNeeded();
    this.attachNetworkHandlers();
    this.applyPropertyHighlights();
    this.applyNodeSearchHighlight();
  }

  private buildEdgesAndEdgeMap(data: GraphResultItem[]): Record<string, number> {
    const edgeMap: Record<string, number> = {};

    data.forEach(item => {
      const e = item.edge;
      if (!e || !e._from || !e._to) return;

      this.rawEdges.push({
        id: e._id || `${e._from}->${e._to}`,
        from: e._from,
        to: e._to,
        arrows: '',
        color: { color: this.edgeBaseColor },
        width: 1.5
      });

      edgeMap[e._from] = (edgeMap[e._from] || 0) + 1;
    });

    return edgeMap;
  }

  private toTitleCase(input: string): string {
    return input.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  private truncateLabel(label: string): string {
    const text = label.trim();
    if (text.length <= this.maxNodeLabelLength) return text;
    return `${text.slice(0, this.maxNodeLabelLength - 1)}…`;
  }

  private prettifyLabel(rawLabel: string): string {
    const base = rawLabel.split('/').pop() ?? rawLabel;
    const withoutPrefix = base.replace(/^m_/, '');
    const [rawKey, ...rawValueParts] = withoutPrefix.split(':');
    const key = this.toTitleCase(rawKey.replace(/_/g, ' ').trim());
    if (rawValueParts.length === 0) {
      return this.truncateLabel(key);
    }
    const value = rawValueParts.join(':').replace(/_/g, ' ').trim();
    return this.truncateLabel(`${key}: ${value}`);
  }

  private normalizeLabel(v: any): string {
    const rawLabel = String(v?._key ?? v?._id ?? '');
    return this.prettifyLabel(rawLabel);
  }

  private extractPropertyKey(vertex: any): string | null {
    const key = String(vertex?._key ?? '').toLowerCase();
    const match = key.match(/m_[a-z0-9_]+/);
    return match ? match[0] : null;
  }

  private extractPropertyKeyFromLabel(label: string | undefined): string | null {
    if (!label) return null;
    const normalized = label.toLowerCase().replace(/\s+/g, '_');
    const match = normalized.match(/m_[a-z0-9_]+/);
    if (match) return match[0];
    return normalized;
  }

  private getBorderColorForType(type: string): string {
    if (type === 'cluster') return this.nodeClusterBorder;
    if (type === 'document') return this.nodeDocumentBorder;
    if (type === 'property') return this.nodePropertyBorder;
    return this.nodeSecondaryBorder;
  }

  private getIconNameForNode(node: ExtendedNode, type: string): string {
    if (node.isGroup) return this.iconMap['cluster'];
    if (type === 'cluster') return this.iconMap['cluster'];
    if (type === 'document') return this.iconMap['document'];
    if (type !== 'property') return this.iconMap['property'];

    const rawKey = (node.propertyKey ?? '').toLowerCase();
    const labelKey = this.extractPropertyKeyFromLabel(node.label?.toString()) ?? '';
    const key = rawKey || labelKey;
    const tokens = [key, key.replace(/^m_/, ''), key.replace(/_/g, ' ')];

    for (const token of tokens) {
      for (const [needle, icon] of Object.entries(this.iconMap)) {
        if (needle === 'cluster' || needle === 'document' || needle === 'property') continue;
        if (token.includes(needle)) return icon;
      }
    }

    return this.iconMap['property'];
  }

  private buildIconSvg(iconName: string, borderColor: string): string | null {
    const def = BOOTSTRAP_ICON_PATHS[iconName];
    if (!def) return null;
    const paths = def.paths.map(d => `<path d="${d}" fill="#e2e8f0"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox}"><circle cx="8" cy="8" r="7.5" fill="${this.nodeFillColor}" stroke="${borderColor}" stroke-width="0.5"/><g transform="translate(4 4) scale(0.5)">${paths}</g></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  private buildRawNodeMap(data: GraphResultItem[]): Map<string, ExtendedNode> {
    const rawNodeMap = new Map<string, ExtendedNode>();

    const put = (vertex: any, color: string) => {
      const id = vertex?._id;
      if (!id || rawNodeMap.has(id)) return;

      rawNodeMap.set(id, {
        id,
        label: this.normalizeLabel(vertex),
        propertyKey: this.extractPropertyKey(vertex),
        color: {
          border: color,
          background: this.nodeFillColor,
          highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
          hover: { border: '#a5b4fc', background: this.nodeFillColor }
        },
        shape: 'dot',
        font: { size: 14, color: '#e5e7eb' },
        size: 18
      });
    };

    data.forEach(item => {
      put(item.vertex, this.nodePrimaryBorder);
      (item.path?.vertices ?? []).forEach(pv => put(pv, this.nodeSecondaryBorder));
    });

    return rawNodeMap;
  }

  private buildNodeTypeMap(data: GraphResultItem[]): Record<string, string> {
    const nodeTypeMap: Record<string, string> = {};

    data.forEach(item => {
      if (item?.vertex?._id) nodeTypeMap[item.vertex._id] = item.vertex.type || '';
      (item.path?.vertices ?? []).forEach(pv => {
        if (pv?._id && pv?.type) nodeTypeMap[pv._id] = pv.type;
      });
    });

    return nodeTypeMap;
  }

  private buildRawNodes(
    rawNodeMap: Map<string, ExtendedNode>,
    nodeTypeMap: Record<string, string>,
    edgeMap: Record<string, number>
  ): ExtendedNode[] {
    const nodes: ExtendedNode[] = [];

    rawNodeMap.forEach(node => {
      const nodeId = node.id as string;
      const nodeType = nodeTypeMap[nodeId] || '';
      const isClusterNode = nodeType === 'cluster';
      node.nodeType = nodeType;
      if (!node.propertyKey) {
        node.propertyKey = this.extractPropertyKeyFromLabel(node.label?.toString());
      }

      let degree = edgeMap[nodeId] || 0;
      if (this.expandEnabled) degree = 0;

      const isGroupable = degree > 2 && !isClusterNode;

      if (isGroupable) {
        const subNodes = this.rawEdges.filter(e => e.from === node.id).map(e => e.to as string);
        if (subNodes.length > this.groupingThreshold) {
          node.physics = false;
          this.applyNonGroupNodeColor(node, isClusterNode, edgeMap);
          const parentIconName = this.getIconNameForNode(node, nodeType);
          const parentBorderColor = this.getBorderColorForType(nodeType);
          const parentIcon = this.buildIconSvg(parentIconName, parentBorderColor);
          if (parentIcon) {
            node.shape = 'circularImage';
            node.image = parentIcon;
            node.size = 40;
            node.borderWidth = 0;
          }
          nodes.push(node);

          const sortedSubNodes = [...subNodes];
          const totalGroups = Math.ceil(sortedSubNodes.length / this.maxGroupSize);
          const chunkSize = Math.ceil(sortedSubNodes.length / totalGroups);
          const groupedSubNodes = new Set<string>();

          for (let index = 0; index < totalGroups; index++) {
            const chunk = sortedSubNodes.slice(index * chunkSize, (index + 1) * chunkSize);
            const groupId = `${nodeId}::group::${index + 1}`;
            chunk.forEach(subNodeId => groupedSubNodes.add(subNodeId));
            this.groupInfo[groupId] = chunk;
            this.groupParentByGroupId[groupId] = nodeId;

            const start = index * chunkSize + 1;
            const end = start + chunk.length - 1;

            nodes.push({
              id: groupId,
              label: this.truncateLabel(`Group ${start}-${end} (${chunk.length})`),
              color: { border: this.nodeGroupBorder, background: 'transparent' },
              shape: 'circularImage',
              isGroup: true,
              physics: false,
              subNodes: chunk,
              font: { size: 12, color: '#e5e7eb', strokeWidth: 1 },
              size: 40,
              image: this.buildIconSvg(this.iconMap['cluster'], this.nodeGroupBorder) ?? undefined,
              borderWidth: 0
            });

            this.rawEdges.push({
              id: `${nodeId}->${groupId}`,
              from: nodeId,
              to: groupId,
              arrows: '',
              color: { color: this.edgeBaseColor },
              width: 1.5
            });
          }

          this.groupedSubNodesByParent[nodeId] = groupedSubNodes;
          return;
        }

        this.groupInfo[nodeId] = subNodes;
        this.groupParentByGroupId[nodeId] = nodeId;

        nodes.push({
          id: node.id,
          label: this.truncateLabel(`Group ${node.label} (${subNodes.length})`),
          color: node.id === 'cti_vertices/' + this.singleInput
            ? { border: this.nodeFocusColor, background: this.nodeFillColor }
            : { border: this.nodeGroupBorder, background: 'transparent' },
          shape: 'circularImage',
          isGroup: true,
          physics: false,
          subNodes,
          font: { size: 14, color: '#e5e7eb', strokeWidth: 1 },
          size: 40,
          image: this.buildIconSvg(this.iconMap['cluster'], this.nodeGroupBorder) ?? undefined,
          borderWidth: 0
        });

        this.groupedSubNodesByParent[nodeId] = new Set(subNodes);
        return;
      }

      this.applyNonGroupNodeColor(node, isClusterNode, edgeMap);
      if (isClusterNode) {
        node.physics = false;
      }
      const iconName = this.getIconNameForNode(node, nodeType);
      const borderColor = this.getBorderColorForType(nodeType);
      const icon = this.buildIconSvg(iconName, borderColor);
      if (icon) {
        node.shape = 'circularImage';
        node.image = icon;
        node.size = 40;
        node.borderWidth = 0;
      }
      nodes.push(node);
    });

    return nodes;
  }

  private applyNonGroupNodeColor(node: ExtendedNode, isClusterNode: boolean, edgeMap: Record<string, number>): void {
    if (isClusterNode) {
      if (this.currentCategory === '') {
        this.currentCategory = this.cleanString(node.label || '');
      }
      node.color = {
        border: this.nodeClusterBorder,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: '#fde68a', background: this.nodeFillColor }
      };
      return;
    }

    const hasOutgoing = edgeMap[node.id as string];
    if (hasOutgoing) return;

    if (this.selectedType == 'cluster') {
      node.color = {
        border: this.nodeClusterBorder,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: '#fde68a', background: this.nodeFillColor }
      };
    }
    else if (this.selectedType == 'document') {
      node.color = {
        border: this.nodeDocumentBorder,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: '#fdba74', background: this.nodeFillColor }
      };
    }
    else if (this.propertyValue && String(node.id).includes(this.propertyValue)) {
      node.color = {
        border: this.nodeFocusColor,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: this.nodeFocusColor, background: this.nodeFillColor }
      };
    }
    else {
      node.color = {
        border: this.nodePropertyBorder,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: '#7dd3fc', background: this.nodeFillColor }
      };
    }
  }

  private buildVisibleSets(): { visibleNodes: ExtendedNode[]; visibleEdges: Edge[] } {
    const groupedSubNodeIds = new Set(Object.values(this.groupInfo).flat());

    const visibleNodes = this.rawNodes.filter(node => node.isGroup || !groupedSubNodeIds.has(node.id as string));

    const visibleEdges = this.rawEdges.filter(edge => {
      const fromId = String(edge.from ?? '');
      const toId = String(edge.to ?? '');
      const subNodes = this.groupedSubNodesByParent[fromId];
      return !(subNodes && subNodes.has(toId));
    });

    return { visibleNodes, visibleEdges };
  }

  private initNetwork(): void {
    if (!this.networkContainer) {
      return;
    }
    const container = this.networkContainer.nativeElement;

    this.network = new Network(
      container,
      { nodes: this.nodeSet, edges: this.edgeSet },
      {
        physics: {
          enabled: this.physicsEnabled,
          solver: 'forceAtlas2Based',
          timestep: 1,
          stabilization: { iterations: 1000, fit: true },
          forceAtlas2Based: {
            gravitationalConstant: -80,
            centralGravity: 0.003,
            springLength: 220,
            springConstant: 0.08,
            avoidOverlap: 1,
            damping: 0.6
          },
          maxVelocity: 100,
          minVelocity: 0.75
        },
        edges: {
          arrows: { to: { enabled: false, scaleFactor: 1 } },
          width: 1.5,
          smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
          color: {
            color: 'rgba(75, 85, 99, 0.8)',
            highlight: '#a78bfa',
            hover: '#d1d5db'
          }
        },
        nodes: {
          shape: 'dot',
          size: 18,
          borderWidth: 0.5,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.5)',
            size: 10,
            x: 5,
            y: 5
          },
          shapeProperties: {
            useBorderWithImage: true
          },
          font: { size: 14, color: '#e5e7eb' },
          color: {
            highlight: { border: '#c4b5fd', background: '#6d28d9' },
            hover: { border: '#a5b4fc', background: '#5b21b6' }
          }
        },
        interaction: {
          selectConnectedEdges: false,
          tooltipDelay: 100,
          hideEdgesOnDrag: false,
          hover: true,
          navigationButtons: false,
          keyboard: true,
          zoomView: true,
          dragView: true
        },
        layout: {
          improvedLayout: true
        }
      }
    );

    container.addEventListener('contextmenu', (e: { preventDefault: () => any }) => e.preventDefault());
  }

  private applyPhysicsAutoDisableIfNeeded(): void {
    if (this.physicsTimeoutId !== null) {
      clearTimeout(this.physicsTimeoutId);
      this.physicsTimeoutId = null;
    }

    if (this.physicsEnabled) return;

    if (this.network) this.network.setOptions({ physics: { enabled: true } });

    this.physicsTimeoutId = setTimeout(() => {
      this.physicsEnabled = false;
      if (this.network) this.network.setOptions({ physics: { enabled: false } });
      this.physicsTimeoutId = null;
    }, 1500);
  }

  private attachNetworkHandlers(): void {
    this.network.on('oncontext', params => this.handleContextMenu(params));
    this.network.on('click', params => this.handleClick(params));
    this.network.on('zoom', (properties: any) => {
      const currentScale = this.network.getScale();
      const currentPosition = this.network.getViewPosition();

      if (currentScale <= this.minZoomScale) {
        const lockPosition = this.minZoomLockPosition ?? currentPosition;
        this.minZoomLockPosition = lockPosition;

        if (properties?.direction === '-') {
          this.network.moveTo({ scale: this.minZoomScale, position: lockPosition, animation: false });
        } else {
          this.network.moveTo({ scale: this.minZoomScale, animation: false });
        }
      } else {
        this.minZoomLockPosition = currentPosition;
      }
    });
  }

  private handleContextMenu(params: any): void {
    this.hideContextMenu();

    const pointer = params.pointer.DOM;
    const rawNodeId = this.network.getNodeAt(pointer);

    if (!rawNodeId) {
      this.hideContextMenu();
      return;
    }

    const nodeId = String(rawNodeId);
    const node = this.nodeSet.get(nodeId) as ExtendedNode;

    const clusterNodeIds = new Set([
      'cti_vertices/general',
      'cti_vertices/defacement',
      'cti_vertices/leak',
      'cti_vertices/chat',
      'cti_vertices/exploit'
    ]);

    const hasClusterConnection = this.rawEdges.some(
      edge =>
        (edge.from === node?.id && clusterNodeIds.has(edge.to as string)) ||
        (edge.to === node?.id && clusterNodeIds.has(edge.from as string))
    );

    if (!hasClusterConnection || !node) return;

    this.showContextMenu(node);
  }

  private handleClick(params: any): void {
    this.hideContextMenu();

    const pointer = params.pointer.DOM;
    const nodeIdRaw = this.network.getNodeAt(pointer);
    if (!nodeIdRaw) return;

    const nodeId = String(nodeIdRaw);
    const node = this.nodeSet.get(nodeId) as ExtendedNode;

    if (node?.isGroup && node.subNodes) {
      this.toggleGroupOnClick(nodeId, node);
      return;
    }

    this.toggleEdgeHighlightOnClick(nodeId);
  }

  private toggleGroupOnClick(nodeId: string, node: ExtendedNode): void {
    const subNodes = node.subNodes ?? [];
    const isExpanded = this.groupExpandedState[nodeId] || false;

    if (!isExpanded) {
      const centerPos = this.network.getPositions([nodeId])[nodeId];
      const radius = 200;

      const newEdges = this.rawEdges
        .filter(e => e.from === nodeId && subNodes.includes(e.to as string))
        .filter(e => !this.edgeSet.get(e.id!));

      const newNodes = this.buildCircularSubNodes(subNodes, centerPos, radius);

      this.nodeSet.add(newNodes);
      this.edgeSet.add(newEdges);
      this.captureOriginalNodeColors(newNodes.map(n => String(n.id)));
      this.applyNodeSearchHighlight();

      this.groupExpandedState[nodeId] = true;
      this.network.selectNodes([nodeId]);
      this.network.unselectAll();
      return;
    }

    const edgeIdsToRemove = this.getEdgeIdsToRemove(nodeId, subNodes);
    this.edgeSet.remove(edgeIdsToRemove);

    subNodes.forEach(subId => {
      const remainingEdges = this.edgeSet.get({
        filter: edge => edge.from === subId || edge.to === subId
      });

      if (remainingEdges.length === 0 && this.nodeSet.get(subId)) {
        this.nodeSet.remove(subId);
      }
    });

    this.groupExpandedState[nodeId] = false;

    if (this.orignalColor) {
      this.nodeSet.update({ id: nodeId, color: this.orignalColor });
    }
    this.captureOriginalNodeColors();
    this.applyNodeSearchHighlight();
  }

  private toggleEdgeHighlightOnClick(nodeId: string): void {
    const isSameNodeClicked = this.highlightedNodeId === nodeId;

    const allEdges = this.edgeSet.get();
    const resetEdges = allEdges
      .filter(e => e.id)
      .map(e => ({
        id: e.id!,
        color: { color: this.edgeBaseColor },
        width: 1.5
      }));
    this.edgeSet.update(resetEdges);

    if (isSameNodeClicked) {
      this.highlightedNodeId = null;
      return;
    }

    const connectedEdges = this.edgeSet.get({
      filter: edge => edge.from === nodeId || edge.to === nodeId
    });

    const highlightEdges = connectedEdges
      .filter(e => e.id)
      .map(e => ({
        id: e.id!,
        color: { color: this.edgeHighlightColor },
        width: 2.5
      }));
    this.edgeSet.update(highlightEdges);

    this.highlightedNodeId = String(nodeId);
  }

  private applyPropertyHighlights(): void {
    const needle = (this.propertyValue || '').toLowerCase();
    if (!needle) return;

    const matchedNodeIds: string[] = [];

    this.nodeSet.get().forEach(node => {
      const label = (node.label || '').toString().toLowerCase();
      if (!label.includes(needle)) return;

      matchedNodeIds.push(node.id as string);
      this.nodeSet.update({
        id: node.id,
        color: {
          border: this.nodeFocusColor,
          background: this.nodeFillColor,
          highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
          hover: { border: this.nodeFocusColor, background: this.nodeFillColor }
        }
      });
    });

    const matchedEdges = this.edgeSet.get({
      filter: edge => matchedNodeIds.includes(edge.from as string) || matchedNodeIds.includes(edge.to as string)
    });

    this.edgeSet.update(
      matchedEdges.map(edge => ({
        id: edge.id!,
        color: { color: this.edgeHighlightColor },
        dashes: true,
        width: 2.5,
        arrows: { to: { enabled: false } }
      }))
    );
  }

  private captureOriginalNodeColors(nodeIds?: string[]): void {
    const nodes: ExtendedNode[] = [];

    if (nodeIds) {
      nodeIds.forEach(id => {
        const node = this.nodeSet.get(id) as ExtendedNode | null;
        if (node) {
          nodes.push(node);
        }
      });
    } else {
      nodes.push(...(this.nodeSet.get() as ExtendedNode[]));
    }

    nodes.forEach(node => {
      if (!node?.id) {
        return;
      }
      this.originalNodeState.set(String(node.id), {
        color: node.color ?? '',
        borderWidth: (node as any).borderWidth,
        borderWidthSelected: (node as any).borderWidthSelected,
        image: (node as any).image
      });
    });
  }

  private restoreNodeColors(): void {
    const updates = this.nodeSet.get().map(node => ({
      id: node.id!,
      color: this.originalNodeState.get(String(node.id))?.color ?? node.color,
      borderWidth: this.originalNodeState.get(String(node.id))?.borderWidth ?? (node as any).borderWidth,
      image: this.originalNodeState.get(String(node.id))?.image ?? (node as any).image
    }));
    if (updates.length > 0) {
      this.nodeSet.update(updates);
    }
  }

  private applyNodeSearchHighlight(): void {
    if (!this.nodeSet) {
      return;
    }

    const needle = this.nodeSearchText.trim().toLowerCase();
    this.searchMatchedCount = 0;
    this.restoreNodeColors();

    if (!needle) {
      return;
    }

    const updates = this.nodeSet.get()
      .filter(node => {
        const label = String(node.label ?? '').toLowerCase();
        const id = String(node.id ?? '').toLowerCase();
        return label.includes(needle) || id.includes(needle);
      })
      .map(node => {
        const nodeState = this.originalNodeState.get(String(node.id));
        const originalColor = nodeState?.color ?? node.color;
        const highlightedColor = typeof originalColor === 'object' && originalColor !== null
          ? {
              ...(originalColor as any),
              border: '#facc15',
              background: '#facc15',
              highlight: { border: '#facc15', background: '#facc15' },
              hover: { border: '#facc15', background: '#facc15' }
            }
          : {
              border: '#facc15',
              background: '#facc15',
              highlight: { border: '#facc15', background: '#facc15' },
              hover: { border: '#facc15', background: '#facc15' }
            };
        const baseBorderWidth = nodeState?.borderWidth ?? ((node as any).borderWidth ?? 2);
        const selectedBorderWidth = nodeState?.borderWidthSelected ?? ((node as any).borderWidthSelected ?? (baseBorderWidth + 2));
        const extNode = node as ExtendedNode;
        const iconName = this.getIconNameForNode(extNode, extNode.nodeType || '');
        const yellowIcon = this.buildIconSvg(iconName, '#facc15');

        return {
          id: node.id!,
          color: highlightedColor,
          borderWidth: selectedBorderWidth,
          image: yellowIcon ?? (node as any).image
        };
      });

    this.searchMatchedCount = updates.length;
    if (updates.length > 0) {
      this.nodeSet.update(updates);
    }
  }

  private restoreSessionState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedSearch = window.sessionStorage.getItem(this.sessionSearchKey);
    const savedPhysics = window.sessionStorage.getItem(this.sessionPhysicsKey);

    if (savedSearch !== null) {
      this.nodeSearchText = savedSearch;
    }

    if (savedPhysics !== null) {
      this.physicsEnabled = savedPhysics === 'true';
    }
  }

  private persistSessionState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.sessionStorage.setItem(this.sessionSearchKey, this.nodeSearchText);
    window.sessionStorage.setItem(this.sessionPhysicsKey, String(this.physicsEnabled));
  }
}

const BOOTSTRAP_ICON_PATHS: Record<string, { viewBox: string; paths: string[] }> = {
  'diagram-3-fill': { viewBox: '0 0 16 16', paths: [
    'M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5z',
  ] },
  'file-earmark-text-fill': { viewBox: '0 0 16 16', paths: [
    'M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z',
  ] },
  'tags-fill': { viewBox: '0 0 16 16', paths: [
    'M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
    'M1.293 7.793A1 1 0 0 1 1 7.086V2a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l.043-.043z',
  ] },
};
