import { Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute, Params } from '@angular/router';
import { Edge, Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { ApiService } from '../../../shared/services/api.service';
import { CtiSidebarComponent } from './cti-sidebar/cti-sidebar.component';
import { GraphContextMenuComponent } from './context-menu/context-menu.component';
import { isPlatformBrowser } from '@angular/common';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { Clipboard } from '@angular/cdk/clipboard';
import { GraphToolbarComponent } from '../shared/graph-toolbar/graph-toolbar.component';
import { ExpandToggleButtonComponent } from './expand-toggle-button/expand-toggle-button.component';
import { ExportChoiceModalComponent } from '../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { CtiGraphFilters, ExtendedNode, GraphResultItem, NodeVisualState } from '../../../shared/model/graph/cti-graph.model';
import { ReportExportService } from '../../../shared/services/report-export.service';
import { GraphReportExportType, GraphReportPayload } from '../../../shared/model/report/report-export.model';
import { GRAPH_REPORT_EXPORT_OPTIONS } from '../../../shared/model/report/export-choice.model';
import { ensureStylesheet } from '../../../shared/utils/ensure-stylesheet.util';
import { ProxyController } from '../../../shared/services/proxy-controller';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ProfileComponent } from '../../../shared/partials/profile/profile.component';

type GraphNodeColor = NonNullable<ExtendedNode['color']>;
@Component({
  selector: 'app-graphs',
  standalone: true,
  templateUrl: './graphs.component.html',
  animations: [fadeInDashboardItem],
  imports: [CtiSidebarComponent, GraphContextMenuComponent, GraphToolbarComponent, ExpandToggleButtonComponent, ExportChoiceModalComponent, ProfileComponent, TranslatePipe]
})
export class GraphComponent implements OnInit, OnDestroy {
  private readonly proxied_resource = inject(ProxyController);
  private readonly maxNodeLabelLength = 28;
  private readonly edgeBaseColor = 'rgba(75, 85, 99, 0.8)';
  private readonly edgeHighlightColor = '#a78bfa';
  private readonly nodeFillColor = '#334155';
  private readonly nodePrimaryBorder = '#818cf8';
  private readonly nodeSecondaryBorder = '#94a3b8';
  private readonly nodeClusterBorder = '#f59e0b';
  private readonly nodeDocumentBorder = '#f97316';
  private readonly nodePropertyBorder = '#38bdf8';
  private readonly nodeFocusColor = '#facc15';
  private readonly iconMap: Record<string, string> = { cluster: 'diagram-3-fill', document: 'file-earmark-text-fill', property: 'tags-fill', encoded: 'code-slash', document_id: 'file-earmark-lock-fill', ip: 'hdd-network-fill', phone: 'telephone-fill', email: 'envelope-fill', domain: 'globe2', url: 'link-45deg', country: 'flag-fill', file: 'folder-fill', card: 'credit-card-2-front-fill', crypto: 'currency-bitcoin', bank: 'bank2', platform: 'cpu-fill', company: 'building-fill', person: 'person-fill', location: 'geo-alt-fill', language: 'translate', hashtag: 'hash', mention: 'at', xmpp: 'chat-dots-fill', tactic: 'bullseye', technique: 'tools', script: 'braces' };
  private groupInfo: Record<string, string[]> = {};
  private groupedSubNodesByParent: Record<string, Set<string>> = {};
  private groupParentByGroupId: Record<string, string> = {};
  private groupExpandedState: Record<string, boolean> = {};
  private highlightedNodeId: string | null = null;
  private physicsTimeoutId: any = null;
  private readonly minZoomScale = 0.35;
  private minZoomLockPosition: { x: number; y: number; } | null = null;
  private readonly originalNodeState = new Map<string, NodeVisualState>();
  private readonly clusterNodePrefix = 'cti_vertices/';
  private nodeTypeById: Record<string, string> = {};
  private readonly globalKeyDownListener = (event: KeyboardEvent) => {
    if (!this.network) {
      return;
    }
    const eventTargetElement = event.target as HTMLElement | null;
    const tag = eventTargetElement?.tagName?.toLowerCase() || '';
    const isEditable = !!eventTargetElement?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
    if (isEditable) {
      return;
    }
    const panStep = 60;
    const current = this.network.getViewPosition();
    let nextX = current.x;
    let nextY = current.y;
    if (event.key === 'ArrowLeft') {
      nextX -= panStep;
    }
    else if (event.key === 'ArrowRight') {
      nextX += panStep;
    }
    else if (event.key === 'ArrowUp') {
      nextY -= panStep;
    }
    else if (event.key === 'ArrowDown') {
      nextY += panStep;
    }
    else {
      return;
    }
    event.preventDefault();
    this.network.moveTo({
      position: { x: nextX, y: nextY },
      animation: false
    });
  };
  private pendingFilters: CtiGraphFilters | null = null;

  networkContainer?: ElementRef;
  public rawNodes: ExtendedNode[] = [];
  public rawEdges: Edge[] = [];
  public nodeSet!: DataSet<ExtendedNode>;
  public edgeSet!: DataSet<Edge>;
  contextMenuNodeId = '';
  contextCanExpand = false;
  contextCanCollapse = false;
  contextShowOpenCti = false;
  contextShowOpenReport = false;
  network!: Network;
  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxEdge = 25;
  maxDepth = 1;
  loading = false;
  physicsEnabled = true;
  expandEnabled = false;
  isEmpty = false;
  result: any[] = [];
  contextMenuNode: ExtendedNode | null = null;
  copied = false;
  orignalColor: GraphNodeColor = '';
  isSidebarCollapsed = false;
  nodeSearchText = '';
  searchMatchedCount = 0;
  showMaxEdgeNotice = false;
  isReportExportModalOpen = false;
  readonly graphExportOptions = GRAPH_REPORT_EXPORT_OPTIONS;

