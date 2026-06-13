import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation, computed, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { Job, PlatformResult, TabState } from '../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../shared/services/social-scan.service';
import { TabManagerService } from '../shared/services/tab-manager.service';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { ListViewComponent } from './list-view/list-view.component';
import { FetchingStateService } from './services/fetching-state.service';
import { NotificationBarComponent } from './notification-bar/notification-bar.component';
import { SocialMapperStateService } from './services/social-mapper-state.service';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { SocialScanJobService } from './services/social-scan-job.service';
import { PlatformFetchService } from './services/platform-fetch.service';
import { GraphLoadingComponent } from '../shared/graph-loading/graph-loading.component';
import { getFirstFileFromInputEvent, readFileAsDataUrl } from '../../../shared/utils/file-input.util';
import { ProfileComponent } from '../../../shared/partials/profile/profile.component';
import { ManageProfilesModalComponent } from './profile-popups/manage-profiles-modal/manage-profiles-modal.component';

@Component({
  selector: 'app-social-graph',
  templateUrl: './social-mapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    HomeMenuComponent,
    ListViewComponent,
    ConfirmationPopupComponent,
    NotificationBarComponent,
    GraphLoadingComponent,
    ProfileComponent,
    ManageProfilesModalComponent
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
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => {
    this.isSmallScreen.set(event.matches);
    if (!event.matches) {
      this.closeMobileHomeMenu();
    }
  };

  public state = inject(SocialMapperStateService);
  isTailwindReady = signal(true);
  homeMenuSearchTerm = computed(() => this.activeTabState()?.homeMenuSearchTerm() ?? '');
  jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
  resultUsernames = computed(() => new Set(Array.from(this.scanResults().keys())));
  isHomeMenuCollapsed = computed(() => this.activeTabState()?.isHomeMenuCollapsed() ?? false);
  isSmallScreen = signal(false);
  isMobileHomeMenuOpen = signal(false);
  effectiveHomeMenuCollapsed = computed(() => this.isSmallScreen() ? !this.isMobileHomeMenuOpen() : this.isHomeMenuCollapsed());
  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  constructor(
    private scanService: SocialScanService,
    private destroyRef: DestroyRef,
    public tabManager: TabManagerService,
    private fetchingState: FetchingStateService,
    private scanJobService: SocialScanJobService,
    private platformFetchService: PlatformFetchService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQueryList = window.matchMedia('(max-width: 1023px)');
      this.isSmallScreen.set(this.mediaQueryList.matches);
      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
    }
  }

  ngOnInit(): void {
    this.resumeIncompleteScans();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
  }

  private updateState(updater: (state: TabState) => void, shouldScheduleSave: boolean = true): void {
    const state = this.activeTabState();
    if (state) {
      updater(state);
      if (shouldScheduleSave) {
        this.tabManager.scheduleSave();
      }
    }
  }

  onHomeMenuSearchChanged(term: string): void {
    this.updateState(state => state.homeMenuSearchTerm.set(term), false);
  }

  onHomeMenuToggled(): void {
    if (this.isSmallScreen()) {
      this.isMobileHomeMenuOpen.update(isOpen => !isOpen);
      return;
    }
    this.updateState(state => state.isHomeMenuCollapsed.update(v => !v), false);
  }

  closeMobileHomeMenu(): void {
    this.isMobileHomeMenuOpen.set(false);
  }

  onHomeMenuHistoryTabClicked(): void {
    this.state.setActiveUserIndex(0);
    if (this.isSmallScreen()) {
      this.closeMobileHomeMenu();
    }
  }

  triggerScan(): void {
    let username = this.homeMenuSearchTerm().trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username) {
      this.initiateScan(username);
      this.updateState(state => state.homeMenuSearchTerm.set(''), false);
    }
  }

  triggerImageUpload(): void {
    this.imageInput()?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
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

  confirmDeletion(): void {
    const usernameToDelete = this.state.deleteUsername();
    if (usernameToDelete) {
      this.cancelAllFetchesForUser(usernameToDelete);
      this.removeUserScanData(usernameToDelete);
    }
    this.state.closeDeleteConfirmation();
  }

  onDeleteConfirmation(confirmed: boolean): void {
    if (confirmed) {
      this.confirmDeletion();
      return;
    }
    this.state.closeDeleteConfirmation();
  }

  handleCompletedJobClick(job: Job): void {
    if (job.status !== 'completed') {
      return;
    }
    this.state.setActiveUserByUsername(job.username);
    if (this.isSmallScreen()) {
      this.closeMobileHomeMenu();
    }
  }

  private initiateScan(username: string): void {
    this.scanJobService.initiateScan(username, this.buildScanJobOptions());
  }

  private initiateImageScan(base64Image: string, fileName: string): void {
    this.scanJobService.initiateImageScan(base64Image, fileName, this.buildScanJobOptions());
  }

  cancelScan(jobId: string): void {
    this.scanJobService.cancelScan(jobId, this.buildScanJobOptions());
  }

  private resumeIncompleteScans(): void {
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

  private removeUserScanData(username: string): void {
    const normalizedUsername = username.toLowerCase();
    this.updateState(state => {
      state.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== normalizedUsername));
      state.scanResults.update(currentMap => {
        const newMap = new Map(currentMap);
        for (const key of newMap.keys()) {
          if (key.toLowerCase() === normalizedUsername) {
            newMap.delete(key);
          }
        }
        return newMap;
      });
    });
    this.state.setActiveUserIndex(0);
  }

  fetchProfileDetails(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'profile', this.scanService.fetchProfileInfo(p.platform, p.username), this.cancelProfileFetchSubjects);
  }

  handleFetchSocialPosts(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'posts', this.scanService.fetchSocialPosts(p.platform, p.username), this.cancelPostFetchSubjects);
  }

  handleFetchImagesForPlatform(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'platformImages', this.scanService.fetchPlatformImages(p.platform, p.username), this.cancelPlatformImageFetchSubjects);
  }

  handleFetchFollowers(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'followers', this.scanService.fetchFollowers(p.platform, p.username), this.cancelFollowersFetchSubjects);
  }

  handleFetchFollowing(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'following', this.scanService.fetchFollowing(p.platform, p.username), this.cancelFollowingFetchSubjects);
  }

  private fetchData(platformResult: PlatformResult, stateKey: 'profile' | 'posts' | 'platformImages' | 'followers' | 'following', request$: any, cancelMap: Map<string, Subject<void>>): void {
    this.platformFetchService.fetchData({
      platformResult,
      stateKey,
      request$,
      cancelMap,
      fetchingState: this.fetchingState,
      destroyRef: this.destroyRef,
      updateState: this.updateState.bind(this),
      state: this.state
    });
  }

  cancelFetchProfileDetails(p: PlatformResult): void {
    this.cancelFetch(p, 'profile', this.cancelProfileFetchSubjects);
  }

  handleCancelFetchSocialPosts(p: PlatformResult): void {
    this.cancelFetch(p, 'posts', this.cancelPostFetchSubjects);
  }

  handleCancelFetchImagesForPlatform(p: PlatformResult): void {
    this.cancelFetch(p, 'platformImages', this.cancelPlatformImageFetchSubjects);
  }

  handleCancelFetchFollowers(p: PlatformResult): void {
    this.cancelFetch(p, 'followers', this.cancelFollowersFetchSubjects);
  }

  handleCancelFetchFollowing(p: PlatformResult): void {
    this.cancelFetch(p, 'following', this.cancelFollowingFetchSubjects);
  }

  private cancelFetch(p: PlatformResult, stateKey: 'profile' | 'posts' | 'platformImages' | 'followers' | 'following', cancelMap: Map<string, Subject<void>>): void {
    this.platformFetchService.cancelFetch(p, stateKey, cancelMap, this.fetchingState);
  }

  cancelAllFetchesForUser(username: string): void {
    this.platformFetchService.cancelAllFetchesForUser(username, this.scanResults(), {
      profile: (p: PlatformResult) => this.cancelFetchProfileDetails(p),
      posts: (p: PlatformResult) => this.handleCancelFetchSocialPosts(p),
      images: (p: PlatformResult) => this.handleCancelFetchImagesForPlatform(p),
      followers: (p: PlatformResult) => this.handleCancelFetchFollowers(p),
      following: (p: PlatformResult) => this.handleCancelFetchFollowing(p)
    });
  }

  updateProfilesFromModal(selectedPlatforms: PlatformResult[]): void {
    const modalData = this.state.manageProfilesModalData();
    if (!modalData) {
      return;
    }
    const selectedKeys = new Set(selectedPlatforms.map(platform => this.getPlatformSelectionKey(platform)));
    this.updateState(state => {
      state.scanResults.update(currentMap => {
        const nextMap = new Map(currentMap);
        const currentPlatforms = nextMap.get(modalData.username) ?? [];
        nextMap.set(modalData.username, currentPlatforms.map(platform => ({
          ...platform,
          isSelected: selectedKeys.has(this.getPlatformSelectionKey(platform)),
        })));
        return nextMap;
      });
    });
    this.state.closeManageProfilesModal();
  }

  handleImageFlowSearch(username: string): void {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      return;
    }
    this.state.closeManageProfilesModal();
    this.initiateScan(normalizedUsername);
  }

  onSidebarPlatformClicked(elementId: string): void {
    this.state.highlightedNodeId.set(elementId);
    setTimeout(() => {
      if (this.state.highlightedNodeId() === elementId) {
        this.state.highlightedNodeId.set(null);
      }
    }, 3500);

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private getPlatformSelectionKey(platform: PlatformResult): string {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}|${platform.url}`;
  }
}
