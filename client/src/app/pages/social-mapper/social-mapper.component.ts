import { Component, ChangeDetectionStrategy, signal, computed, DestroyRef, OnDestroy, PLATFORM_ID, effect, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { MetadataPopupComponent } from './metadata-popup/metadata-popup.component';
import { ProfileSummaryPopupComponent } from './profile-summary-popup/profile-summary-popup.component';
// FIX: Add SocialPost and ScanEvent to imports for improved type safety.
import { NetworkData, Job, PlatformResult, CustomEntity, NetworkNode, TabState, ProfileDetails, SocialImage, ScanEvent, SocialPost } from '../../shared/model/social/social-scan.models';
import { SocialScanService } from './social-scan.service';
import { TabManagerService } from '../../shared/services/tab-manager.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { EntityMenuComponent } from './entity-menu/entity-menu.component';
import { ListViewComponent } from './list-view/list-view.component';
import { getPlatformColor } from '../../shared/utils/formatters';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { IconService } from '../../shared/services/icon.service';
import { SocialIconComponent } from '../../shared/components/social-icon/social-icon.component';
import { socialMapperAnimations } from '../../shared/animations/social-mapper.animations';

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
    ListViewComponent,
    TabBarComponent,
    SocialIconComponent,
  ]
})
export class SocialMapperComponent implements OnInit, OnDestroy {
  private readonly twId = 'tw-social';
  private activeTabState = computed(() => this.tabManager.activeTab()?.state);
  private cancelScanSubjects = new Map<string, Subject<void>>();
  private cancelProfileFetchSubjects = new Map<string, Subject<void>>();
  private cancelPostFetchSubjects = new Map<string, Subject<void>>();
  private cancelImageFetchSubjects = new Map<string, Subject<void>>();

  searchTerm = computed(() => this.activeTabState()?.searchTerm() ?? '');
  homeMenuSearchTerm = computed(() => this.activeTabState()?.homeMenuSearchTerm() ?? '');
  jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  networkData = computed(() => this.activeTabState()?.networkData() ?? { nodes: [], edges: [] });
  // FIX: Provide explicit type for the Map to ensure correct type inference downstream, which resolves the error at line 405.
  scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
  activeUsernames = computed(() => this.activeTabState()?.activeUsernames() ?? new Set<string>());
  customEntities = computed(() => this.activeTabState()?.customEntities() ?? []);
  // FIX: Provide explicit type for the Map to ensure correct type inference downstream.
  socialImages = computed(() => this.activeTabState()?.socialImages() ?? new Map<string, SocialImage[]>());
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
  summaryPopupData = signal<{ username: string; platforms: PlatformResult[]; email?: string; images?: SocialImage[] } | null>(null);
  showAlreadyAddedNotification = signal(false);
  showAlreadyScannedNotification = signal(false);
  showAlreadyScanningNotification = signal(false);
  showUserBusyNotification = signal(false);
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
  isUpcomingFeaturePopupVisible = signal(false);
  entityToAdd = signal<{ type: 'wallet' | 'email' | 'domain', value: string } | null>(null);
  expandedPlatformNodeId = signal<string | null>(null);
  isMobileEntityPanelOpen = signal(false);

  isSmallScreen = signal(false);
  private mediaQueryList: MediaQueryList | null = null;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => {
    this.isSmallScreen.set(event.matches);
  };

  profileFetchingState = signal<{ [platformNodeId: string]: boolean }>({});
  modalSearchTerm = signal('');
  imageFetchingState = signal<{ [username: string]: boolean }>({});
  postFetchingState = signal<{ [platformNodeId: string]: boolean }>({});