  private getNodeLabelColor(): string {
    if (isPlatformBrowser(this.platformId)) {
      const bodyColor = getComputedStyle(document.body).getPropertyValue('--color-text1').trim();
      if (bodyColor) {
        return bodyColor;
      }
      const rootColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text1').trim();
      if (rootColor) {
        return rootColor;
      }
    }
    return '#e5e7eb';
  }

  @ViewChild('networkContainer')
  set networkContainerRef(ref: ElementRef) {
    if (ref) {
      this.networkContainer = ref;
      this.tryApplyPendingFilters();
    }
  }

  constructor( private api: ApiService, private clipboard: Clipboard, private route: ActivatedRoute, private graphReportExport: ReportExportService, @Inject(PLATFORM_ID) private platformId: object ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      ensureStylesheet('/assets/libs/vis-network.css', 'vis-network-styles');
      document.addEventListener('keydown', this.globalKeyDownListener, true);
    }
    this.route.queryParams.subscribe(params => {
      const routeFilters = this.buildRouteFilterOverride(params);
      if (routeFilters) {
        this.applyFilterValues(routeFilters);
      }
      this.applyCurrentFilters();
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('keydown', this.globalKeyDownListener, true);
    }
  }

  goBack(): void {
    if (isPlatformBrowser(this.platformId) && window.history.length > 1) {
      window.history.back();
    }
  }

  onSidebarCollapsedChange(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }

  private tryApplyPendingFilters(): void {
    if (!this.networkContainer || !this.pendingFilters) {
      return;
    }
    const queued = this.pendingFilters;
    this.pendingFilters = null;
    this.onSidebarApply(queued);
  }

  private buildRouteFilterOverride(params: Params): CtiGraphFilters | null {
    const selectedType = String(params['selectedType'] ?? '').trim();
    const singleInput = String(params['singleInput'] ?? '').trim();
    const propertyType = String(params['propertyType'] ?? '').trim();
    const propertyValue = String(params['propertyValue'] ?? '').trim();
    const hasExplicitRouteFilters = selectedType.length > 0 || singleInput.length > 0 || propertyValue.length > 0;

    if (!hasExplicitRouteFilters) {
      return null;
    }

    const parsedMaxEdge = Number(params['maxEdge']);
    const parsedMaxDepth = Number(params['maxDepth']);

    return {
      selectedType: selectedType || 'cluster',
      singleInput: singleInput || 'all',
      propertyType: propertyType || 'all',
      propertyValue: propertyValue || '',
      maxEdge: Number.isFinite(parsedMaxEdge) && parsedMaxEdge >= 0 && parsedMaxEdge <= 800 ? parsedMaxEdge : 25,
      maxDepth: Number.isFinite(parsedMaxDepth) && parsedMaxDepth >= 0 && parsedMaxDepth <= 5 ? parsedMaxDepth : 1
    };
  }

  get activeSidebarFilters(): CtiGraphFilters {
    return {
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: Number(this.maxEdge),
      maxDepth: Number(this.maxDepth)
    };
  }

  get activeSidebarCollapsed(): boolean {
    return this.isSidebarCollapsed;
  }

  openReportExportModal(): void {
    this.isReportExportModalOpen = true;
  }

  closeReportExportModal(): void {
    this.isReportExportModalOpen = false;
  }

  exportByType(type: string): void {
    const exportType = type as GraphReportExportType;
    const payload = this.buildGraphReportPayload();
    if (exportType === 'graph_pdf') {
      payload.graphImageDataUrl = this.captureExpandedGraphSnapshot();
    }
    this.graphReportExport.exportByType(payload, exportType);
    this.closeReportExportModal();
  }

