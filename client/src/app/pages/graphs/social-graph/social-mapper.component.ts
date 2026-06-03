import { Component, ChangeDetectionStrategy, signal, computed, DestroyRef, OnDestroy, PLATFORM_ID, effect, OnInit, viewChild, ElementRef, Inject, inject, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MetadataPopupComponent } from './metadata-popup/metadata-popup.component';
import { ProfileSummaryPopupComponent } from './profile-summary-popup/profile-summary-popup.component';
import { CustomEntity, Job, PlatformResult, TabState } from '../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../shared/services/social-scan.service';
import { TabManagerService } from '../shared/services/tab-manager.service';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { ListViewComponent } from './list-view/list-view.component';
import { Subject } from 'rxjs';
import { Position } from 'vis-network';
import { FollowerScanPopupComponent } from './follower-scan-popup/follower-scan-popup.component';
import { FetchingStateService } from './services/fetching-state.service';
import { ManageProfilesModalComponent } from './profile-summary-popup/manage-profiles-modal/manage-profiles-modal.component';
import { ContextMenuComponent, ContextMenuAction } from './network-graph/context-menu/context-menu.component';
import { NotificationBarComponent } from './notification-bar/notification-bar.component';
import { GraphOrchestratorService } from './services/graph-orchestrator.service';
import { EntityManagerComponent } from './entity-manager/entity-manager.component';
import { AddEntityModalComponent } from './entity-manager/add-entity-modal/add-entity-modal.component';
import { SocialMapperStateService } from './services/social-mapper-state.service';
import { RelationshipConnectionItem } from './services/social-mapper-state.service';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { MessagePopupComponent } from '../../../shared/partials/message-popup/message-popup.component';
import { RelationshipDetailsPopupComponent } from './relationship-details-popup/relationship-details-popup.component';
import { SocialScanJobService } from './services/social-scan-job.service';
import { PlatformFetchService } from './services/platform-fetch.service';
import { RelationshipResolverService } from './services/relationship-resolver.service';
import { GraphLoadingComponent } from '../shared/graph-loading/graph-loading.component';
import { getFirstFileFromInputEvent, readFileAsDataUrl } from '../../../shared/utils/file-input.util';
import { getEntityRecordEntries, getEntityReportRecords } from './utils/social-graph-view.util';
@Component({
  selector: 'app-social-graph',
  templateUrl: './social-mapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MetadataPopupComponent,
    ProfileSummaryPopupComponent,
    HomeMenuComponent,
    ListViewComponent,
    FollowerScanPopupComponent,
    ManageProfilesModalComponent,
    ConfirmationPopupComponent,
    MessagePopupComponent,
    ContextMenuComponent,
    NotificationBarComponent,
    EntityManagerComponent,
    AddEntityModalComponent,
    RelationshipDetailsPopupComponent,
    GraphLoadingComponent
  ]
})
export class SocialMapperComponent implements OnInit, OnDestroy {
  private activeTabState = computed(() => this.tabManager.activeTab()?.state);
  private cancelScanSubjects = new Map<string, Subject<void>>();
  private cancelProfileFetchSubjects = new Map<string, Subject<void>>();
  private cancelPostFetchSubjects = new Map<string, Subject<void>>();
  private cancelPlatformImageFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowersFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowingFetchSubjects = new Map<string, Subject<void>>();
  private mediaQueryList: MediaQueryList | null = null;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => this.isSmallScreen.set(event.matches);