  modalPlatformsWithFilter = computed(() => {
    const platforms = this.modalResults().platforms;
    const term = this.modalSearchTerm().toLowerCase();
    return platforms.map(p => ({
      ...p,
      matches: !term || p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term)
    }));
  });

  hasModalMatches = computed(() => {
    return this.modalPlatformsWithFilter().some(p => p.matches);
  });

  areAllVisiblePlatformsSelected = computed(() => {
      const visible = this.modalPlatformsWithFilter().filter(p => p.matches);
      if (visible.length === 0) return false;
      return visible.every(p => p.isSelected);
  });

  areAllVisiblePlatformsDeselected = computed(() => {
      const visible = this.modalPlatformsWithFilter().filter(p => p.matches);
      if (visible.length === 0) return true;
      return visible.every(p => !p.isSelected);
  });

  contextMenuUsername = computed(() => {
    const { type, nodeId } = this.contextMenu();
    if (type === 'user' && nodeId) {
      return nodeId.replace('user-', '');
    }
    return null;
  });

  isSearchDisabled = computed(() => this.searchTerm().trim().length === 0);

  canEditConnections = computed(() => {
    const nodes = this.networkData().nodes;
    const userNodeCount = nodes.filter(n => n.id.toString().startsWith('user-')).length;
    const customEntityOnGraphCount = this.customEntities().filter(e => e.onGraph).length;
    const connectableNodesCount = userNodeCount + customEntityOnGraphCount;
    return connectableNodesCount >= 2;
  });

  isUserScanInProgress = computed(() => {
    const username = this.summaryPopupData()?.username;
    if (!username) {
        return false;
    }
    const userJob = this.jobs().find(j => j.username.toLowerCase() === username.toLowerCase());
    return userJob?.status === 'in_progress';
  });

  isMetadataUserScanInProgress = computed(() => {
    const username = this.selectedPlatformData()?.keyUsername;
    if (!username) return false;
    const userJob = this.jobs().find(j => j.username.toLowerCase() === username.toLowerCase());
    return userJob?.status === 'in_progress';
  });

  private scanService = inject(SocialScanService);
  private destroyRef = inject(DestroyRef);
  public tabManager = inject(TabManagerService);
  private platformId = inject(PLATFORM_ID);
  private iconService = inject(IconService);

  constructor() {
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
    this.resumeIncompleteScans();
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

  onModalSearchChanged(event: Event) {
    this.modalSearchTerm.set((event.target as HTMLInputElement).value);
  }

  clearModalSearch() {
    this.modalSearchTerm.set('');
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
    if (username) {
        this.initiateScan(username);
        this.updateState(state => state.searchTerm.set(''));
    }
  }

  private initiateScan(username: string) {
    const normalizedUsername = username.toLowerCase();

    const isInProgress = this.jobs().some(job =>
        job.username.toLowerCase() === normalizedUsername && job.status === 'in_progress'
    );
    if (isInProgress) {
        this.showNotification('scanning');
        return;
    }

    // Instead of removing all data, just remove the old job entry to allow re-scanning.
    // The scan results (including fetched profile details) will be preserved and merged.
    this.updateState(state => {
      state.jobs.update(currentJobs => currentJobs.filter(j => j.username.toLowerCase() !== normalizedUsername));
    });

    const newJob: Job = {
      id: self.crypto.randomUUID(),
      username: username,
      status: 'in_progress',
      progress: 5,
      step: 'Starting'
    };

    this.updateState(state => {
      state.jobs.update(currentJobs => [newJob, ...currentJobs]);
    });
    this.runScan(newJob);
  }

  handleRescan(username: string) {
    this.initiateScan(username);
    this.closeSummaryPopup();
  }

  cancelScan(jobId: string) {
    const cancelSubject = this.cancelScanSubjects.get(jobId);
    if (cancelSubject) {
      cancelSubject.next();
      cancelSubject.complete();
      this.cancelScanSubjects.delete(jobId);
      this.updateState(state => {
        state.jobs.update(currentJobs => currentJobs.filter(job => job.id !== jobId));
      });
    }
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
      this.cancelAllFetchesForUser(usernameToDelete);
      this.removeUserScanData(usernameToDelete);
    }
    this.closeDeleteConfirmation();
  }

  private removeUserScanData(username: string) {
    const normalizedUsername = username.toLowerCase();
    this.updateState(state => {
        state.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== normalizedUsername));

        state.networkData.update(currentData => {
            const centralNodeId = `user-${username}`;
            const nodesToRemove = new Set<string | number>(
                currentData.nodes
                    .filter(node => node.id === centralNodeId || node.id.toString().startsWith(`${username}-`))
                    .map(node => node.id)
            );

            return {
                nodes: currentData.nodes.filter((n: NetworkNode) => !nodesToRemove.has(n.id)),
                edges: currentData.edges.filter((e: any) => !nodesToRemove.has(e.from) && !nodesToRemove.has(e.to))
            };
        });

        state.activeUsernames.update((currentSet: Set<string>) => {
            const newSet = new Set(currentSet);
            newSet.delete(username);
            return newSet;
        });

        state.scanResults.update(currentMap => {
            const newMap = new Map(currentMap);
            newMap.delete(username);
            return newMap;
        });
    });
  }

  private resumeIncompleteScans() {
    const incompleteJobs = this.jobs().filter(job => job.status === 'in_progress');
    for (const job of incompleteJobs) {
      if (!this.cancelScanSubjects.has(job.id)) {
        this.runScan(job);
      }
    }
  }

  private showNotification(type: 'added' | 'scanned' | 'scanning' | 'busy') {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.showAlreadyAddedNotification.set(type === 'added');
    this.showAlreadyScannedNotification.set(type === 'scanned');
    this.showAlreadyScanningNotification.set(type === 'scanning');
    this.showUserBusyNotification.set(type === 'busy');

    this.notificationTimeout = setTimeout(() => {
      this.showAlreadyAddedNotification.set(false);
      this.showAlreadyScannedNotification.set(false);
      this.showAlreadyScanningNotification.set(false);
      this.showUserBusyNotification.set(false);
    }, 3000);
  }

  private runScan(job: Job) {
    const cancel$ = new Subject<void>();
    this.cancelScanSubjects.set(job.id, cancel$);

    this.scanService.performScan(job.username)
      .pipe(
        takeUntil(cancel$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        // FIX: Replaced `any` with the specific `ScanEvent` type for better type safety.
        next: (event: ScanEvent) => {
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
              state.scanResults.update(currentMap => {
                const newMap = new Map(currentMap);
                const existingPlatforms = newMap.get(job.username) || [];

                const mergedPlatforms = finalPlatforms.map((newPlatform: PlatformResult) => {
                  const existingData = existingPlatforms.find(p => p.platform === newPlatform.platform);
                  // If profile details exist on the old data, preserve them
                  if (existingData && typeof existingData.profileDetails !== 'undefined') {
                    return { ...newPlatform, profileDetails: existingData.profileDetails };
                  }
                  return newPlatform;
                });

                newMap.set(job.username, mergedPlatforms);
                return newMap;
              });
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
          this.cancelScanSubjects.delete(job.id);
        },
        complete: () => {
          this.cancelScanSubjects.delete(job.id);
        }
      });
  }

  onNodeClicked(nodeId: string) {
    if (!nodeId.startsWith('user-')) return;
    const username = nodeId.replace('user-', '');
    const allUserPlatforms = this.scanResults().get(username);

    // FIX: Add an Array.isArray check to ensure allUserPlatforms is an array before calling array methods on it.
    if (Array.isArray(allUserPlatforms)) {
      const platformNodesOnGraph = this.networkData().nodes
          .filter(node => node.id.toString().startsWith(`${username}-`))
          .map(node => node.label);

      const platformsOnGraphSet = new Set(platformNodesOnGraph);

      const platformsToShow = allUserPlatforms.filter((p: PlatformResult) => platformsOnGraphSet.has(p.platform));

      const email = platformsToShow.find((p: PlatformResult) => p.email)?.email;
      const images = this.socialImages().get(username);
      this.summaryPopupData.set({ username, platforms: platformsToShow, email: email, images });
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

    this.modalSearchTerm.set('');
    this.modalResults.set({ username, platforms: platformsWithSelection });
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.modalSearchTerm.set('');
  }

  onPlatformNodeClicked(nodeId: string) {
    if (this.isCustomEntityNode(nodeId)) return;

    if (this.viewMode() === 'list') {
      this.expandedPlatformNodeId.update(currentId => (currentId === nodeId ? null : nodeId));
      return;
    }

    const [username, platformName] = nodeId.split('-');
    const userResults = this.scanResults().get(username);
    if (!Array.isArray(userResults)) return;

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

  async updateGraphFromModal() {
    const { username, platforms } = this.modalResults();
    this.closeModal();

    const selectedPlatforms = platforms.filter(p => p.isSelected);
    const centralNodeId = `user-${username}`;

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
      return;
    }

    const currentNetworkData = this.networkData();
    const existingPlatformNames = new Set(
      currentNetworkData.nodes
        .filter(n => n.id.toString().startsWith(`${username}-`))
        .map(n => n.label)
    );

    const platformsToAdd = selectedPlatforms.filter(p => !existingPlatformNames.has(p.platform));

    const iconUrlMap = new Map<string, string>();
    if (platformsToAdd.length > 0) {
      const iconUrlPromises = platformsToAdd.map(p => this.iconService.getWhiteIconDataUrl(p.platform, { type: 'graph' }));
      const iconUrls = await Promise.all(iconUrlPromises);
      platformsToAdd.forEach((p, i) => iconUrlMap.set(p.platform, iconUrls[i]));
    }

    this.updateState(state => {
      state.networkData.update(currentData => {
        let newNodes = [...currentData.nodes];
        let newEdges = [...currentData.edges];

        if (!currentData.nodes.some(n => n.id === centralNodeId)) {
          newNodes.push({
            id: centralNodeId,
            label: username,
            shape: 'icon',
            icon: {
              face: 'bootstrap-icons',
              code: '\uf4d7',
              size: 60,
              color: '#a5b4fc'
            },
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
        const platformsToRemove = currentData.nodes.filter(n =>
          n.id.toString().startsWith(`${username}-`) && !selectedPlatformNames.has(n.label)
        );
        const nodeIdsToRemove = new Set(platformsToRemove.map(node => node.id));
        newNodes = newNodes.filter(node => !nodeIdsToRemove.has(node.id));
        newEdges = newEdges.filter(edge => !nodeIdsToRemove.has(edge.to));

        platformsToAdd.forEach(platform => {
          const platformNodeId = `${username}-${platform.platform}`;
          newNodes.push({
            id: platformNodeId,
            label: platform.platform,
            shape: 'circularImage',
            image: iconUrlMap.get(platform.platform),
            size: 25,
            font: { color: '#e5e7eb' },
            color: {
              border: getPlatformColor(platform.platform),
              background: '#334155',
              highlight: { border: '#5eead4', background: '#475569' },
              hover: { border: '#2dd4bf', background: '#475569' }
            },
            title: `<b>${platform.platform}</b><br>Click for details`
          });
          newEdges.push({ from: centralNodeId, to: platformNodeId });
        });

        return { nodes: newNodes, edges: newEdges };
      });
    });
  }

  togglePlatformSelection(platformName: string) {
    this.modalResults.update(current => {
      const updatedPlatforms = current.platforms.map(p =>
        p.platform === platformName ? { ...p, isSelected: !p.isSelected } : p
      );
      return { ...current, platforms: updatedPlatforms };
    });
  }

  selectAllVisiblePlatforms() {
    this.modalResults.update(current => {
      const term = this.modalSearchTerm().toLowerCase();
      const updatedPlatforms = current.platforms.map(p => {
        const isVisible = !term || p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term);
        return isVisible ? { ...p, isSelected: true } : p;
      });
      return { ...current, platforms: updatedPlatforms };
    });
  }

  deselectAllVisiblePlatforms() {
    this.modalResults.update(current => {
      const term = this.modalSearchTerm().toLowerCase();
      const updatedPlatforms = current.platforms.map(p => {
        const isVisible = !term || p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term);
        return isVisible ? { ...p, isSelected: false } : p;
      });
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

  showUpcomingFeaturePopup() {
    this.isUpcomingFeaturePopupVisible.set(true);
  }

  closeUpcomingFeaturePopup() {
    this.isUpcomingFeaturePopupVisible.set(false);
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
        next: (newEntity: CustomEntity) => {
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

  private isUserBusy(username: string): boolean {
    const profileState = this.profileFetchingState();
    const postState = this.postFetchingState();
    const imageState = this.imageFetchingState();

    if (imageState[username]) {
      return true;
    }

    const userPrefix = `${username}-`;
    const isFetchingProfile = Object.keys(profileState).some(key => key.startsWith(userPrefix) && profileState[key]);
    if (isFetchingProfile) {
      return true;
    }

    const isFetchingPosts = Object.keys(postState).some(key => key.startsWith(userPrefix) && postState[key]);
    if (isFetchingPosts) {
      return true;
    }

    return false;
  }

  cancelAllFetchesForUser(username: string) {
    this.cancelFetchImages(username);
    const userPlatforms = this.scanResults().get(username);
    if (userPlatforms) {
        for (const platform of userPlatforms) {
            this.cancelFetchProfileDetails(platform);
            this.handleCancelFetchSocialPosts(platform);
        }
    }
  }

  private cleanupCancelSubject(map: Map<string, Subject<void>>, key: string) {
    const subject = map.get(key);
    if (subject) {
      subject.next();
      subject.complete();
      map.delete(key);
    }
  }
  
  cancelFetchProfileDetails(platformResult: PlatformResult) {
    const platformNodeId = `${platformResult.keyUsername}-${platformResult.platform}`;
    this.cleanupCancelSubject(this.cancelProfileFetchSubjects, platformNodeId);
    this.profileFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
  }

  handleCancelFetchSocialPosts(platformResult: PlatformResult) {
    const platformNodeId = `${platformResult.keyUsername}-${platformResult.platform}`;
    this.cleanupCancelSubject(this.cancelPostFetchSubjects, platformNodeId);
    this.postFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
  }

  cancelFetchImages(username: string) {
    this.cleanupCancelSubject(this.cancelImageFetchSubjects, username);
    this.imageFetchingState.update(s => ({ ...s, [username]: false }));
  }

  fetchProfileDetails(platformResult: PlatformResult) {
    const platformNodeId = `${platformResult.keyUsername}-${platformResult.platform}`;
    if (this.isUserBusy(platformResult.keyUsername)) {
      this.showNotification('busy');
      return;
    }
    if (this.cancelProfileFetchSubjects.has(platformNodeId)) return;

    this.profileFetchingState.update(s => ({ ...s, [platformNodeId]: true }));
    const cancel$ = new Subject<void>();
    this.cancelProfileFetchSubjects.set(platformNodeId, cancel$);

    this.scanService.fetchProfileInfo(platformResult.platform, platformResult.username)
      .pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { profile: ProfileDetails }) => {
          const profileData = response.profile;
          const hasData = profileData && Object.keys(profileData).length > 0;
          const newProfileDetails = hasData ? profileData : null;

          this.updateState(state => {
            state.scanResults.update(currentMap => {
              const newMap = new Map(currentMap);
              const userResults = newMap.get(platformResult.keyUsername);
              if (Array.isArray(userResults)) {
                const updatedResults = userResults.map(p =>
                  p.platform === platformResult.platform ? { ...p, profileDetails: newProfileDetails } : p
                );
                newMap.set(platformResult.keyUsername, updatedResults);
              }
              return newMap;
            });
          });

          if (this.selectedPlatformData()?.platform === platformResult.platform && this.selectedPlatformData()?.username === platformResult.username) {
            this.selectedPlatformData.update(current => current ? { ...current, profileDetails: newProfileDetails } : null);
          }

          if (this.summaryPopupData()?.username === platformResult.keyUsername) {
            this.summaryPopupData.update(current => {
              if (!current) return null;
              const updatedPlatforms = current.platforms.map(p =>
                p.platform === platformResult.platform ? { ...p, profileDetails: newProfileDetails } : p
              );
              return { ...current, platforms: updatedPlatforms };
            });
          }
        },
        error: (err) => {
          console.error('Failed to fetch profile info:', err);
          this.profileFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
          this.cleanupCancelSubject(this.cancelProfileFetchSubjects, platformNodeId);
        },
        complete: () => {
          this.profileFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
          this.cleanupCancelSubject(this.cancelProfileFetchSubjects, platformNodeId);
        }
      });
  }

  handleFetchImagesForUser(username: string) {
    if (this.isUserBusy(username)) {
      this.showNotification('busy');
      return;
    }
    if (this.cancelImageFetchSubjects.has(username)) return;

    this.imageFetchingState.update(s => ({ ...s, [username]: true }));
    const cancel$ = new Subject<void>();
    this.cancelImageFetchSubjects.set(username, cancel$);

    this.scanService.fetchSocialImages(username)
      .pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { images: SocialImage[] }) => {
          const fetchedImages = response.images;
          this.updateState(state => {
            state.socialImages.update(currentMap => {
              const newMap = new Map(currentMap);
              newMap.set(username, fetchedImages);
              return newMap;
            });
          });

          if (this.summaryPopupData()?.username === username) {
            this.summaryPopupData.update(current => current ? { ...current, images: fetchedImages } : null);
          }
        },
        error: (err) => {
          console.error('Failed to fetch social images:', err);
          this.imageFetchingState.update(s => ({ ...s, [username]: false }));
          this.cleanupCancelSubject(this.cancelImageFetchSubjects, username);
        },
        complete: () => {
          this.imageFetchingState.update(s => ({ ...s, [username]: false }));
          this.cleanupCancelSubject(this.cancelImageFetchSubjects, username);
        }
      });
  }

  handleFetchSocialPosts(platformResult: PlatformResult) {
    const platformNodeId = `${platformResult.keyUsername}-${platformResult.platform}`;
     if (this.isUserBusy(platformResult.keyUsername)) {
      this.showNotification('busy');
      return;
    }
    if (this.cancelPostFetchSubjects.has(platformNodeId)) return;

    this.postFetchingState.update(s => ({ ...s, [platformNodeId]: true }));
    const cancel$ = new Subject<void>();
    this.cancelPostFetchSubjects.set(platformNodeId, cancel$);

    this.scanService.fetchSocialPosts(platformResult.platform, platformResult.username)
      .pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { posts: SocialPost[] }) => {
          const fetchedPosts = response.posts;
          const hasPosts = fetchedPosts && fetchedPosts.length > 0;
          const newPosts = hasPosts ? fetchedPosts : null;

          this.updateState(state => {
            state.scanResults.update(currentMap => {
              const newMap = new Map(currentMap);
              const userResults = newMap.get(platformResult.keyUsername);
              if (Array.isArray(userResults)) {
                const updatedResults = userResults.map(p =>
                  p.platform === platformResult.platform ? { ...p, posts: newPosts } : p
                );
                newMap.set(platformResult.keyUsername, updatedResults);
              }
              return newMap;
            });
          });

          if (this.selectedPlatformData()?.platform === platformResult.platform && this.selectedPlatformData()?.username === platformResult.username) {
            this.selectedPlatformData.update(current => current ? { ...current, posts: newPosts } : null);
          }

          if (this.summaryPopupData()?.username === platformResult.keyUsername) {
            this.summaryPopupData.update(current => {
              if (!current) return null;
              const updatedPlatforms = current.platforms.map(p =>
                p.platform === platformResult.platform ? { ...p, posts: newPosts } : p
              );
              return { ...current, platforms: updatedPlatforms };
            });
          }
        },
        error: (err) => {
          console.error('Failed to fetch social posts:', err);
          this.postFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
          this.cleanupCancelSubject(this.cancelPostFetchSubjects, platformNodeId);
        },
        complete: () => {
          this.postFetchingState.update(s => ({ ...s, [platformNodeId]: false }));
          this.cleanupCancelSubject(this.cancelPostFetchSubjects, platformNodeId);
        }
      });
  }
}