  private buildGraphReportPayload(): GraphReportPayload {
    const nodes = this.rawNodes.map(node => ({
      id: String(node.id ?? ''),
      label: String(node.label ?? ''),
      type: String(node.nodeType ?? 'unknown')
    }));
    const edges = this.rawEdges.map(edge => ({
      id: String(edge.id ?? `${edge.from}->${edge.to}`),
      from: String(edge.from ?? ''),
      to: String(edge.to ?? ''),
      label: edge.label ? String(edge.label) : ''
    }));
    const byType: Record<string, number> = {};
    nodes.forEach(node => {
      byType[node.type] = (byType[node.type] ?? 0) + 1;
    });
    return {
      graphKind: 'cti',
      title: 'CTI Graph Intelligence Report',
      sessionName: 'CTI Graph',
      generatedAtIso: new Date().toISOString(),
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        clusters: byType['cluster'] ?? 0,
        documents: byType['document'] ?? 0,
        properties: byType['property'] ?? 0
      }
    };
  }

  private captureExpandedGraphSnapshot(): string | undefined {
    if (!this.networkContainer || !this.network || !this.nodeSet) {
      return undefined;
    }
    const originalScale = this.network.getScale();
    const originalPosition = this.network.getViewPosition();
    const groupsToExpand: {
        id: string;
        subNodes: string[];
    }[] = [];
    this.nodeSet.get().forEach(node => {
      const ext = node as ExtendedNode;
      const nodeId = String(ext.id ?? '');
      if (!ext.isGroup || !nodeId || (ext.subNodes?.length ?? 0) === 0) {
        return;
      }
      if (!this.groupExpandedState[nodeId]) {
        groupsToExpand.push({ id: nodeId, subNodes: ext.subNodes ?? [] });
      }
    });
    groupsToExpand.forEach(item => {
      this.expandGroupFromNodeId(item.id, item.subNodes, 200);
    });
    this.network.redraw();
    this.network.fit({ animation: false });
    const fittedPosition = this.network.getViewPosition();
    const fittedScale = this.network.getScale();
    this.network.moveTo({
      position: fittedPosition,
      scale: fittedScale * 0.9,
      animation: false
    });
    this.network.redraw();
    const canvasElements = this.networkContainer.nativeElement.querySelectorAll('canvas') as NodeListOf<HTMLCanvasElement>;
    let snapshot: string | undefined;
    if (canvasElements.length > 0) {
      const width = canvasElements[0].width;
      const height = canvasElements[0].height;
      const merged = document.createElement('canvas');
      merged.width = width;
      merged.height = height;
      const ctx = merged.getContext('2d');
      if (ctx) {
        canvasElements.forEach(canvasElement => {
          if (canvasElement.width === width && canvasElement.height === height) {
            ctx.drawImage(canvasElement, 0, 0);
          }
        });
        const pad = Math.round(Math.max(width, height) * 0.06);
        const padded = document.createElement('canvas');
        padded.width = width + (pad * 2);
        padded.height = height + (pad * 2);
        const pctx = padded.getContext('2d');
        if (pctx) {
          pctx.fillStyle = '#0f172a';
          pctx.fillRect(0, 0, padded.width, padded.height);
          pctx.drawImage(merged, pad, pad);
          snapshot = padded.toDataURL('image/jpeg', 0.92);
        }
        else {
          snapshot = merged.toDataURL('image/jpeg', 0.92);
        }
      }
    }
    groupsToExpand.forEach(item => {
      this.collapseGroupFromNodeId(item.id, item.subNodes, true);
    });
    this.network.moveTo({
      position: originalPosition,
      scale: originalScale,
      animation: false
    });
    this.network.redraw();
    return snapshot;
  }

  private applyCurrentFilters(): void {
    this.onSidebarApply(this.activeSidebarFilters);
  }

  private applyFilterValues(filters: CtiGraphFilters): void {
    this.selectedType = filters.selectedType;
    this.singleInput = filters.singleInput;
    this.propertyType = filters.propertyType;
    this.propertyValue = filters.propertyValue;
    this.maxEdge = Number(filters.maxEdge);
    this.maxDepth = Number(filters.maxDepth);
  }

  onSidebarFiltersChanged(filters: CtiGraphFilters): void {
    this.applyFilterValues(filters);
  }

  resetGraph(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null!;
    }
    if (this.nodeSet) {
      this.nodeSet.clear();
    }
    if (this.edgeSet) {
      this.edgeSet.clear();
    }
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
    this.result = [];
    this.originalNodeState.clear();
    const container = this.networkContainer?.nativeElement;
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }

  loadGraphByNode(data_point_type: string, type: string, value: string, maxEdge: string, maxDepth: string): void {
    if (this.expandEnabled) {
      queueMicrotask(() => {
        this.expandEnabled = false;
      });
    }
    else {
      this.expandEnabled = false;
    }
    let params = new HttpParams();
    this.loading = false;
    if (data_point_type) {
      params = params.set('data_point_type', data_point_type);
    }
    if (type) {
      params = params.set('model_type', type);
    }
    if (value) {
      params = params.set('query_value', value);
    }
    if (maxEdge) {
      params = params.set('edge', maxEdge);
    }
    if (maxDepth) {
      params = params.set('depth', maxDepth);
    }
    this.resetGraph();
    this.api.get<{
      results: any[];
  }>('graph', { params }).subscribe({
    next: response => {
      const { results } = response;
      this.result = results;
      this.renderGraph(this.result);
      this.loading = true;
    },
    error: _ => {
      this.isEmpty = true;
      this.loading = true;
    }
  });
  }

  showContextMenu( node: ExtendedNode, pointerDom?: { x: number; y: number; } ) {
    const menu = document.getElementById('customContextMenu');
    if (!menu) {
      return;
    }
    if (node?.color) {
      this.orignalColor = node.color;
    }
    if (node && typeof node.id === 'string') {
      const nodeId = node.id;
      const containerRect = this.networkContainer?.nativeElement?.getBoundingClientRect();
      let left = 0;
      let top = 0;
      if (pointerDom && containerRect) {
        left = containerRect.left + pointerDom.x;
        top = containerRect.top + pointerDom.y;
      }
      else {
        const box = this.network.getBoundingBox(node.id);
        const bottomRightDom = this.network.canvasToDOM({
          x: box.right,
          y: box.bottom
        });
        left = containerRect ? (containerRect.left + bottomRightDom.x) : bottomRightDom.x;
        top = containerRect ? (containerRect.top + bottomRightDom.y) : bottomRightDom.y;
      }
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
      menu.setAttribute('data-left', String(this.normalizePositionValue(left)));
      menu.setAttribute('data-top', String(this.normalizePositionValue(top)));
      this.contextMenuNodeId = node.id;
      this.contextMenuNode = node;
      this.contextCanExpand = this.canContextExpand();
      this.contextCanCollapse = this.canContextCollapse();
      this.contextShowOpenCti = this.showContextOpenCti();
      this.contextShowOpenReport = this.showContextOpenReport();
      if (node.color) {
        this.orignalColor = node.color;
      }
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
    if (listingMenu) {
      listingMenu.classList.add('hidden');
    }
    if (menu) {
      menu.classList.add('hidden');
      if (this.contextMenuNodeId) {
        this.nodeSet.update({ id: this.contextMenuNodeId, color: this.orignalColor });
      }
    }
    this.contextCanExpand = false;
    this.contextCanCollapse = false;
    this.contextShowOpenCti = false;
    this.contextShowOpenReport = false;
  }

  private normalizePositionValue(rawValue: number): number {
    const step = 2;
    const rounded = Math.round(rawValue / step) * step;
    return Math.max(0, Math.min(4000, rounded));
  }

  private getEdgeIdsToRemove(fromId: string, toIds: string[]): string[] {
    const sourceId = this.groupParentByGroupId[fromId] ?? fromId;
    return this.rawEdges
      .filter(e => (e.from === sourceId && toIds.includes(e.to as string)) ||
  (e.to === sourceId && toIds.includes(e.from as string)) ||
  (toIds.includes(String(e.from)) && toIds.includes(String(e.to))))
      .map(e => e.id as string);
  }

  private removeSubNodesAndEdges(fromId: string, subNodes: string[]): void {
    subNodes.forEach(subId => {
      if (this.nodeSet.get(subId)) {
        this.nodeSet.remove(subId);
      }
    });
    const edgeIdsToRemove = this.getEdgeIdsToRemove(fromId, subNodes);
    this.edgeSet.remove(edgeIdsToRemove);
  }

  private buildCircularSubNodes( subNodes: string[], centerPos: { x: number; y: number; }, radius: number ): ExtendedNode[] {
    const newNodes: ExtendedNode[] = [];
    const uniqueSubNodes = Array.from(new Set(subNodes));
    const denom = uniqueSubNodes.length || 1;
    uniqueSubNodes.forEach((subId, index) => {
      if (this.nodeSet.get(subId)) {
        return;
      }
      const rawNode = this.rawNodes.find(n => n.id === subId);
      if (!rawNode) {
        return;
      }
      const angle = (2 * Math.PI * index) / denom;
      const x = centerPos.x + radius * Math.cos(angle);
      const y = centerPos.y + radius * Math.sin(angle);
      newNodes.push({ ...rawNode, x, y, physics: true });
    });
    return newNodes;
  }

  private createGroupNodeSvg(count: number, isExpanded = false, clusterLabel = 'CTI Cluster'): string {
    const borderColor = isExpanded ? '#facc15' : '#7dd3fc';
    const subtitle = clusterLabel.replace(/&/g, '&amp;').slice(0, 20);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0c4a6e" stop-opacity="1" />
        <stop offset="100%" stop-color="#1e293b" stop-opacity="1" />
      </linearGradient>
    </defs>
    <g>
      <circle cx="80" cy="80" r="74" fill="url(#grad1)" stroke="${borderColor}" stroke-width="6" />
      <text x="80" y="72" dominant-baseline="middle" font-family="'Inter', sans-serif" text-anchor="middle" font-size="30" font-weight="700" fill="#f1f5f9">${count}</text>
      <text x="80" y="98" dominant-baseline="middle" font-family="'Inter', sans-serif" text-anchor="middle" font-size="10" font-weight="600" fill="#cbd5e1">${subtitle}</text>
    </g>
  </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  private updateGroupNodeVisual(nodeId: string, count: number, isExpanded: boolean): void {
    const groupNode = this.nodeSet.get(nodeId) as ExtendedNode | null;
    const clusterLabel = groupNode?.title
      ? String(groupNode.title).split('(')[0].trim()
      : `${this.toTitleCase(String(nodeId).split('/').pop() ?? 'CTI')} Cluster`;
    this.nodeSet.update({
      id: nodeId,
      shape: 'circularImage',
      image: this.createGroupNodeSvg(count, isExpanded, clusterLabel),
      size: 40,
      borderWidth: 0,
      label: ''
    } as any);
  }

  private getClusterDocumentIds(nodeId: string): string[] {
    const resultDocIds = (this.result ?? [])
      .filter((item: any) => {
        const vertexId = String(item?.vertex?._id ?? '');
        const vertexType = String(item?.vertex?.type ?? '').toLowerCase();
        if (vertexType !== 'document' || !vertexId) {
          return false;
        }
        const from = String(item?.edge?._from ?? '');
        const to = String(item?.edge?._to ?? '');
        return from === nodeId || to === nodeId;
      })
      .map((item: any) => String(item?.vertex?._id ?? ''))
      .filter(Boolean);
    if (resultDocIds.length > 0) {
      return Array.from(new Set(resultDocIds));
    }
    const directNeighbors = this.rawEdges
      .filter(e => String(e.from) === nodeId || String(e.to) === nodeId)
      .map(e => String(e.from) === nodeId ? String(e.to) : String(e.from))
      .filter(id => !this.isClusterRootNode(id) && id !== nodeId);
    return Array.from(new Set(directNeighbors));
  }

  private getClusterCollapseTargets(nodeId: string): string[] {
    const documentIds = this.getClusterDocumentIds(nodeId);
    if (documentIds.length <= 5) {
      return [];
    }
    const collapsedTargets = new Set<string>(documentIds);
    for (const docId of documentIds) {
      this.rawEdges.forEach(edge => {
        const fromId = String(edge.from);
        const toId = String(edge.to);
        if (fromId === docId && !this.isClusterRootNode(toId) && toId !== nodeId) {
          collapsedTargets.add(toId);
        }
        if (toId === docId && !this.isClusterRootNode(fromId) && fromId !== nodeId) {
          collapsedTargets.add(fromId);
        }
      });
    }
    return Array.from(collapsedTargets);
  }

  private expandGroupFromNodeId(nodeId: string, subNodes: string[], radius: number): void {
    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (isExpanded) {
      return;
    }
    const uniqueSubNodes = Array.from(new Set(subNodes));
    const sourceId = this.groupParentByGroupId[nodeId] ?? nodeId;
    const centerPos = this.network.getPositions([nodeId])[nodeId];
    const existingEdgeIds = new Set(this.edgeSet.getIds().map(id => String(id)));
    const uniqueEdgesById = new Map<string, Edge>();
    this.rawEdges.forEach(e => {
      const fromId = String(e.from);
      const toId = String(e.to);
      const fromIn = uniqueSubNodes.includes(fromId);
      const toIn = uniqueSubNodes.includes(toId);
      const fromVisible = !!this.nodeSet.get(fromId);
      const toVisible = !!this.nodeSet.get(toId);
      const shouldInclude = ((fromId === sourceId && toIn) ||
  (toId === sourceId && fromIn) ||
  (fromIn && toIn) ||
  (fromIn && toVisible) ||
  (toIn && fromVisible));
      if (!shouldInclude) {
        return;
      }
      const edgeId = String(e.id ?? `${fromId}->${toId}`);
      if (existingEdgeIds.has(edgeId)) {
        return;
      }
      if (!uniqueEdgesById.has(edgeId)) {
        uniqueEdgesById.set(edgeId, { ...e, id: edgeId });
      }
    });
    const newEdges = Array.from(uniqueEdgesById.values());
    if (newEdges.length > 0) {
      this.edgeSet.add(newEdges);
    }
    const newNodes = this.buildCircularSubNodes(uniqueSubNodes, centerPos, radius);
    if (newNodes.length > 0) {
      this.nodeSet.add(newNodes);
    }
    this.groupExpandedState[nodeId] = true;
    this.updateGroupNodeVisual(nodeId, uniqueSubNodes.length, true);
  }

  private collapseGroupFromNodeId(nodeId: string, subNodes: string[], force = false): void {
    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (!isExpanded && !force) {
      return;
    }
    this.removeSubNodesAndEdges(nodeId, subNodes);
    this.groupExpandedState[nodeId] = false;
    this.updateGroupNodeVisual(nodeId, subNodes.length, false);
  }

  expandGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id as string;
    const subNodes = this.getContextSubNodes(nodeId, node);
    if (!nodeId || subNodes.length === 0) {
      return;
    }
    this.expandGroupFromNodeId(nodeId, subNodes, 200);
    this.hideContextMenu();
  }

  collapseGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id as string;
    const subNodes = this.getContextSubNodes(nodeId, node);
    if (this.isClusterRootNode(nodeId)) {
      this.collapseClusterGroup(nodeId, subNodes);
      this.hideContextMenu();
      return;
    }
    if (!nodeId || subNodes.length === 0) {
      return;
    }
    this.collapseGroupFromNodeId(nodeId, subNodes, true);
    this.hideContextMenu();
  }

  canContextExpand(): boolean {
    const node = this.contextMenuNode;
    if (!node) {
      return false;
    }
    const nodeId = String(node.id);
    if (this.isClusterRootNode(nodeId)) {
      return true;
    }
    const subNodes = this.getContextSubNodes(nodeId, node);
    if (subNodes.length === 0) {
      return false;
    }
    return !this.groupExpandedState[nodeId];
  }

  canContextCollapse(): boolean {
    const node = this.contextMenuNode;
    if (!node) {
      return false;
    }
    const nodeId = String(node.id);
    if (this.isClusterRootNode(nodeId)) {
      return true;
    }
    const subNodes = this.getContextSubNodes(nodeId, node);
    if (subNodes.length === 0) {
      return false;
    }
    return !!this.groupExpandedState[nodeId];
  }

  showContextOpenCti(): boolean {
    const node = this.contextMenuNode;
    if (!node) {
      return false;
    }
    return !this.isClusterRootNode(String(node.id));
  }

  showContextOpenReport(): boolean {
    const node = this.contextMenuNode;
    if (!node) {
      return false;
    }
    return !this.isClusterRootNode(String(node.id));
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
    this.proxied_resource.open(fullUrl);
    this.hideContextMenu();
  }

  copyNodeLabel() {
    const _label = this.contextMenuNode?.label;
    if (_label) {
      this.clipboard.copy(_label);
      this.showCopiedMessage();
      this.hideContextMenu();
    }
  }

  private hasClusterEdge(nodeId: string, clusterId: string): boolean {
    return this.rawEdges.some(edge => (edge.from === nodeId && edge.to === clusterId) ||
  (edge.to === nodeId && edge.from === clusterId));
  }

  private getReportCategory(nodeId: string): string {
    const checks: [
      string,
      string
  ][] = [
    ['general', 'cti_vertices/general'],
    ['leak', 'cti_vertices/leak'],
    ['defacement', 'cti_vertices/defacement'],
    ['exploit', 'cti_vertices/exploit'],
    ['chat', 'cti_vertices/chat']
  ];
    for (const [cat, clusterId] of checks) {
      if (this.hasClusterEdge(nodeId, clusterId)) {
        return cat;
      }
    }
    return '';
  }

  viewReport() {
    this.hideContextMenu();
    const nodeId = this.contextMenuNodeId;
    const parts = nodeId.split('/');
    const singleInput = parts[parts.length - 1];
    const category = this.getReportCategory(nodeId);
    const open = (path: string) => this.proxied_resource.open(`${window.location.origin}${path}/${singleInput}`);
    if (category === 'leak') {
      open('/dashboard/breach/all');
    }
    else if (category === 'defacement') {
      open('/dashboard/defacement/archive');
    }
    else if (category === 'general') {
      open('/dashboard/strategic/all');
    }
    else if (category === 'chat') {
      open('/dashboard/social/telegram');
    }
    else if (category === 'exploit') {
      open('/dashboard/exploit/cve');
    }
    this.hideContextMenu();
  }

  showCopiedMessage() {
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }

  onPhysicsToggled(enabled: boolean): void {
    this.physicsEnabled = enabled;
    if (this.network) {
      this.network.setOptions({ physics: { enabled } });
    }
  }

  togglePhysics(): void {
    this.onPhysicsToggled(!this.physicsEnabled);
  }

  onNodeSearchChange(value: string): void {
    this.nodeSearchText = value ?? '';
    this.applyNodeSearchHighlight();
  }

  onNodeSearchSubmitted(): void {
    this.applyNodeSearchHighlight();
  }

  toggleExpandCollapseAll(): void {
    this.expandEnabled = !this.expandEnabled;
    this.nodeSet.get().forEach(node => {
      const groupNode = node as ExtendedNode;
      if (!groupNode.isGroup || !groupNode.subNodes || !groupNode.id) {
        return;
      }
      const nodeId = String(groupNode.id);
      if (this.expandEnabled) {
        this.expandGroupFromNodeId(nodeId, groupNode.subNodes, 200);
      }
      else {
        this.collapseGroupFromNodeId(nodeId, groupNode.subNodes);
      }
    });
    this.captureOriginalNodeColors();
    this.applyNodeSearchHighlight();
  }

  onSidebarApply(filters: CtiGraphFilters): void {
    if (!this.networkContainer) {
      this.pendingFilters = { ...filters };
      return;
    }
    this.selectedType = filters.selectedType;
    this.singleInput = filters.singleInput;
    this.propertyType = filters.propertyType;
    this.propertyValue = filters.propertyValue;
    this.maxEdge = filters.maxEdge;
    this.maxDepth = filters.maxDepth;
    queueMicrotask(() => {
      this.showMaxEdgeNotice = Number(this.maxEdge) > 50;
    });
    if (filters.selectedType === 'property' && filters.propertyType && filters.propertyValue) {
      this.loadGraphByNode(this.selectedType, filters.propertyType, filters.propertyValue, this.maxEdge.toString(), this.maxDepth.toString());
    }
    else if ((filters.selectedType === 'cluster' || filters.selectedType === 'document') && filters.singleInput) {
      this.loadGraphByNode(this.selectedType, filters.selectedType, filters.singleInput, this.maxEdge.toString(), this.maxDepth.toString());
    }
  }

  private renderGraph(data: GraphResultItem[]): void {
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
    this.nodeTypeById = nodeTypeMap;
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
      if (!e?._from || !e._to) {
        return;
      }
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
    if (text.length <= this.maxNodeLabelLength) {
      return text;
    }
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
    if (!label) {
      return null;
    }
    const normalized = label.toLowerCase().replace(/\s+/g, '_');
    const match = normalized.match(/m_[a-z0-9_]+/);
    if (match) {
      return match[0];
    }
    return normalized;
  }

  private getBorderColorForType(type: string): string {
    if (type === 'cluster') {
      return this.nodeClusterBorder;
    }
    if (type === 'document') {
      return this.nodeDocumentBorder;
    }
    if (type === 'property') {
      return this.nodePropertyBorder;
    }
    return this.nodeSecondaryBorder;
  }

  private getIconNameForNode(node: ExtendedNode, type: string): string {
    if (node.isGroup) {
      return this.iconMap['cluster'];
    }
    if (type === 'cluster') {
      return this.iconMap['cluster'];
    }
    if (type === 'document') {
      return this.iconMap['document'];
    }
    if (type !== 'property') {
      return this.iconMap['property'];
    }
    const rawKey = (node.propertyKey ?? '').toLowerCase();
    const labelKey = this.extractPropertyKeyFromLabel(node.label?.toString()) ?? '';
    const key = rawKey || labelKey;
    const tokens = [key, key.replace(/^m_/, ''), key.replace(/_/g, ' ')];
    for (const token of tokens) {
      for (const [needle, icon] of Object.entries(this.iconMap)) {
        if (needle === 'cluster' || needle === 'document' || needle === 'property') {
          continue;
        }
        if (token.includes(needle)) {
          return icon;
        }
      }
    }
    return this.iconMap['property'];
  }

  private buildIconSvg(iconName: string, borderColor: string): string | null {
    const def = BOOTSTRAP_ICON_PATHS[iconName];
    if (!def) {
      return null;
    }
    const paths = def.paths.map(d => `<path d="${d}" fill="#e2e8f0"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox}"><circle cx="8" cy="8" r="7.5" fill="${this.nodeFillColor}" stroke="${borderColor}" stroke-width="0.5"/><g transform="translate(4 4) scale(0.5)">${paths}</g></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  private buildRawNodeMap(data: GraphResultItem[]): Map<string, ExtendedNode> {
    const rawNodeMap = new Map<string, ExtendedNode>();
    const put = (vertex: any, color: string) => {
      const id = vertex?._id;
      if (!id || rawNodeMap.has(id)) {
        return;
      }
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
        font: { size: 14, color: this.getNodeLabelColor() },
        size: 18
      });
    };
    data.forEach(item => {
      put(item.vertex, this.nodePrimaryBorder);
      (item.path?.vertices ?? []).forEach(pv => {
        put(pv, this.nodeSecondaryBorder);
      });
    });
    return rawNodeMap;
  }

  private buildNodeTypeMap(data: GraphResultItem[]): Record<string, string> {
    const nodeTypeMap: Record<string, string> = {};
    data.forEach(item => {
      if (item?.vertex?._id) {
        nodeTypeMap[item.vertex._id] = item.vertex.type || '';
      }
      (item.path?.vertices ?? []).forEach(pv => {
        if (pv?._id && pv?.type) {
          nodeTypeMap[pv._id] = pv.type;
        }
      });
    });
    return nodeTypeMap;
  }

  private buildRawNodes(rawNodeMap: Map<string, ExtendedNode>, nodeTypeMap: Record<string, string>, edgeMap: Record<string, number>): ExtendedNode[] {
    const nodes: ExtendedNode[] = [];
    rawNodeMap.forEach(node => {
      const nodeId = node.id as string;
      const nodeType = nodeTypeMap[nodeId] || '';
      const isClusterNode = nodeType === 'cluster';
      const isClusterRootNode = this.isClusterRootNode(nodeId);
      const clusterDocumentIds = isClusterRootNode ? this.getClusterDocumentIds(nodeId) : [];
      node.nodeType = nodeType;
      if (!node.propertyKey) {
        node.propertyKey = this.extractPropertyKeyFromLabel(node.label?.toString());
      }
      let degree = edgeMap[nodeId] || 0;
      if (this.expandEnabled) {
        degree = 0;
      }
      const isGroupable = degree > 2 && isClusterRootNode && clusterDocumentIds.length > 5;
      if (isGroupable) {
        const subNodes = this.getClusterCollapseTargets(nodeId);
        this.groupInfo[nodeId] = subNodes;
        this.groupParentByGroupId[nodeId] = nodeId;
        nodes.push({
          id: node.id,
          label: '',
          title: `${this.toTitleCase(String(nodeId).split('/').pop() ?? 'CTI')} Cluster (${clusterDocumentIds.length} nodes)`,
          color: { border: 'transparent', background: 'transparent' },
          shape: 'circularImage',
          isGroup: true,
          physics: false,
          subNodes,
          font: { size: 14, color: this.getNodeLabelColor(), strokeWidth: 1 },
          size: 40,
          image: this.createGroupNodeSvg(clusterDocumentIds.length, false, `${this.toTitleCase(String(nodeId).split('/').pop() ?? 'CTI')} Cluster`),
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
      node.color = {
        border: this.nodeClusterBorder,
        background: this.nodeFillColor,
        highlight: { border: this.nodeFocusColor, background: this.nodeFillColor },
        hover: { border: '#fde68a', background: this.nodeFillColor }
      };
      return;
    }
    const hasOutgoing = edgeMap[node.id as string];
    if (hasOutgoing) {
      return;
    }
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

  private buildVisibleSets(): {
  visibleNodes: ExtendedNode[];
  visibleEdges: Edge[];
  } {
    const groupedSubNodeIds = new Set(Object.values(this.groupInfo).flat());
    const visibleNodes = this.rawNodes.filter(node => node.isGroup || !groupedSubNodeIds.has(node.id as string));
    const hiddenToParent = new Map<string, string>();
    Object.entries(this.groupedSubNodesByParent).forEach(([parentId, subSet]) => {
      subSet.forEach(subId => hiddenToParent.set(subId, parentId));
    });
    const visibleEdges = this.rawEdges.filter(edge => {
      const fromId = String(edge.from ?? '');
      const toId = String(edge.to ?? '');
      return !hiddenToParent.has(fromId) && !hiddenToParent.has(toId);
    });
    const aggregateEdges = new Map<string, Edge>();
    this.rawEdges.forEach(edge => {
      const fromId = String(edge.from ?? '');
      const toId = String(edge.to ?? '');
      const parentFrom = hiddenToParent.get(fromId);
      const parentTo = hiddenToParent.get(toId);
      if (!parentFrom && !parentTo) {
        return;
      }
      const aggFrom = parentFrom ?? fromId;
      const aggTo = parentTo ?? toId;
      if (aggFrom === aggTo) {
        return;
      }
      if (hiddenToParent.has(aggFrom) || hiddenToParent.has(aggTo)) {
        return;
      }
      const id = `${aggFrom}->${aggTo}`;
      if (!aggregateEdges.has(id)) {
        aggregateEdges.set(id, {
          id,
          from: aggFrom,
          to: aggTo,
          arrows: '',
          color: { color: this.edgeBaseColor },
          width: 1.5
        });
      }
    });
    aggregateEdges.forEach(edge => visibleEdges.push(edge));
    return { visibleNodes, visibleEdges };
  }

  private initNetwork(): void {
    if (!this.networkContainer) {
      return;
    }
    const container = this.networkContainer.nativeElement;
    this.network = new Network(container, { nodes: this.nodeSet, edges: this.edgeSet }, {
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
        font: { size: 14, color: this.getNodeLabelColor() },
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
        keyboard: false,
        zoomView: true,
        dragView: true
      },
      layout: {
        improvedLayout: true
      }
    });
    container.addEventListener('contextmenu', ( e: { preventDefault: () => any; } ) => e.preventDefault());
  }

  private applyPhysicsAutoDisableIfNeeded(): void {
    if (this.physicsTimeoutId !== null) {
      clearTimeout(this.physicsTimeoutId);
      this.physicsTimeoutId = null;
    }
    if (this.physicsEnabled) {
      return;
    }
    if (this.network) {
      this.network.setOptions({ physics: { enabled: true } });
    }
    this.physicsTimeoutId = setTimeout(() => {
      this.physicsEnabled = false;
      if (this.network) {
        this.network.setOptions({ physics: { enabled: false } });
      }
      this.physicsTimeoutId = null;
    }, 1500);
  }

  private attachNetworkHandlers(): void {
    this.network.on('oncontext', params => {
      this.handleContextMenu(params);
    });
    this.network.on('click', params => {
      this.handleClick(params);
    });
    this.network.on('doubleClick', params => {
      this.handleDoubleClick(params);
    });
    this.network.on('zoom', (properties: any) => {
      const currentScale = this.network.getScale();
      const currentPosition = this.network.getViewPosition();
      if (currentScale <= this.minZoomScale) {
        const lockPosition = this.minZoomLockPosition ?? currentPosition;
        this.minZoomLockPosition = lockPosition;
        if (properties?.direction === '-') {
          this.network.moveTo({ scale: this.minZoomScale, position: lockPosition, animation: false });
        }
        else {
          this.network.moveTo({ scale: this.minZoomScale, animation: false });
        }
      }
      else {
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
    const isMainClusterNode = this.isClusterRootNode(nodeId);
    const hasClusterConnection = this.rawEdges.some(edge => (edge.from === node?.id && this.isClusterRootNode(String(edge.to))) ||
  (edge.to === node?.id && this.isClusterRootNode(String(edge.from))));
    if (!node) {
      return;
    }
    if (!isMainClusterNode && !hasClusterConnection && !node.isGroup) {
      return;
    }
    this.showContextMenu(node, pointer);
  }

  private getContextSubNodes(nodeId: string, node: ExtendedNode): string[] {
    if ((node.subNodes?.length ?? 0) > 0) {
      return node.subNodes ?? [];
    }
    if ((this.groupInfo[nodeId]?.length ?? 0) > 0) {
      return this.groupInfo[nodeId] ?? [];
    }
    if (this.isClusterRootNode(nodeId)) {
      const visibleResolved = this.getVisibleClusterAttachedNodeIds(nodeId);
      if (visibleResolved.length > 0) {
        return visibleResolved;
      }
      return this.getClusterCollapseTargets(nodeId);
    }
    return [];
  }

  private isClusterRootNode(nodeId: string): boolean {
    const t = this.nodeTypeById[String(nodeId)] ?? '';
    if (t) {
      return t === 'cluster';
    }
    return nodeId.startsWith(this.clusterNodePrefix);
  }

  private collapseClusterGroup(clusterNodeId: string, subNodes: string[]): void {
    const candidates = new Set(subNodes);
    if (candidates.size === 0) {
      return;
    }
    const directNeighbors = new Set(this.getDirectClusterNeighbors(clusterNodeId));
    const docsToRemove = Array.from(candidates).filter(id => directNeighbors.has(id));
    const docsToRemoveSet = new Set(docsToRemove);
    docsToRemove.forEach(id => {
      if (this.nodeSet.get(id)) {
        this.nodeSet.remove(id);
      }
    });
    const edges = this.edgeSet.get();
    const edgeIdsToRemove = edges
      .filter(edge => docsToRemoveSet.has(String(edge.from)) || docsToRemoveSet.has(String(edge.to)))
      .map(edge => edge.id as string)
      .filter(Boolean);
    this.edgeSet.remove(edgeIdsToRemove);
    const props = Array.from(candidates).filter(id => !directNeighbors.has(id));
    props.forEach(propId => {
      const remainingEdges = this.edgeSet.get({
        filter: edge => String(edge.from) === propId || String(edge.to) === propId
      });
      const hasOutsideConnection = remainingEdges.some(edge => {
        const other = String(edge.from) === propId ? String(edge.to) : String(edge.from);
        return !candidates.has(other) && other !== clusterNodeId;
      });
      if (!hasOutsideConnection && this.nodeSet.get(propId)) {
        this.nodeSet.remove(propId);
      }
    });
    const residualEdgesToRemove = this.edgeSet.get()
      .filter(edge => {
        const from = String(edge.from);
        const to = String(edge.to);
        return ((from === clusterNodeId && candidates.has(to)) ||
  (to === clusterNodeId && candidates.has(from)) ||
  (candidates.has(from) && candidates.has(to)));
      })
      .map(edge => edge.id as string)
      .filter(Boolean);
    this.edgeSet.remove(residualEdgesToRemove);
    this.groupExpandedState[clusterNodeId] = false;
    this.updateGroupNodeVisual(clusterNodeId, this.getClusterDocumentIds(clusterNodeId).length, false);
  }

  private getVisibleClusterAttachedNodeIds(clusterNodeId: string): string[] {
    const direct = this.getDirectClusterNeighbors(clusterNodeId);
    const all = new Set<string>(direct);
    const edges = this.edgeSet.get();
    for (const baseId of direct) {
      for (const edge of edges) {
        const from = String(edge.from);
        const to = String(edge.to);
        if (from === baseId && !this.isClusterRootNode(to) && to !== clusterNodeId) {
          all.add(to);
        }
        else if (to === baseId && !this.isClusterRootNode(from) && from !== clusterNodeId) {
          all.add(from);
        }
      }
    }
    return Array.from(all);
  }

  private getDirectClusterNeighbors(clusterNodeId: string): string[] {
    const neighbors = new Set<string>();
    const edges = this.edgeSet.get();
    for (const edge of edges) {
      const from = String(edge.from);
      const to = String(edge.to);
      if (from === clusterNodeId && !this.isClusterRootNode(to) && to !== clusterNodeId) {
        neighbors.add(to);
      }
      else if (to === clusterNodeId && !this.isClusterRootNode(from) && from !== clusterNodeId) {
        neighbors.add(from);
      }
    }
    return Array.from(neighbors);
  }

  private handleClick(params: any): void {
    this.hideContextMenu();
    const pointer = params.pointer.DOM;
    const nodeIdRaw = this.network.getNodeAt(pointer);
    if (!nodeIdRaw) {
      return;
    }
    const nodeId = String(nodeIdRaw);
    this.toggleEdgeHighlightOnClick(nodeId);
  }

  private handleDoubleClick(params: any): void {
    this.hideContextMenu();
    const pointer = params.pointer.DOM;
    const nodeIdRaw = this.network.getNodeAt(pointer);
    if (!nodeIdRaw) {
      return;
    }
    const nodeId = String(nodeIdRaw);
    const node = this.nodeSet.get(nodeId) as ExtendedNode;
    if (!node) {
      return;
    }
    const subNodes = this.getContextSubNodes(nodeId, node);
    if (subNodes.length === 0) {
      return;
    }
    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (isExpanded) {
      this.collapseGroupFromNodeId(nodeId, subNodes);
    }
    else {
      this.expandGroupFromNodeId(nodeId, subNodes, 200);
    }
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
    if (!needle) {
      return;
    }
    const matchedNodeIds: string[] = [];
    this.nodeSet.get().forEach(node => {
      const label = (node.label || '').toString().toLowerCase();
      if (!label.includes(needle)) {
        return;
      }
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
    this.edgeSet.update(matchedEdges.map(edge => ({
      id: edge.id!,
      color: { color: this.edgeHighlightColor },
      dashes: true,
      width: 2.5,
      arrows: { to: { enabled: false } }
    })));
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
    }
    else {
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
      borderWidth: this.originalNodeState.get(String(node.id))?.borderWidth ?? (node).borderWidth,
      image: this.originalNodeState.get(String(node.id))?.image ?? (node).image
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
        const baseBorderWidth = nodeState?.borderWidth ?? ((node).borderWidth ?? 2);
        const selectedBorderWidth = nodeState?.borderWidthSelected ?? ((node).borderWidthSelected ?? (baseBorderWidth + 2));
        const extNode = node as ExtendedNode;
        const iconName = this.getIconNameForNode(extNode, extNode.nodeType || '');
        const yellowIcon = this.buildIconSvg(iconName, '#facc15');
        return {
          id: node.id!,
          color: highlightedColor,
          borderWidth: selectedBorderWidth,
          image: yellowIcon ?? (node).image
        };
      });
    this.searchMatchedCount = updates.length;
    if (updates.length > 0) {
      this.nodeSet.update(updates);
    }
  }
}
const BOOTSTRAP_ICON_PATHS: Record<string, {
  viewBox: string;
  paths: string[];
}> = {
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
