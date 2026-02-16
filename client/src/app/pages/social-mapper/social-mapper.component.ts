import { Component, ChangeDetectionStrategy, signal, computed, DestroyRef, OnDestroy, PLATFORM_ID, effect, OnInit, viewChild, ElementRef, Inject, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { MetadataPopupComponent } from './metadata-popup/metadata-popup.component';
import { ProfileSummaryPopupComponent } from './profile-summary-popup/profile-summary-popup.component';
import { Job, PlatformResult, TabState, ScanEvent } from '../../shared/model/social/social-scan.models';
import { SocialScanService } from './services/social-scan.service';
import { TabManagerService } from './services/tab-manager.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { ListViewComponent } from './list-view/list-view.component';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { socialMapperAnimations } from '../../shared/animations/social-mapper.animations';
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
import { ConfirmationPopupComponent } from '../../shared/partials/confirmation-popup/confirmation-popup.component';
import { MessagePopupComponent } from '../../shared/partials/message-popup/message-popup.component';
import { RelationshipDetailsPopupComponent } from './relationship-details-popup/relationship-details-popup.component';


@Component({
  selector: 'app-social-mapper',
  templateUrl: './social-mapper.component.html',
  styleUrl: './social-mapper.scss',
  styles: [socialMapperAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule, NetworkGraphComponent, MetadataPopupComponent,
    ProfileSummaryPopupComponent, ToolbarComponent, HomeMenuComponent,
    ListViewComponent, TabBarComponent,
    FollowerScanPopupComponent, ManageProfilesModalComponent, ConfirmationPopupComponent,
    MessagePopupComponent, ContextMenuComponent, NotificationBarComponent,
    EntityManagerComponent, AddEntityModalComponent, RelationshipDetailsPopupComponent,
  ]
})
export class SocialMapperComponent implements OnInit, OnDestroy {
  public state = inject(SocialMapperStateService);
  private readonly twId = 'tw-social';
  isTailwindReady = signal(false);
  private activeTabState = computed(() => this.tabManager.activeTab()?.state);
  private cancelScanSubjects = new Map<string, Subject<void>>();
  private cancelProfileFetchSubjects = new Map<string, Subject<void>>();
  private cancelPostFetchSubjects = new Map<string, Subject<void>>();
  private cancelPlatformImageFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowersFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowingFetchSubjects = new Map<string, Subject<void>>();

  searchTerm = computed(() => this.activeTabState()?.searchTerm() ?? '');
  homeMenuSearchTerm = computed(() => this.activeTabState()?.homeMenuSearchTerm() ?? '');
  jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  networkData = computed(() => this.activeTabState()?.networkData() ?? { nodes: [], edges: [] });
  scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
  activeUsernames = computed(() => this.activeTabState()?.activeUsernames() ?? new Set<string>());
  customEntities = computed(() => this.activeTabState()?.customEntities() ?? []);
  isEditMode = computed(() => this.activeTabState()?.isEditMode() ?? false);
  isHomeMenuCollapsed = computed(() => this.activeTabState()?.isHomeMenuCollapsed() ?? false);
  isEntityMenuCollapsed = computed(() => this.activeTabState()?.isEntityMenuCollapsed() ?? false);
  activeHomeMenuTab = computed(() => this.activeTabState()?.activeHomeMenuTab() ?? 'history');
  isPhysicsEnabled = computed(() => this.activeTabState()?.isPhysicsEnabled() ?? false);
  viewMode = computed(() => this.activeTabState()?.viewMode() ?? 'graph');

  expandedPlatformNodeId = signal<string | null>(null);
  graphSearchTerm = signal('');
  isGraphSearchExpanded = signal(false);
  isSmallScreen = signal(false);
  userNodeAliases = signal<Record<string, string>>({});
  platformAliasModalData = signal<{ nodeId: string; username: string } | null>(null);
  platformAliasInput = signal('');

  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  entityManager = viewChild(EntityManagerComponent);

  isSearchDisabled = computed(() => this.searchTerm().trim().length === 0);

  canEditConnections = computed(() => {
    const nodes = this.networkData().nodes;
    const userNodeCount = nodes.filter(n => n.id.toString().startsWith('user-')).length;
    const customEntityOnGraphCount = this.customEntities().filter(e => e.onGraph).length;
    const connectableNodesCount = userNodeCount + customEntityOnGraphCount;
    return connectableNodesCount >= 2;
  });

  isUserScanInProgress = computed(() => {
    const username = this.state.summaryPopupData()?.username;
    if (!username) {
	return false;
}
    const userJob = this.jobs().find(j => j.username.toLowerCase() === username.toLowerCase());
    return userJob?.status === 'in_progress';
  });

  isMetadataUserScanInProgress = computed(() => {
    const username = this.state.selectedPlatformData()?.keyUsername;
    if (!username) {
	return false;
}
    const userJob = this.jobs().find(j => j.username.toLowerCase() === username.toLowerCase());
    return userJob?.status === 'in_progress';
  });

  nodesWithFollows = computed(() => {
    const nodeIdsWithFollowData = new Set<string>();
    for (const platformResults of this.scanResults().values()) {
        for (const platform of platformResults) {
            const hasData = (platform.followers_list?.length ?? 0) > 0 || (platform.following_list?.length ?? 0) > 0;
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

  private mediaQueryList: MediaQueryList | null = null;
  private tailwindLinkEl: HTMLLinkElement | null = null;
  private ownsTailwindLink = false;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => this.isSmallScreen.set(event.matches);

  constructor(private scanService: SocialScanService, private destroyRef: DestroyRef, public tabManager: TabManagerService, private fetchingState: FetchingStateService, private graphOrchestrator: GraphOrchestratorService, @Inject(PLATFORM_ID) private platformId: object) {
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
          this.updateState(state => state.networkData.set({ ...currentData, nodes: updatedNodes }));
        }
      });
    } else {
      this.isTailwindReady.set(true);
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.resumeIncompleteScans();
      return;
    }
    this.loadTailwindSocialStyles();
    if (!this.isSmallScreen()) {
      this.updateState(state => state.isEntityMenuCollapsed.set(false));
    }
    this.resumeIncompleteScans();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
    if (isPlatformBrowser(this.platformId) && this.ownsTailwindLink) {
      this.tailwindLinkEl?.remove();
      this.tailwindLinkEl = null;
    }
  }

  private loadTailwindSocialStyles() {
    const existingLink = document.getElementById(this.twId) as HTMLLinkElement | null;
    if (existingLink) {
      this.tailwindLinkEl = existingLink;
      if (existingLink.dataset['ready'] === 'true' || !!existingLink.sheet) {
        this.isTailwindReady.set(true);
        return;
      }
      existingLink.addEventListener('load', () => this.isTailwindReady.set(true), { once: true });
      existingLink.addEventListener('error', () => this.isTailwindReady.set(true), { once: true });
      return;
    }

    const link = document.createElement('link');
    link.id = this.twId;
    link.rel = 'stylesheet';
    link.href = 'tailwind-social.css';
    link.addEventListener('load', () => {
      link.dataset['ready'] = 'true';
      this.isTailwindReady.set(true);
    }, { once: true });
    link.addEventListener('error', () => this.isTailwindReady.set(true), { once: true });
    document.head.appendChild(link);
    this.tailwindLinkEl = link;
    this.ownsTailwindLink = true;
  }

  private updateState(updater: (state: TabState) => void) {
    const state = this.activeTabState();
    if (state) {
      updater(state);
      this.tabManager.scheduleSave();
    }
  }

  onSearchChanged(term: string) { this.updateState(state => state.searchTerm.set(term)); }
  onViewModeChanged(mode: 'graph' | 'list') { this.updateState(state => state.viewMode.set(mode)); }
  onPhysicsToggled() { this.updateState(state => state.isPhysicsEnabled.update(v => !v)); }
  onEditModeToggled() { this.updateState(state => state.isEditMode.update(v => !v)); }

  onHomeMenuSearchChanged(term: string) { this.updateState(state => state.homeMenuSearchTerm.set(term)); }
  onHomeMenuToggled() { this.updateState(state => state.isHomeMenuCollapsed.update(v => !v)); }
  onEntityMenuToggled() { this.updateState(state => state.isEntityMenuCollapsed.update(v => !v)); }
  onHomeMenuTabSelected(tab: 'history' | 'entities') { this.updateState(state => state.activeHomeMenuTab.set(tab)); }

  onGraphSearchChanged(event: Event) { this.graphSearchTerm.set((event.target as HTMLInputElement).value); }
  toggleGraphSearch() { this.isGraphSearchExpanded.update(v => !v); }
  expandGraphSearch() { this.isGraphSearchExpanded.set(true); }
  collapseGraphSearch() {
    if (!this.graphSearchTerm().trim()) {
      this.isGraphSearchExpanded.set(false);
    }
  }
  clearGraphSearch() {
    this.graphSearchTerm.set('');
    this.isGraphSearchExpanded.set(false);
  }

  onPlatformAliasInputChanged(event: Event) {
    this.platformAliasInput.set((event.target as HTMLInputElement).value);
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
      } else {
        delete next[modalData.nodeId];
      }
      return next;
    });
    this.closePlatformAliasModal();
  }

  triggerScan() {
    let username = this.searchTerm().trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username) {
      this.initiateScan(username);
      this.updateState(state => state.searchTerm.set(''));
    }
  }

  triggerImageUpload() { this.imageInput()?.nativeElement.click(); }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
            const base64Image = (e.target.result as string).split(',')[1];
            this.initiateImageScan(base64Image, file.name);
        }
      };
      reader.readAsDataURL(file);
      input.value = '';
    }
  }

  confirmDeletion() {
    const usernameToDelete = this.state.deleteUsername();
    if (usernameToDelete) {
      this.cancelAllFetchesForUser(usernameToDelete);
      this.removeUserScanData(usernameToDelete);
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

  handleCompletedJobClick(job: Job) {
    if (job.status === 'completed') {
      this.state.openManageProfilesModal(job.username);
    }
  }
  handleFollowerScan(usernames: string[]) { usernames.forEach(username => this.initiateScan(username)); }
  openFollowerScanFromNode(nodeId: string) {
    this.state.openFollowerScanPopup(nodeId);
  }
  handleRescan(username: string) { this.initiateScan(username); this.state.closeSummaryPopup(); }

  private initiateScan(username: string) {
    const normalizedUsername = username.toLowerCase();
    if (this.jobs().some(job => job.username.toLowerCase() === normalizedUsername && job.status === 'in_progress')) {
      this.state.showNotification('scanning');
      return;
    }
    this.updateState(state => state.jobs.update(currentJobs => currentJobs.filter(j => j.username.toLowerCase() !== normalizedUsername)));
    const newJob: Job = { id: self.crypto.randomUUID(), username, status: 'in_progress', progress: 5, step: 'Starting' };
    this.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]));
    this.runScan(newJob);
  }

  private initiateImageScan(base64Image: string, fileName: string) {
    const displayName = `Image Scan: ${fileName}`;
    const jobName = `${displayName} #${self.crypto.randomUUID().substring(0, 4)}`;
    const newJob: Job = { id: self.crypto.randomUUID(), username: jobName, displayName, status: 'in_progress', progress: 5, step: `Scanning ${fileName}` };
    this.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]));
    this.runImageScan(newJob, base64Image);
  }

  private runScan(job: Job) {
    const cancel$ = new Subject<void>(); this.cancelScanSubjects.set(job.id, cancel$);
    this.scanService.performScan(job.username).pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe(this.getScanObserver(job));
  }

  private runImageScan(job: Job, base64Image: string) {
    const cancel$ = new Subject<void>(); this.cancelScanSubjects.set(job.id, cancel$);
    this.scanService.performImageScan(base64Image).pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe(this.getScanObserver(job, true));
  }

  private getScanObserver(job: Job, isImageScan: boolean = false) {
    return {
      next: (event: ScanEvent) => {
        if (event.type === 'progress') {
          this.updateState(state => state.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, ...event.payload } : j)));
        } else if (event.type === 'complete') {
          const finalPlatforms = event.payload.map(p => ({ ...p, keyUsername: job.username }));
          this.updateState(state => {
            state.scanResults.update(currentMap => new Map(currentMap).set(job.username, finalPlatforms));
            state.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'completed', progress: 100, step: 'Completed' } : j));
          });
          if (isImageScan) {
            this.state.openManageProfilesModal(job.username);
          }
        }
      },
      error: () => {
        this.updateState(state => state.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'failed', step: 'Scan failed' } : j)));
        this.cancelScanSubjects.delete(job.id);
      },
      complete: () => this.cancelScanSubjects.delete(job.id)
    };
  }

  cancelScan(jobId: string) {
    this.cancelScanSubjects.get(jobId)?.next();
    this.updateState(state => state.jobs.update(currentJobs => currentJobs.filter(job => job.id !== jobId)));
  }

  private resumeIncompleteScans() {
    this.jobs().filter(job => job.status === 'in_progress').forEach(job => {
      if (!this.cancelScanSubjects.has(job.id)) {
        this.runScan(job);
      }
    });
  }

  private removeUserScanData(username: string) {
    const normalizedUsername = username.toLowerCase();
    this.updateState(state => {
        state.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== normalizedUsername));
        state.scanResults.update(currentMap => { const newMap = new Map(currentMap); newMap.delete(username); return newMap; });
    });
    this.graphOrchestrator.removeUserFromGraph(this.activeTabState()!, username);
  }

  fetchProfileDetails(p: PlatformResult) { this.fetchData(p, 'profile', this.scanService.fetchProfileInfo(p.platform, p.username), this.cancelProfileFetchSubjects); }
  handleFetchSocialPosts(p: PlatformResult) { this.fetchData(p, 'posts', this.scanService.fetchSocialPosts(p.platform, p.username), this.cancelPostFetchSubjects); }
  handleFetchImagesForPlatform(p: PlatformResult) { this.fetchData(p, 'platformImages', this.scanService.fetchPlatformImages(p.platform, p.username), this.cancelPlatformImageFetchSubjects); }
  handleFetchFollowers(p: PlatformResult) { this.fetchData(p, 'followers', this.scanService.fetchFollowers(p.platform, p.username), this.cancelFollowersFetchSubjects); }
  handleFetchFollowing(p: PlatformResult) { this.fetchData(p, 'following', this.scanService.fetchFollowing(p.platform, p.username), this.cancelFollowingFetchSubjects); }

  private getPlatformIdentityKey(platform: PlatformResult): string
  {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}`;
  }

  private isSamePlatformIdentity(left: PlatformResult, right: PlatformResult): boolean
  {
    return this.getPlatformIdentityKey(left) === this.getPlatformIdentityKey(right);
  }

  private fetchData(platformResult: PlatformResult, stateKey: keyof FetchingStateService, request$: Observable<any>, cancelMap: Map<string, Subject<void>>) {
    const key = this.fetchingState.getPlatformUniqueKey(platformResult);
    if (this.fetchingState.isUserBusy(platformResult.keyUsername)) {
      this.state.showNotification('busy');
      return;
    }
    if (cancelMap.has(key)) {
      return;
    }
    this.fetchingState.setFetching(this.fetchingState[stateKey] as any, key, true);
    const cancel$ = new Subject<void>();
    cancelMap.set(key, cancel$);

    request$.pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const propertyMap = { profile: 'profileDetails', posts: 'posts', platformImages: 'images', followers: 'followers_list', following: 'following_list' };
          const dataKey = Object.keys(response)[0];
          const data = response[dataKey];
          const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
          const newData = { [(propertyMap as any)[stateKey]]: hasData ? data : null };

          this.updateState(state => {
            state.scanResults.update(currentMap => {
              const newMap = new Map(currentMap);
              const userResults = newMap.get(platformResult.keyUsername)?.map(p =>
                this.isSamePlatformIdentity(p, platformResult) ? { ...p, ...newData } : p
              );
              if (userResults) {
                newMap.set(platformResult.keyUsername, userResults);
              }
              return newMap;
            });
          });
          this.updateUIPopups(platformResult, newData);
          if (stateKey === 'followers' || stateKey === 'following') {
            this.graphOrchestrator.updateUserConnections(this.activeTabState()!).then();
          }
        },
        error: () => {},
        complete: () => {
          this.fetchingState.setFetching(this.fetchingState[stateKey] as any, key, false);
          cancelMap.delete(key);
        }
      });
  }

  cancelFetchProfileDetails(p: PlatformResult) { this.cancelFetch(p, 'profile', this.cancelProfileFetchSubjects); }
  handleCancelFetchSocialPosts(p: PlatformResult) { this.cancelFetch(p, 'posts', this.cancelPostFetchSubjects); }
  handleCancelFetchImagesForPlatform(p: PlatformResult) { this.cancelFetch(p, 'platformImages', this.cancelPlatformImageFetchSubjects); }
  handleCancelFetchFollowers(p: PlatformResult) { this.cancelFetch(p, 'followers', this.cancelFollowersFetchSubjects); }
  handleCancelFetchFollowing(p: PlatformResult) { this.cancelFetch(p, 'following', this.cancelFollowingFetchSubjects); }

  private cancelFetch(p: PlatformResult, stateKey: keyof FetchingStateService, cancelMap: Map<string, Subject<void>>) {
    const key = this.fetchingState.getPlatformUniqueKey(p);
    cancelMap.get(key)?.next();
    this.fetchingState.setFetching(this.fetchingState[stateKey] as any, key, false);
  }

  cancelAllFetchesForUser(username: string) {
    this.scanResults().get(username)?.forEach(p => {
      this.cancelFetchProfileDetails(p); this.handleCancelFetchSocialPosts(p); this.handleCancelFetchImagesForPlatform(p);
      this.handleCancelFetchFollowers(p); this.handleCancelFetchFollowing(p);
    });
  }

  private updateUIPopups(p: PlatformResult, data: Partial<PlatformResult>) {
    const selectedPlatform = this.state.selectedPlatformData();
    if (selectedPlatform && this.isSamePlatformIdentity(selectedPlatform, p)) {
      this.state.selectedPlatformData.update(current => current ? { ...current, ...data } : null);
    }
    if (this.state.summaryPopupData()?.username === p.keyUsername) {
      this.state.summaryPopupData.update(current => {
        if (!current) {
          return null;
        }
        return { ...current, platforms: current.platforms.map(platform => this.isSamePlatformIdentity(platform, p) ? { ...platform, ...data } : platform) };
      });
    }
    const followerPopupPlatform = this.state.followerScanPopupData()?.platform;
    if (followerPopupPlatform && this.isSamePlatformIdentity(followerPopupPlatform, p)) {
      this.state.followerScanPopupData.update(current => current ? { platform: { ...current.platform, ...data } } : null);
    }
  }

  onNodeClicked(nodeId: string) {
    if (!nodeId.startsWith('user-')) {
      return;
    }
    const username = nodeId.replace('user-', '');
    const allUserPlatforms = this.scanResults().get(username);
    if (!allUserPlatforms) {
      return;
    }
    const platformMapByIdentity = new Map<string, PlatformResult>(allUserPlatforms.map(p => [this.getPlatformIdentityKey(p), p]));
    const platformIdentitiesOnGraph = new Set<string>();
    this.networkData().edges.forEach(edge => {
      let otherNodeId = edge.from === nodeId ? edge.to : (edge.to === nodeId ? edge.from : null);
      if (otherNodeId) {
        const connectedNode = this.networkData().nodes.find(n => n.id === otherNodeId);
        if (connectedNode) {
          if (connectedNode.id.toString().startsWith('group-')) {
            connectedNode.groupedPlatforms?.forEach(platform => {
              const identity = this.getPlatformIdentityKey(platform);
              platformIdentitiesOnGraph.add(identity);
            });
          } else if (connectedNode.id.toString().startsWith('platform-')) {
            const key = connectedNode.id.toString().substring('platform-'.length);
            const [keyUsername, platformName, platformUsername] = key.split('|');
            const platform = allUserPlatforms.find(p => p.username === platformUsername && p.platform === platformName && p.keyUsername === keyUsername);
            if (platform) {
              platformIdentitiesOnGraph.add(this.getPlatformIdentityKey(platform));
            }
          }
        }
      }
    });
    const platformsToShow = Array.from(platformIdentitiesOnGraph).map(identity => platformMapByIdentity.get(identity)).filter((platform): platform is PlatformResult => !!platform);
    const email = platformsToShow.find(p => p.email)?.email;
    this.state.summaryPopupData.set({ username, platforms: platformsToShow, email });
  }

  onPlatformNodeClicked(nodeId: string) {
    if (this.isCustomEntityNode(nodeId))
    {
      this.entityManager()?.openEditEntityModal(nodeId);
      return;
    }
    if (!nodeId.startsWith('platform-')) {
      return;
    }
    if (this.viewMode() === 'list') {
      this.expandedPlatformNodeId.update(currentId => (currentId === nodeId ? null : nodeId));
      return;
    }
    this.state.openPlatformNodePopup(nodeId);
  }

  onRelationshipNodeClicked(nodeId: string) {
    const relationshipNode = this.networkData().nodes.find(node => node.id.toString() === nodeId);
    if (!relationshipNode) {
      return;
    }
    const pairKey = nodeId.replace('relationship-node-', '');
    const users = pairKey.split('--');
    if (users.length !== 2) {
      return;
    }
    const userA = users[0];
    const userB = users[1];
    const connections = this.buildRelationshipConnections(userA, userB);
    const fallbackCount = Number(relationshipNode.label || 0);
    const resolvedCount = connections.length > 0 ? connections.length : fallbackCount;
    this.state.openRelationshipPopup({
      userA,
      userB,
      count: resolvedCount,
      connections
    });
  }

  private normalizeHandle(value: string): string {
    let normalized = value.trim().toLowerCase();
    if (!normalized) {
      return '';
    }
    if (normalized.includes('://')) {
      try {
        const parsedUrl = new URL(normalized);
        const segments = parsedUrl.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          normalized = segments[segments.length - 1];
        }
      } catch {
      }
    }
    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.replace(/[?#].*$/, '');
    normalized = normalized.replace(/\/+$/, '');
    return normalized;
  }

  private compactHandle(value: string): string {
    return value.replace(/[^a-z0-9]/g, '');
  }

  private getHandleVariants(value: string): Set<string> {
    const variants = new Set<string>();
    const normalized = this.normalizeHandle(value);
    if (!normalized) {
      return variants;
    }
    variants.add(normalized);
    const compact = this.compactHandle(normalized);
    if (compact) {
      variants.add(compact);
    }
    return variants;
  }

  private getUserHandleSet(username: string, platforms: PlatformResult[]): Set<string> {
    const handles = new Set<string>();
    for (const variant of this.getHandleVariants(username)) {
      handles.add(variant);
    }
    for (const platform of platforms) {
      for (const variant of this.getHandleVariants(platform.username || '')) {
        handles.add(variant);
      }
      for (const variant of this.getHandleVariants(platform.url || '')) {
        handles.add(variant);
      }
    }
    return handles;
  }

  private containsAnyHandle(list: string[] | null | undefined, targets: Set<string>): boolean {
    if (!list || list.length === 0) {
      return false;
    }
    for (const handle of list) {
      for (const variant of this.getHandleVariants(handle)) {
        if (targets.has(variant)) {
          return true;
        }
      }
    }
    return false;
  }

  private buildRelationshipConnections(userA: string, userB: string): RelationshipConnectionItem[] {
    const userAPlatforms = this.scanResults().get(userA) || [];
    const userBPlatforms = this.scanResults().get(userB) || [];
    const userAHandles = this.getUserHandleSet(userA, userAPlatforms);
    const userBHandles = this.getUserHandleSet(userB, userBPlatforms);
    const unique = new Set<string>();
    const connections: RelationshipConnectionItem[] = [];

    for (const platform of userAPlatforms) {
      const follows = this.containsAnyHandle(platform.following_list, userBHandles);
      if (follows) {
        const key = `${userA}|${platform.platform}|${platform.username}|${userB}|follows`;
        if (!unique.has(key)) {
          unique.add(key);
          connections.push({
            sourceUser: userA,
            sourcePlatform: platform.platform,
            sourceUsername: platform.username,
            sourceUrl: platform.url,
            targetUser: userB,
            relation: 'follows'
          });
        }
      }
      const followedBy = this.containsAnyHandle(platform.followers_list, userBHandles);
      if (followedBy) {
        const key = `${userA}|${platform.platform}|${platform.username}|${userB}|followed_by`;
        if (!unique.has(key)) {
          unique.add(key);
          connections.push({
            sourceUser: userA,
            sourcePlatform: platform.platform,
            sourceUsername: platform.username,
            sourceUrl: platform.url,
            targetUser: userB,
            relation: 'followed_by'
          });
        }
      }
    }

    for (const platform of userBPlatforms) {
      const follows = this.containsAnyHandle(platform.following_list, userAHandles);
      if (follows) {
        const key = `${userB}|${platform.platform}|${platform.username}|${userA}|follows`;
        if (!unique.has(key)) {
          unique.add(key);
          connections.push({
            sourceUser: userB,
            sourcePlatform: platform.platform,
            sourceUsername: platform.username,
            sourceUrl: platform.url,
            targetUser: userA,
            relation: 'follows'
          });
        }
      }
      const followedBy = this.containsAnyHandle(platform.followers_list, userAHandles);
      if (followedBy) {
        const key = `${userB}|${platform.platform}|${platform.username}|${userA}|followed_by`;
        if (!unique.has(key)) {
          unique.add(key);
          connections.push({
            sourceUser: userB,
            sourcePlatform: platform.platform,
            sourceUsername: platform.username,
            sourceUrl: platform.url,
            targetUser: userA,
            relation: 'followed_by'
          });
        }
      }
    }

    return connections;
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

    await this.graphOrchestrator.updateGraphFromModal(this.activeTabState()!, username, selectedPlatforms);
  }

  handleContextMenuAction(action: ContextMenuAction) {
    const { nodeId } = this.state.contextMenuData()!;
    const username = nodeId.replace('user-', '');
    switch(action) {
        case 'fetchLinks': this.state.openInfoModal('info', 'Feature Coming Soon', "We're hard at work building this feature. Stay tuned for updates!", 'Got it!'); break;
        case 'clearConnections': this.graphOrchestrator.removeAllPlatformNodes(this.activeTabState()!, username); break;
        case 'deleteProfile': this.state.openDeleteConfirmation(username); break;
        case 'setAlias': {
          if (!nodeId.startsWith('user-')) {
            break;
          }
          const profileUsername = nodeId.substring('user-'.length);
          const currentAlias = this.userNodeAliases()[nodeId] || '';
          this.platformAliasModalData.set({ nodeId, username: profileUsername });
          this.platformAliasInput.set(currentAlias);
          break;
        }
        case 'removeNode': this.graphOrchestrator.removeSingleNode(this.activeTabState()!, nodeId); break;
        case 'deleteEntity': this.deleteCustomEntity(nodeId); break;
    }
    this.state.closeContextMenu();
  }

  addEntityToGraph(entityId: string) {
    this.entityManager()?.addEntityToGraph(entityId);
  }

  deleteCustomEntity(nodeId: string) {
    this.entityManager()?.deleteCustomEntity(nodeId);
    this.state.closeContextMenu();
  }

  isCustomEntityNode = (nodeId: string): boolean => this.customEntities().some(e => e.id === nodeId);

  handleEdgeAdded(edge: { from: string, to: string }) {
    this.graphOrchestrator.addEdge(this.activeTabState()!, edge);
  }

  handleEdgeDeleted({ edges }: { edges: string[] }) {
    this.graphOrchestrator.deleteEdges(this.activeTabState()!, edges);
  }

  async handleGroupNodeClicked({ nodeId, position }: { nodeId: string, position: Position }) {
    const wasPhysicsEnabled = this.isPhysicsEnabled();
    if (!wasPhysicsEnabled) {
      this.updateState(state => state.isPhysicsEnabled.set(true));
    }

    await this.graphOrchestrator.handleGroupNodeClicked(this.activeTabState()!, { nodeId, position });

    if (!wasPhysicsEnabled) {
      setTimeout(() => this.updateState(state => state.isPhysicsEnabled.set(false)), 2500);
    }
  }
}