  public state = inject(SocialMapperStateService);
  isTailwindReady = signal(true);
  searchTerm = computed(() => this.activeTabState()?.searchTerm() ?? '');
  homeMenuSearchTerm = computed(() => this.activeTabState()?.homeMenuSearchTerm() ?? '');
  jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  networkData = computed(() => this.activeTabState()?.networkData() ?? { nodes: [], edges: [] });
  scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
  activeUsernames = computed(() => this.activeTabState()?.activeUsernames() ?? new Set<string>());
  customEntities = computed(() => this.activeTabState()?.customEntities() ?? []);
  isHomeMenuCollapsed = computed(() => this.activeTabState()?.isHomeMenuCollapsed() ?? false);
  isEntityMenuCollapsed = computed(() => this.activeTabState()?.isEntityMenuCollapsed() ?? false);
  activeHomeMenuTab = computed(() => this.activeTabState()?.activeHomeMenuTab() ?? 'history');
  isPhysicsEnabled = computed(() => this.activeTabState()?.isPhysicsEnabled() ?? false);
  isSmallScreen = signal(false);
  userNodeAliases = signal<Record<string, string>>({});
  platformAliasModalData = signal<{
        nodeId: string;
        username: string;
    } | null>(null);
  platformAliasInput = signal('');
  selectedEntityReport = signal<CustomEntity | null>(null);
  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  entityManager = viewChild(EntityManagerComponent);
  isSearchDisabled = computed(() => this.searchTerm().trim().length === 0);
  isUserScanInProgress = computed(() => {
    return this.isScanInProgressForUsername(this.state.summaryPopupData()?.username);
  });
  isMetadataUserScanInProgress = computed(() => {
    return this.isScanInProgressForUsername(this.state.selectedPlatformData()?.keyUsername);
  });
  nodesWithFollows = computed(() => {
    const nodeIdsWithFollowData = new Set<string>();
    for (const platformResults of this.scanResults().values()) {
      for (const platform of platformResults) {
        const hasData = (platform.followers_list?.length ?? 0) > 0
          || (platform.following_list?.length ?? 0) > 0
          || (platform.post_connections?.length ?? 0) > 0;
        if (hasData) {
          nodeIdsWithFollowData.add(this.fetchingState.getPlatformUniqueKey(platform));
        }
      }
    }
    const visibleNodeIdsWithFollows = new Set<string>();
    for (const node of this.networkData().nodes) {
      const nodeIdStr = node.id.toString();
      if (nodeIdsWithFollowData.has(nodeIdStr)) {
        visibleNodeIdsWithFollows.add(nodeIdStr);
      }
    }
    return visibleNodeIdsWithFollows;
  });
  isCustomEntityNode = (nodeId: string): boolean => this.customEntities().some(e => e.id === nodeId);

  private requireActiveTabState(): TabState {
    const activeState = this.activeTabState();
    if (!activeState) {
      throw new Error('Active tab state is not available');
    }
    return activeState;
  }

