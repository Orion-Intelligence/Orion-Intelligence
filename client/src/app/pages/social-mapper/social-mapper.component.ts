import { Component, ChangeDetectionStrategy, signal, computed, DestroyRef, OnDestroy, Inject, PLATFORM_ID, effect, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { MetadataPopupComponent } from './metadata-popup/metadata-popup.component';
import { ProfileSummaryPopupComponent } from './profile-summary-popup/profile-summary-popup.component';
import { NetworkData, Job, PlatformResult, CustomEntity, NetworkNode, TabState } from '../../shared/model/social/social-scan.models';
import { SocialScanService } from './social-scan.service';
import { TabManagerService } from '../../shared/services/tab-manager.service';

import { ToolbarComponent } from './toolbar/toolbar.component';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { EntityMenuComponent } from './entity-menu/entity-menu.component';
import { ListViewComponent } from './list-view/list-view.component';
import { getPlatformColor } from '../../shared/utils/formatters';
import { socialMapperAnimations } from './social-mapper.animations';

@Component({
  selector: 'app-social-mapper',
  templateUrl: './social-mapper.component.html',
  styleUrls: ['./social-mapper.component.css'],
  styles: [socialMapperAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NetworkGraphComponent,
    MetadataPopupComponent,
    ProfileSummaryPopupComponent,
    TitleCasePipe,
    ToolbarComponent,
    HomeMenuComponent,
    EntityMenuComponent,
    ListViewComponent
  ]
})
export class SocialMapperComponent implements OnInit, OnDestroy {
  private readonly twId = 'tw-social';
  private activeTabState = computed(() => this.tabManager.activeTab()?.state);

  searchTerm = computed(() => this.activeTabState()?.searchTerm() ?? '');
  homeMenuSearchTerm = computed(() => this.activeTabState()?.homeMenuSearchTerm() ?? '');
  jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  networkData = computed(() => this.activeTabState()?.networkData() ?? { nodes: [], edges: [] });
  scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map());
  activeUsernames = computed(() => this.activeTabState()?.activeUsernames() ?? new Set<string>());
  customEntities = computed(() => this.activeTabState()?.customEntities() ?? []);
  isEditMode = computed(() => this.activeTabState()?.isEditMode() ?? false);
  isHomeMenuCollapsed = computed(() => this.activeTabState()?.isHomeMenuCollapsed() ?? false);
  isEntityMenuCollapsed = computed(() => this.activeTabState()?.isEntityMenuCollapsed() ?? false);
  activeHomeMenuTab = computed(() => this.activeTabState()?.activeHomeMenuTab() ?? 'history');
  isPhysicsEnabled = computed(() => this.activeTabState()?.isPhysicsEnabled() ?? false);
  viewMode = computed(() => this.activeTabState()?.viewMode() ?? 'graph');

  isModalVisible = signal(false);
  modalResults = signal<{ username: string, platforms: PlatformResult[] }>({ username: '', platforms: [] });
  isMetadataPopupVisible = signal(false);
  selectedPlatformData = signal<PlatformResult | null>(null);
  isSummaryPopupVisible = signal(false);
  summaryPopupData = signal<{ username: string; platforms: PlatformResult[]; email?: string; } | null>(null);
  showAlreadyAddedNotification = signal(false);
  showAlreadyScannedNotification = signal(false);
  private notificationTimeout: any;
  nodeToFocus = signal<string | null>(null);
  contextMenu = signal({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null as string | null,
    type: null as 'user' | 'platform' | 'customEntity' | null
  });
  deleteConfirmation = signal({
    visible: false,
    username: null as string | null,
  });
  isAddEntityModalVisible = signal(false);
  entityToAdd = signal<{ type: 'wallet' | 'email' | 'domain', value: string } | null>(null);
  expandedPlatformNodeId = signal<string | null>(null);
  isMobileEntityPanelOpen = signal(false);

  isSmallScreen = signal(false);
  private mediaQueryList: MediaQueryList | null = null;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => {
    this.isSmallScreen.set(event.matches);
  };

  contextMenuUsername = computed(() => {
    const { type, nodeId } = this.contextMenu();
    if (type === 'user' && nodeId) {
      return nodeId.replace('user-', '');
    }
    return null;
  });

  isSearchDisabled = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (term.length === 0) return true;
    return this.jobs().some(job => job.username.toLowerCase() === term);
  });

  canEditConnections = computed(() => {
    const nodes = this.networkData().nodes;
    const userNodeCount = nodes.filter(n => n.id.toString().startsWith('user-')).length;
    const customEntityOnGraphCount = this.customEntities().filter(e => e.onGraph).length;
    const connectableNodesCount = userNodeCount + customEntityOnGraphCount;
    return connectableNodesCount >= 2;
  });

  constructor(
    private scanService: SocialScanService,
    private destroyRef: DestroyRef,
    private tabManager: TabManagerService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQueryList = window.matchMedia('(max-width: 1023px)');
      this.isSmallScreen.set(this.mediaQueryList.matches);
      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);

      effect(() => {
        if (this.isSmallScreen()) {
          this.updateState(state => {
            state.viewMode.set('list');
            state.activeHomeMenuTab.set('history');
          });
        }
      });
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !document.getElementById(this.twId)) {
      const link = document.createElement('link');
      link.id = this.twId;
      link.rel = 'stylesheet';
      link.href = 'tailwind-social.css';
      document.head.appendChild(link);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById(this.twId)?.remove();
    }
  }

  private updateState(updater: (state: TabState) => void) {
    const state = this.activeTabState();
    if (state) {
      updater(state);
      this.tabManager.scheduleSave();
    }
  }

  onSearchChanged(term: string) {
    this.updateState(state => state.searchTerm.set(term));
  }

  onHomeMenuSearchChanged(term: string) {
    this.updateState(state => state.homeMenuSearchTerm.set(term));
  }

  onViewModeChanged(mode: 'graph' | 'list') {
    this.updateState(state => state.viewMode.set(mode));
  }

  onPhysicsToggled() {
    this.updateState(state => state.isPhysicsEnabled.update(v => !v));
  }

  onEditModeToggled() {
    this.updateState(state => state.isEditMode.update(v => !v));
  }

  onHomeMenuToggled() {
    this.updateState(state => state.isHomeMenuCollapsed.update(v => !v));
  }

  onEntityMenuToggled() {
    this.updateState(state => state.isEntityMenuCollapsed.update(v => !v));
  }

  onHomeMenuTabSelected(tab: 'history' | 'entities') {
    this.updateState(state => state.activeHomeMenuTab.set(tab));
  }

  public getPlatformColor = getPlatformColor;

  triggerScan() {
    const username = this.searchTerm().trim();
    if (!username) return;

    if (this.jobs().some(job => job.username.toLowerCase() === username.toLowerCase())) {
      this.showNotification('scanned');
      return;
    }

    const newJob: Job = {
      id: self.crypto.randomUUID(),
      username: username,
      status: 'in_progress',
      progress: 0,
      step: 'Queued...'
    };

    this.updateState(state => {
      state.jobs.update(currentJobs => [newJob, ...currentJobs]);
      state.searchTerm.set('');
    });
    this.runScan(newJob);
  }

  handleCompletedJobClick(job: Job) {
    if (job.status !== 'completed' || this.activeUsernames().has(job.username)) {
      return;
    }
    this.openModalForJob(job.username);
  }

  focusOnUser(username: string): void {
    this.nodeToFocus.set(`user-${username}`);
    setTimeout(() => this.nodeToFocus.set(null), 100);
  }

  openDeleteConfirmation(username: string) {
    this.deleteConfirmation.set({ visible: true, username: username });
    this.closeContextMenu();
  }

  closeDeleteConfirmation() {
    this.deleteConfirmation.set({ visible: false, username: null });
  }

  confirmDeletion() {
    const usernameToDelete = this.deleteConfirmation().username;
    if (usernameToDelete) {
      this.updateState(state => {
        state.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== usernameToDelete.toLowerCase()));

        state.networkData.update(currentData => {
          const centralNodeId = `user-${usernameToDelete}`;
          const nodesToRemove = new Set<string | number>();
          currentData.nodes.forEach(node => {
            if (node.id === centralNodeId || node.id.toString().startsWith(`${usernameToDelete}-`)) {
              nodesToRemove.add(node.id);
            }
          });

          return {
            nodes: currentData.nodes.filter((n: NetworkNode) => !nodesToRemove.has(n.id)),
            edges: currentData.edges.filter((e: any) => e.from !== centralNodeId)
          };
        });

        state.activeUsernames.update((currentSet: Set<string>) => {
          const newSet = new Set(currentSet);
          newSet.delete(usernameToDelete);
          return newSet;
        });

        state.scanResults.update(currentMap => {
          const newMap = new Map(currentMap);
          newMap.delete(usernameToDelete);
          return newMap;
        });
      });
    }
    this.closeDeleteConfirmation();
  }

  private showNotification(type: 'added' | 'scanned') {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.showAlreadyAddedNotification.set(type === 'added');
    this.showAlreadyScannedNotification.set(type === 'scanned');

    this.notificationTimeout = setTimeout(() => {
      this.showAlreadyAddedNotification.set(false);
      this.showAlreadyScannedNotification.set(false);
    }, 3000);
  }

  private runScan(job: Job) {
    this.scanService.performScan(job.username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event: any) => {
          if (event.type === 'progress') {
            const progressUpdate = event.payload;
            this.updateState(state => state.jobs.update(jobs => jobs.map(j =>
              j.id === job.id
                ? { ...j, ...progressUpdate }
                : j
            )));
          } else if (event.type === 'complete') {
            const finalPlatforms = event.payload;
            this.updateState(state => {
              state.scanResults.update(currentMap => new Map(currentMap).set(job.username, finalPlatforms));
              state.jobs.update(jobs => jobs.map(j =>
                j.id === job.id
                  ? { ...j, status: 'completed', progress: 100, step: 'Completed' }
                  : j
              ));
            });
          }
        },
        error: (err) => {
          console.error('Scan failed:', err);
          this.updateState(state => state.jobs.update(jobs => jobs.map(j =>
            j.id === job.id
              ? { ...j, status: 'failed', step: 'Scan failed' }
              : j
          )));
        }
      });
  }

  onNodeClicked(nodeId: string) {
    if (!nodeId.startsWith('user-')) return;
    const username = nodeId.replace('user-', '');
    const userPlatforms = this.scanResults().get(username);
    if (userPlatforms) {
      const email = userPlatforms.find((p: PlatformResult) => p.email)?.email;
      this.summaryPopupData.set({ username, platforms: userPlatforms, email: email });
      this.isSummaryPopupVisible.set(true);
    }
  }

  openModalForJob(username: string) {
    const results = this.scanResults().get(username);
    if (!results) return;

    const currentGraphNodes = new Set(
      this.networkData().nodes
        .filter(n => n.id.toString().startsWith(`${username}-`))
        .map(n => n.label)
    );

    const platformsWithSelection = results.map((p: PlatformResult) => ({
      ...p,
      isSelected: currentGraphNodes.has(p.platform)
    }));

    this.modalResults.set({ username, platforms: platformsWithSelection });
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
  }

  onPlatformNodeClicked(nodeId: string) {
    if (this.isCustomEntityNode(nodeId)) return;

    if (this.viewMode() === 'list') {
      this.expandedPlatformNodeId.update(currentId => (currentId === nodeId ? null : nodeId));
      return;
    }

    const [username, platformName] = nodeId.split('-');
    const userResults = this.scanResults().get(username);
    if (!userResults) return;

    const platformData = userResults.find((p: PlatformResult) => p.platform === platformName);
    if (platformData) {
      this.selectedPlatformData.set(platformData);
      this.isMetadataPopupVisible.set(true);
    }
  }

  closeMetadataPopup() {
    this.isMetadataPopupVisible.set(false);
    this.selectedPlatformData.set(null);
  }

  closeSummaryPopup() {
    this.isSummaryPopupVisible.set(false);
    this.summaryPopupData.set(null);
  }

  updateGraphFromModal() {
    const { username, platforms } = this.modalResults();
    const centralNodeId = `user-${username}`;
    const selectedPlatforms = platforms.filter(p => p.isSelected);

    if (selectedPlatforms.length === 0) {
      this.updateState(state => {
        state.networkData.update(currentData => ({
          nodes: currentData.nodes.filter(n => n.id !== centralNodeId && !n.id.toString().startsWith(`${username}-`)),
          edges: currentData.edges.filter(e => e.from !== centralNodeId)
        }));
        state.activeUsernames.update(currentSet => {
          const newSet = new Set(currentSet);
          newSet.delete(username);
          return newSet;
        });
      });
      this.closeModal();
      return;
    }

    this.updateState(state => {
      state.networkData.update(currentData => {
        let newNodes = [...currentData.nodes];
        let newEdges = [...currentData.edges];

        if (!currentData.nodes.some(n => n.id === centralNodeId)) {
          newNodes.push({
            id: centralNodeId,
            label: username,
            shape: 'circularImage',
            image: `https://i.pravatar.cc/150?u=${username}`,
            size: 40,
            font: { color: '#ffffff' },
            color: {
              border: '#818cf8',
              background: '#3730a3',
              highlight: { border: '#c4b5fd', background: '#4f46e5' },
              hover: { border: '#a5b4fc', background: '#4338ca' }
            },
            title: `<b>${username}</b><br>Click to view profile summary`,
            shadow: { enabled: true, color: 'rgba(99, 102, 241, 0.6)', size: 25, x: 0, y: 0 }
          });
          state.activeUsernames.update(currentSet => new Set(currentSet).add(username));
        }

        const selectedPlatformNames = new Set(selectedPlatforms.map(p => p.platform));
        const existingPlatformNodes = currentData.nodes.filter(n => n.id.toString().startsWith(`${username}-`));
        const existingPlatformNames = new Set(existingPlatformNodes.map(n => n.label));

        const platformsToRemove = existingPlatformNodes.filter(node => !selectedPlatformNames.has(node.label));
        const nodeIdsToRemove = new Set(platformsToRemove.map(node => node.id));
        newNodes = newNodes.filter(node => !nodeIdsToRemove.has(node.id));
        newEdges = newEdges.filter(edge => !nodeIdsToRemove.has(edge.to));

        selectedPlatforms.forEach(platform => {
          if (!existingPlatformNames.has(platform.platform)) {
            const platformNodeId = `${username}-${platform.platform}`;
            newNodes.push({
              id: platformNodeId,
              label: platform.platform,
              shape: 'dot',
              size: 25,
              font: { color: '#e5e7eb' },
              color: {
                border: '#14b8a6',
                background: getPlatformColor(platform.platform),
                highlight: { border: '#5eead4', background: '#0d9488' },
                hover: { border: '#2dd4bf', background: '#0f766e' }
              },
              title: `<b>${platform.platform}</b><br>Click for details`
            });
            newEdges.push({ from: centralNodeId, to: platformNodeId });
          }
        });

        return { nodes: newNodes, edges: newEdges };
      });
    });

    this.closeModal();
  }

  togglePlatformSelection(platformName: string) {
    this.modalResults.update(current => {
      const updatedPlatforms = current.platforms.map(p =>
        p.platform === platformName ? { ...p, isSelected: !p.isSelected } : p
      );
      return { ...current, platforms: updatedPlatforms };
    });
  }

  onNodeRightClicked({ nodeId, event }: { nodeId: string; event: MouseEvent }) {
    if (this.isEditMode()) return;
    let type: 'user' | 'platform' | 'customEntity' | null = null;

    if (nodeId.startsWith('user-')) {
      type = 'user';
    } else if (this.isCustomEntityNode(nodeId)) {
      type = 'customEntity';
    } else if (nodeId) {
      type = 'platform';
    }

    if (type) {
      this.contextMenu.set({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: nodeId,
        type: type
      });
    } else {
      this.closeContextMenu();
    }
  }

  closeContextMenu() {
    this.contextMenu.set({ visible: false, x: 0, y: 0, nodeId: null, type: null });
  }

  removeAllPlatformNodes() {
    const username = this.contextMenuUsername();
    if (!username) {
      this.closeContextMenu();
      return;
    }

    this.updateState(state => {
      state.networkData.update(currentData => ({
        nodes: currentData.nodes.filter(n => !n.id.toString().startsWith(`${username}-`)),
        edges: currentData.edges.filter(e => e.from !== `user-${username}`)
      }));

      state.activeUsernames.update((currentSet: Set<string>) => {
        const newSet = new Set(currentSet);
        newSet.delete(username);
        return newSet;
      });
    });

    this.closeContextMenu();
  }

  removePlatformNode() {
    const nodeId = this.contextMenu().nodeId;
    if (!nodeId || this.contextMenu().type !== 'platform') {
      this.closeContextMenu();
      return;
    }

    this.updateState(state => {
      state.networkData.update(currentData => {
        const newNodes = currentData.nodes.filter((n: NetworkNode) => n.id !== nodeId);
        const newEdges = currentData.edges.filter((e: any) => e.to !== nodeId);

        const [username] = (nodeId as string).split('-');
        const centralNodeId = `user-${username}`;
        const hasOtherConnections = newEdges.some((e: any) => e.from === centralNodeId);

        if (!hasOtherConnections) {
          const finalNodes = newNodes.filter((n: NetworkNode) => n.id !== centralNodeId);
          state.activeUsernames.update((currentSet: Set<string>) => {
            const newSet = new Set(currentSet);
            newSet.delete(username);
            return newSet;
          });
          return { nodes: finalNodes, edges: newEdges };
        }

        return { nodes: newNodes, edges: newEdges };
      });
    });
    this.closeContextMenu();
  }

  openAddEntityModal(type: 'wallet' | 'email' | 'domain') {
    this.entityToAdd.set({ type, value: '' });
    this.isAddEntityModalVisible.set(true);
  }

  closeAddEntityModal() {
    this.isAddEntityModalVisible.set(false);
    this.entityToAdd.set(null);
  }

  onEntityValueChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.entityToAdd.update(e => e ? { ...e, value } : null);
  }

  confirmAddEntity() {
    const entityInfo = this.entityToAdd();
    if (!entityInfo || !entityInfo.value.trim()) {
      return;
    }

    const { type, value } = entityInfo;
    const label = value.trim();
    const tempId = `pending-${self.crypto.randomUUID()}`;

    const pendingEntity: CustomEntity = {
      id: tempId,
      type,
      label,
      value: value.trim(),
      onGraph: false,
      status: 'pending'
    };

    this.updateState(state => {
      state.customEntities.update((entities: CustomEntity[]) => [pendingEntity, ...entities]);
      state.activeHomeMenuTab.set('entities');
    });

    this.closeAddEntityModal();

    const entityPayload = { type, label, value: value.trim() };

    this.scanService.addEntity(entityPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newEntity) => {
          this.updateState(state => state.customEntities.update((entities: CustomEntity[]) =>
            entities.map((e: CustomEntity) => e.id === tempId ? newEntity : e)
          ));
        },
        error: (err) => {
          console.error('Failed to add entity:', err);
          this.updateState(state => state.customEntities.update((entities: CustomEntity[]) => entities.filter((e: CustomEntity) => e.id !== tempId)));
        }
      });
  }

  addEntityToGraph(entityId: string) {
    const entity = this.customEntities().find(e => e.id === entityId);
    if (!entity || entity.onGraph || entity.status === 'pending') return;

    const colors = {
      wallet: { border: '#4ade80', background: '#166534' },
      email: { border: '#facc15', background: '#854d0e' },
      domain: { border: '#38bdf8', background: '#075985' }
    };

    const newNode: NetworkNode = {
      id: entity.id,
      label: entity.label,
      shape: 'box',
      size: 25,
      font: { color: '#e5e7eb' },
      color: {
        border: colors[entity.type].border,
        background: colors[entity.type].background,
        highlight: { border: '#ffffff', background: colors[entity.type].border },
        hover: { border: '#ffffff', background: colors[entity.type].border }
      },
      title: `<b>${entity.type.toUpperCase()}</b><br>${entity.label}`
    };

    this.updateState(state => {
      state.networkData.update((d: NetworkData) => ({ ...d, nodes: [...d.nodes, newNode] }));
      state.customEntities.update((entities: CustomEntity[]) => entities.map((e: CustomEntity) => e.id === entityId ? { ...e, onGraph: true } : e));
    });
  }

  deleteCustomEntity(nodeId: string) {
    this.updateState(state => {
      state.customEntities.update((entities: CustomEntity[]) => entities.filter((e: CustomEntity) => e.id !== nodeId));
      state.networkData.update((d: NetworkData) => ({
        ...d,
        nodes: d.nodes.filter((n: NetworkNode) => n.id !== nodeId),
        edges: d.edges.filter((e: any) => e.from !== nodeId && e.to !== nodeId)
      }));
    });
    this.closeContextMenu();
  }

  isCustomEntityNode(nodeId: string): boolean {
    return this.customEntities().some(e => e.id === nodeId);
  }

  handleEdgeAdded(edge: { from: string, to: string }) {
    const isUserToUser = edge.from.startsWith('user-') && edge.to.startsWith('user-');
    const isConnectingToEntity = this.isCustomEntityNode(edge.from) || this.isCustomEntityNode(edge.to);

    let styledEdge: any = { ...edge };

    if (isUserToUser) {
      styledEdge = {
        ...edge,
        dashes: [5, 5],
        color: { color: '#fb923c', highlight: '#fdba74', hover: '#f97316' },
        width: 2.5,
        smooth: { type: 'curvedCW', roundness: 0.2 }
      };
    } else if (isConnectingToEntity) {
      styledEdge = {
        ...edge,
        dashes: [2, 2],
        color: { color: '#a78bfa', highlight: '#c4b5fd', hover: '#8b5cf6' },
        width: 2,
        smooth: { type: 'dynamic' }
      };
    }

    this.updateState(state => state.networkData.update((d: NetworkData) => ({ ...d, edges: [...d.edges, styledEdge] })));
  }

  handleEdgeDeleted({ edges }: { edges: string[] }) {
    this.updateState(state => state.networkData.update((d: NetworkData) => ({
      ...d,
      edges: d.edges.filter((e: any) => !edges.includes((e as any).id))
    })));
  }

  toggleMobileEntityPanel(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isMobileEntityPanelOpen.update(v => !v);
  }

  closeMobileEntityPanel(): void {
    this.isMobileEntityPanelOpen.set(false);
  }

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
    }
  }
}