  constructor( private scanService: SocialScanService, private destroyRef: DestroyRef, public tabManager: TabManagerService, private fetchingState: FetchingStateService, private graphOrchestrator: GraphOrchestratorService, private scanJobService: SocialScanJobService, private platformFetchService: PlatformFetchService, private relationshipResolver: RelationshipResolverService, @Inject(PLATFORM_ID) private platformId: object ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQueryList = window.matchMedia('(max-width: 1023px)');
      this.isSmallScreen.set(this.mediaQueryList.matches);
      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      effect(() => {
        if (this.isSmallScreen()) {
          this.updateState(state => {
            state.viewMode.set('list');
            state.activeHomeMenuTab.set('history');
          }, false);
        }
      });
      effect(() => {
        const aliases = this.userNodeAliases();
        const currentData = this.networkData();
        let hasChanges = false;
        const updatedNodes = currentData.nodes.map(node => {
          const nodeId = node.id.toString();
          if (!nodeId.startsWith('user-')) {
            return node;
          }
          const alias = (aliases[nodeId] || '').trim();
          if (alias.length > 0) {
            if (node.label === alias) {
              return node;
            }
            hasChanges = true;
            return { ...node, label: alias };
          }
          const defaultLabel = nodeId.substring('user-'.length);
          if (!defaultLabel || node.label === defaultLabel) {
            return node;
          }
          hasChanges = true;
          return { ...node, label: defaultLabel };
        });
        if (hasChanges) {
          this.updateState(state => state.networkData.set({ ...currentData, nodes: updatedNodes }), false);
        }
      });
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.resumeIncompleteScans();
      return;
    }
    if (!this.isSmallScreen()) {
      this.updateState(state => state.isEntityMenuCollapsed.set(false), false);
    }
    this.resumeIncompleteScans();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
  }

  private isScanInProgressForUsername(username?: string): boolean {
    if (!username) {
      return false;
    }
    const userJob = this.jobs().find(j => j.username.toLowerCase() === username.toLowerCase());
    return userJob?.status === 'in_progress' || userJob?.status === 'queued';
  }

  private updateState(updater: (state: TabState) => void, shouldScheduleSave: boolean = true) {
    const state = this.activeTabState();
    if (state) {
      updater(state);
      if (shouldScheduleSave) {
        this.tabManager.scheduleSave();
      }
    }
  }

  onSearchChanged(termOrEvent: string | Event) {
    const term = typeof termOrEvent === 'string'
      ? termOrEvent
      : (termOrEvent.target as HTMLInputElement | null)?.value ?? '';
    this.updateState(state => state.searchTerm.set(term), false);
  }

  onHomeMenuSearchChanged(term: string) {
    this.updateState(state => state.homeMenuSearchTerm.set(term), false);
  }

  onHomeMenuToggled() {
    this.updateState(state => state.isHomeMenuCollapsed.update(v => !v), false);
  }

  onHomeMenuHistoryTabClicked() {
    this.updateState(state => state.viewMode.set('list'), false);
  }

  onEntityMenuToggled() {
    this.updateState(state => state.isEntityMenuCollapsed.update(v => !v), false);
  }

  onPlatformAliasInputChanged(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.platformAliasInput.set(nextValue);
  }

  closePlatformAliasModal() {
    this.platformAliasModalData.set(null);
    this.platformAliasInput.set('');
  }

  savePlatformAlias() {
    const modalData = this.platformAliasModalData();
    if (!modalData) {
      return;
    }
    const alias = this.platformAliasInput().trim();
    this.userNodeAliases.update(current => {
      const next = { ...current };
      if (alias.length > 0) {
        next[modalData.nodeId] = alias;
      }
      else {
        delete next[modalData.nodeId];
      }
      return next;
    });
    this.closePlatformAliasModal();
  }

  triggerScan() {
    let username = this.homeMenuSearchTerm().trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username) {
      this.initiateScan(username);
      this.updateState(state => state.homeMenuSearchTerm.set(''), false);
    }
  }

  triggerImageUpload() {
    this.imageInput()?.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const selected = getFirstFileFromInputEvent(event);
    if (!selected) {
      return;
    }
    const { input, file } = selected;
    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        const base64Image = dataUrl.split(',')[1];
        if (base64Image) {
          this.initiateImageScan(base64Image, file.name);
        }
      })
      .finally(() => {
        input.value = '';
      });
  }

  confirmDeletion() {
    const usernameToDelete = this.state.deleteUsername();
    const entityIdToDelete = this.state.deleteEntityId();
    if (usernameToDelete) {
      this.cancelAllFetchesForUser(usernameToDelete);
      this.removeUserScanData(usernameToDelete);
    }
    else if (entityIdToDelete) {
      this.entityManager()?.deleteCustomEntity(entityIdToDelete);
    }
    this.state.closeDeleteConfirmation();
  }

  onDeleteConfirmation(confirmed: boolean) {
    if (confirmed) {
      this.confirmDeletion();
    }
    else {
      this.state.closeDeleteConfirmation();
    }
  }

  onInfoPopupConfirmed(_confirmed: boolean) {
    this.state.closeInfoModal();
  }

  async handleCompletedJobClick(job: Job) {
    if (job.status !== 'completed') {
      return;
    }
    const username = job.username;
    if (!this.activeUsernames().has(username)) {
      const results = this.scanResults().get(username);
      if (results && results.length > 0) {
        await this.graphOrchestrator.updateGraphFromModal(this.requireActiveTabState(), username, results);
      }
    }
    this.state.setActiveUserByUsername(username);
    this.updateState(state => state.viewMode.set('list'), false);
  }

  handleFollowerScan(usernames: string[]) {
    usernames.forEach(username => {
      this.initiateScan(username);
    });
  }

  openFollowerScanFromNode(nodeId: string) {
    this.state.openFollowerScanPopup(nodeId);
  }

  handleRescan(username: string) {
    this.initiateScan(username); this.state.closeSummaryPopup();
  }

  private initiateScan(username: string) {
    this.scanJobService.initiateScan(username, {
      jobs: () => this.jobs(),
      updateState: this.updateState.bind(this),
      state: this.state,
      scanService: this.scanService,
      destroyRef: this.destroyRef,
      cancelScanSubjects: this.cancelScanSubjects
    });
  }

  private initiateImageScan(base64Image: string, fileName: string) {
    this.scanJobService.initiateImageScan(base64Image, fileName, this.buildScanJobOptions());
  }

  cancelScan(jobId: string) {
    this.scanJobService.cancelScan(jobId, {
      jobs: () => this.jobs(),
      updateState: this.updateState.bind(this),
      state: this.state,
      scanService: this.scanService,
      destroyRef: this.destroyRef,
      cancelScanSubjects: this.cancelScanSubjects
    });
  }

  private resumeIncompleteScans() {
    this.scanJobService.resumeIncompleteScans(() => this.jobs(), this.buildScanJobOptions());
  }

  private buildScanJobOptions() {
    return {
      jobs: () => this.jobs(),
      updateState: this.updateState.bind(this),
      state: this.state,
      scanService: this.scanService,
      destroyRef: this.destroyRef,
      cancelScanSubjects: this.cancelScanSubjects
    };
  }

  private removeUserScanData(username: string) {
    const normalizedUsername = username.toLowerCase();
    this.updateState(state => {
      state.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== normalizedUsername));
      state.scanResults.update(currentMap => {
        const newMap = new Map(currentMap); newMap.delete(username); return newMap;
      });
    });
    this.graphOrchestrator.removeUserFromGraph(this.requireActiveTabState(), username);
  }

  fetchProfileDetails(p: PlatformResult) {
    this.fetchData(p, 'profile', this.scanService.fetchProfileInfo(p.platform, p.username), this.cancelProfileFetchSubjects);
  }

  handleFetchSocialPosts(p: PlatformResult) {
    this.fetchData(p, 'posts', this.scanService.fetchSocialPosts(p.platform, p.username), this.cancelPostFetchSubjects);
  }

  handleFetchImagesForPlatform(p: PlatformResult) {
    this.fetchData(p, 'platformImages', this.scanService.fetchPlatformImages(p.platform, p.username), this.cancelPlatformImageFetchSubjects);
  }

  handleFetchFollowers(p: PlatformResult) {
    this.fetchData(p, 'followers', this.scanService.fetchFollowers(p.platform, p.username), this.cancelFollowersFetchSubjects);
  }

  handleFetchFollowing(p: PlatformResult) {
    this.fetchData(p, 'following', this.scanService.fetchFollowing(p.platform, p.username), this.cancelFollowingFetchSubjects);
  }

  private fetchData(platformResult: PlatformResult, stateKey: 'profile' | 'posts' | 'platformImages' | 'followers' | 'following', request$: any, cancelMap: Map<string, Subject<void>>) {
    this.platformFetchService.fetchData({
      platformResult,
      stateKey,
      request$,
      cancelMap,
      fetchingState: this.fetchingState,
      destroyRef: this.destroyRef,
      updateState: this.updateState.bind(this),
      state: this.state,
      graphOrchestrator: this.graphOrchestrator,
      activeTabState: () => this.activeTabState()
    });
  }

  cancelFetchProfileDetails(p: PlatformResult) {
    this.cancelFetch(p, 'profile', this.cancelProfileFetchSubjects);
  }

  handleCancelFetchSocialPosts(p: PlatformResult) {
    this.cancelFetch(p, 'posts', this.cancelPostFetchSubjects);
  }

  handleCancelFetchImagesForPlatform(p: PlatformResult) {
    this.cancelFetch(p, 'platformImages', this.cancelPlatformImageFetchSubjects);
  }

  handleCancelFetchFollowers(p: PlatformResult) {
    this.cancelFetch(p, 'followers', this.cancelFollowersFetchSubjects);
  }

  handleCancelFetchFollowing(p: PlatformResult) {
    this.cancelFetch(p, 'following', this.cancelFollowingFetchSubjects);
  }

  private cancelFetch(p: PlatformResult, stateKey: 'profile' | 'posts' | 'platformImages' | 'followers' | 'following', cancelMap: Map<string, Subject<void>>) {
    this.platformFetchService.cancelFetch(p, stateKey, cancelMap, this.fetchingState);
  }

  cancelAllFetchesForUser(username: string) {
    this.platformFetchService.cancelAllFetchesForUser(username, this.scanResults(), {
      profile: (p: PlatformResult) => {
        this.cancelFetchProfileDetails(p);
      },
      posts: (p: PlatformResult) => {
        this.handleCancelFetchSocialPosts(p);
      },
      images: (p: PlatformResult) => {
        this.handleCancelFetchImagesForPlatform(p);
      },
      followers: (p: PlatformResult) => {
        this.handleCancelFetchFollowers(p);
      },
      following: (p: PlatformResult) => {
        this.handleCancelFetchFollowing(p);
      }
    });
  }

  onNodeClicked(nodeId: string) {
    if (!nodeId.startsWith('user-')) {
      return;
    }
    this.state.openSummaryPopup(nodeId.replace('user-', ''));
  }

  onPlatformNodeClicked(nodeId: string) {
    if (this.isCustomEntityNode(nodeId)) {
      const element = document.getElementById(nodeId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    if (!nodeId.startsWith('platform-')) {
      return;
    }
    const element = document.getElementById(nodeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    this.state.openPlatformNodePopup(nodeId);
  }

  closeEntityReportPopup() {
    this.selectedEntityReport.set(null);
  }

  getEntityReportRecords(entity: CustomEntity): Record<string, unknown>[] {
    return getEntityReportRecords(entity);
  }

  getEntityRecordEntries(record: Record<string, unknown>): { key: string; label: string; values: string[]; }[] {
    return getEntityRecordEntries(record);
  }

  onRelationshipNodeClicked(nodeId: string) {
    const relationshipNode = this.networkData().nodes.find(node => node.id.toString() === nodeId);
    if (!relationshipNode) {
      return;
    }
    const users = this.resolveRelationshipUsers(nodeId);
    if (!users) {
      return;
    }
    const [userA, userB] = users;
    const connections = this.buildRelationshipConnections(userA, userB);
    const fallbackCount = Number((relationshipNode.relationshipCount ?? relationshipNode.label) || 0);
    const resolvedCount = connections.length > 0 ? connections.length : fallbackCount;
    this.state.openRelationshipPopup({
      userA,
      userB,
      count: resolvedCount,
      connections
    });
  }

  private buildRelationshipConnections(userA: string, userB: string): RelationshipConnectionItem[] {
    return this.relationshipResolver.buildRelationshipConnections(userA, userB, this.scanResults());
  }

  private resolveRelationshipUsers(nodeId: string): [string, string] | null {
    const pairKey = nodeId.replace('relationship-node-', '');
    const activeUsers = Array.from(this.activeUsernames());
    for (let i = 0; i < activeUsers.length; i++) {
      for (let j = i + 1; j < activeUsers.length; j++) {
        const sortedPair = [activeUsers[i], activeUsers[j]].sort((a, b) => a.localeCompare(b));
        if ([sortedPair[0], sortedPair[1]].join('--') === pairKey) {
          return [sortedPair[0], sortedPair[1]];
        }
      }
    }
    const fallback = pairKey.split('--');
    if (fallback.length === 2) {
      return [fallback[0], fallback[1]];
    }
    return null;
  }

  async updateGraphFromModal(selectedPlatforms: PlatformResult[]) {
    const username = this.state.manageProfilesModalData()!.username;
    this.state.closeManageProfilesModal();
    const MAX_TOTAL_NODES = 300;
    const otherNodesCount = this.networkData().nodes.filter(n => {
      const id = n.id.toString();
      return id !== `user-${username}` && !id.startsWith(`platform-${username}|`) && !id.startsWith(`group-${username}-`);
    }).length;
    if (otherNodesCount + (selectedPlatforms.length > 0 ? 1 : 0) + selectedPlatforms.length > MAX_TOTAL_NODES) {
      this.state.openInfoModal('warning', 'Maximum Node Limit Reached', 'The graph has reached its maximum capacity of 300 nodes. Please remove some nodes before adding more.');
      return;
    }
    await this.graphOrchestrator.updateGraphFromModal(this.requireActiveTabState(), username, selectedPlatforms);
    this.tabManager.scheduleSave();
  }

  handleImageFlowSearch(username: string) {
    const normalizedUsername = (username || '').trim();
    if (!normalizedUsername) {
      return;
    }
    this.state.closeManageProfilesModal();
    this.initiateScan(normalizedUsername);
  }

  handleContextMenuAction(action: ContextMenuAction) {
    const { nodeId } = this.state.contextMenuData()!;
    const username = nodeId.replace('user-', '');
    const handlers: Record<ContextMenuAction, () => void> = {
      fetchLinks: () => this.state.openInfoModal('info', 'Feature Coming Soon', "We're hard at work building this feature. Stay tuned for updates!", 'Got it!'),
      clearConnections: () => {
        this.graphOrchestrator.removeAllPlatformNodes(this.requireActiveTabState(), username);
        this.tabManager.scheduleSave();
      },
      deleteProfile: () => {
        this.graphOrchestrator.removeUserFromGraph(this.requireActiveTabState(), username);
        this.tabManager.scheduleSave();
      },
      setAlias: () => {
        if (!nodeId.startsWith('user-')) {
          return;
        }
        const profileUsername = nodeId.substring('user-'.length);
        const currentAlias = this.userNodeAliases()[nodeId] || '';
        this.platformAliasModalData.set({ nodeId, username: profileUsername });
        this.platformAliasInput.set(currentAlias);
      },
      removeNode: () => {
        this.graphOrchestrator.removeSingleNode(this.requireActiveTabState(), nodeId);
        this.tabManager.scheduleSave();
      },
      deleteEntity: () => {
        this.deleteCustomEntity(nodeId);
      },
      openRelationship: () => {
        this.onRelationshipNodeClicked(nodeId);
      },
    };
    handlers[action]();
    this.state.closeContextMenu();
  }

  addEntityToGraph(entityId: string) {
    const entity = this.customEntities().find(current => current.id === entityId);
    if (entity?.onGraph) {
      this.state.focusOnNode(entityId);
      return;
    }
    this.entityManager()?.addEntityToGraph(entityId);
  }

  deleteCustomEntity(nodeId: string) {
    const entity = this.customEntities().find(e => e.id === nodeId);
    this.state.openDeleteEntityConfirmation(nodeId, entity?.label || entity?.value || nodeId);
    this.state.closeContextMenu();
  }

  handleEdgeAdded( edge: { from: string; to: string; } ) {
    this.graphOrchestrator.addEdge(this.requireActiveTabState(), edge);
    this.tabManager.scheduleSave();
  }

  handleEdgeDeleted( { edges }: { edges: string[]; } ) {
    this.graphOrchestrator.deleteEdges(this.requireActiveTabState(), edges);
    this.tabManager.scheduleSave();
  }

  async handleGroupNodeClicked( { nodeId, position }: { nodeId: string; position: Position; } ) {
    const wasPhysicsEnabled = this.isPhysicsEnabled();
    if (!wasPhysicsEnabled) {
      this.updateState(state => state.isPhysicsEnabled.set(true), false);
    }
    await this.graphOrchestrator.handleGroupNodeClicked(this.requireActiveTabState(), { nodeId, position });
    this.tabManager.scheduleSave();
    if (!wasPhysicsEnabled) {
      setTimeout(() => {
        this.updateState(state => state.isPhysicsEnabled.set(false), false);
      }, 2500);
    }
  }
}
