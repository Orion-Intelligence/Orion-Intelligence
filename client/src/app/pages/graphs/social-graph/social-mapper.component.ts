import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewEncapsulation, computed, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Job, PlatformResult, SocialGraphState, SocialResultSource, SocialStealerLogRecord } from '../../../shared/model/social/social-scan.models';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { SocialProfileListingComponent } from './profile-listing/profile-listing.component';
import { NotificationBarComponent } from './notification-bar/notification-bar.component';
import { SocialService } from './services/social.service';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { getFirstFileFromInputEvent, readFileAsDataUrl } from '../../../shared/utils/file-input.util';
import { ProfileComponent } from '../../../shared/partials/profile/profile.component';
import { ManageProfilesModalComponent } from './profile-popups/manage-profiles-modal/manage-profiles-modal.component';
import type { FetchMergeMode, FetchStateKey, ImageCursorFetchRequest, OnlinePresenceFetchRequest, PostContentTabKey, PostCursorFetchRequest, ScanJobOptions } from './models/social-graph.models';
import { SocialNormalizationUtil } from './utils/social-normalization.util';
import { SocialBreadcrumbComponent } from './breadcrumb/social-breadcrumb.component';

type LatestFetchRequest = PostCursorFetchRequest | ImageCursorFetchRequest;

interface LatestFetchConfirmationData {
  message: string;
  request: LatestFetchRequest;
}

@Component({
  selector: 'app-social-graph',
  templateUrl: './social-mapper.component.html',
  styleUrls: ['./social-mapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    HomeMenuComponent,
    SocialProfileListingComponent,
    ConfirmationPopupComponent,
    NotificationBarComponent,
    ProfileComponent,
    ManageProfilesModalComponent,
    SocialBreadcrumbComponent
  ]
})
export class SocialMapperComponent implements OnDestroy {
  private readonly stateService = inject(SocialService);
  private readonly router = inject(Router);
  private readonly graphState = this.stateService.graphState;
  private cancelScanSubjects = new Map<string, Subject<void>>();
  private cancelProfileFetchSubjects = new Map<string, Subject<void>>();
  private cancelPostFetchSubjects = new Map<string, Subject<void>>();
  private cancelVideoFetchSubjects = new Map<string, Subject<void>>();
  private cancelShortFetchSubjects = new Map<string, Subject<void>>();
  private cancelPlatformImageFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowersFetchSubjects = new Map<string, Subject<void>>();
  private cancelFollowingFetchSubjects = new Map<string, Subject<void>>();
  private cancelOnlinePresenceFetchSubjects = new Map<string, Subject<void>>();
  private cancelStealerLogsFetchSubjects = new Map<string, Subject<void>>();
  private mediaQueryList: MediaQueryList | null = null;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => {
    this.isSmallScreen.set(event.matches);
    if (!event.matches) {
      this.closeMobileHomeMenu();
    }
  };

  public state = this.stateService;
  homeMenuSearchTerm = computed(() => this.graphState.homeMenuSearchTerm());
  jobs = computed(() => this.graphState.jobs());
  scanResults = computed(() => this.graphState.scanResults());
  resultUsernames = computed(() => new Set([
    ...Array.from(this.scanResults().keys()),
    ...this.jobs().filter(job => job.status === 'completed').map(job => job.username)
  ]));
  isHomeMenuCollapsed = computed(() => this.graphState.isHomeMenuCollapsed());
  isSmallScreen = signal(false);
  isMobileHomeMenuOpen = signal(false);
  isInitialLoading = signal(true);
  profileBreadcrumbLabel = signal<string | null>(null);
  latestFetchConfirmationData = signal<LatestFetchConfirmationData | null>(null);
  activeResultSources = signal<Record<string, SocialResultSource>>({});
  effectiveHomeMenuCollapsed = computed(() => this.isSmallScreen() ? !this.isMobileHomeMenuOpen() : this.isHomeMenuCollapsed());
  activeSourceUsername = computed(() => this.state.activeUsername());
  activeSourcePlatforms = computed(() => {
    const username = this.activeSourceUsername();
    if (!username) {
      return [];
    }
    const results = this.scanResults();
    const platforms = results.get(username) ?? Array.from(results.entries()).find(([key]) => key.toLowerCase() === username.toLowerCase())?.[1] ?? [];
    return this.getVisiblePlatforms(platforms);
  });
  hasResultSourceTabs = computed(() => this.activeSourcePlatforms().length > 0);
  activeResultSource = computed(() => {
    const username = this.activeSourceUsername();
    const platforms = this.activeSourcePlatforms();
    const preferred = username ? this.activeResultSources()[username] ?? 'normal' : 'normal';
    if (platforms.some(platform => this.getResultSource(platform) === preferred)) {
      return preferred;
    }
    return platforms.some(platform => this.getResultSource(platform) === 'normal') ? 'normal' : 'darkweb';
  });
  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  profileListing = viewChild(SocialProfileListingComponent);

  constructor( private destroyRef: DestroyRef, @Inject(PLATFORM_ID) private platformId: object ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQueryList = window.matchMedia('(max-width: 1023px)');
      this.isSmallScreen.set(this.mediaQueryList.matches);
      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
    }
    this.state.loadStoredSocialProfiles().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isInitialLoading.set(false))).subscribe();
    queueMicrotask(() => this.resumeIncompleteScans());
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
    }
  }

  private updateState(updater: (state: SocialGraphState) => void): void {
    updater(this.graphState);
  }

  onHomeMenuSearchChanged(term: string): void {
    this.updateState(state => state.homeMenuSearchTerm.set(term));
  }

  onDashboardScanInput(event: Event): void {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onHomeMenuSearchChanged(nextValue);
  }

  onHomeMenuToggled(): void {
    if (this.isSmallScreen()) {
      this.isMobileHomeMenuOpen.update(isOpen => !isOpen);
      return;
    }
    this.updateState(state => state.isHomeMenuCollapsed.update(v => !v));
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

  setResultSource(source: SocialResultSource): void {
    const username = this.activeSourceUsername();
    if (!username || this.activeResultSource() === source || this.getResultSourceCount(source) === 0) {
      return;
    }
    this.activeResultSources.update(current => ({ ...current, [username]: source }));
    this.profileListing()?.clearProfileOverview();
  }

  getResultSourceCount(source: SocialResultSource): number {
    return this.activeSourcePlatforms().filter(platform => this.getResultSource(platform) === source).length;
  }

  triggerScan(): void {
    let username = this.homeMenuSearchTerm().trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username) {
      this.initiateScan(username);
      this.updateState(state => state.homeMenuSearchTerm.set(''));
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
      this.state.deleteStoredSocialProfiles(usernameToDelete).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
    this.profileListing()?.clearProfileOverview();
    if (job.id.startsWith('stored-') || !this.scanResults().has(job.username)) {
      this.state.loadStoredSocialProfile(job.username).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: () => this.graphState.activeUsername.set(job.username)
      });
    }
    else {
      this.graphState.activeUsername.set(job.username);
    }
    if (this.isSmallScreen()) {
      this.closeMobileHomeMenu();
    }
  }

  private initiateScan(username: string): void {
    this.state.initiateScan(username, this.buildScanJobOptions());
  }

  private initiateImageScan(base64Image: string, fileName: string): void {
    this.state.initiateImageScan(base64Image, fileName, this.buildScanJobOptions());
  }

  cancelScan(jobId: string): void {
    this.state.cancelScan(jobId, this.buildScanJobOptions());
  }

  private resumeIncompleteScans(): void {
    this.state.resumeIncompleteScans(() => this.graphState.jobs(), this.buildScanJobOptions());
  }

  private buildScanJobOptions(): ScanJobOptions {
    return {
      jobs: () => this.jobs(),
      updateState: this.updateState.bind(this),
      state: this.state,
      destroyRef: this.destroyRef,
      cancelScanSubjects: this.cancelScanSubjects,
      persistProfiles: (profileUsername: string, profiles: PlatformResult[]) => {
        this.state.saveSocialProfiles(profileUsername, profiles).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }
    };
  }

  private removeUserScanData(username: string): void {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(username);
    this.updateState(state => {
      state.jobs.update(currentJobs => currentJobs.filter(job => SocialNormalizationUtil.normalizeUsername(job.username) !== normalizedUsername));
      state.scanResults.update(currentMap => {
        const newMap = new Map(currentMap);
        for (const key of newMap.keys()) {
          if (SocialNormalizationUtil.normalizeUsername(key) === normalizedUsername) {
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
    this.fetchData(p, 'profile', this.state.fetchProfileInfo(p.platform, p.username), this.cancelProfileFetchSubjects);
  }

  handleFetchSocialPosts(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'posts', this.state.fetchSocialPosts(p.platform, p.username), this.cancelPostFetchSubjects);
  }

  handleFetchSocialVideos(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'videos', this.state.fetchSocialVideos(p.platform, p.username), this.cancelVideoFetchSubjects);
  }

  handleFetchSocialShorts(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'shorts', this.state.fetchSocialShorts(p.platform, p.username), this.cancelShortFetchSubjects);
  }

  handleFetchSocialPostCursor(request: PostCursorFetchRequest): void {
    if (request.commentsOnly) {
      const p = request.platformData;
      this.fetchData(p, request.tabKey, this.state.fetchSocialPostComments(p.platform, p.username, request.tabKey, request.cursorId, request.commentOffset, request.maxComments), this.getPostCancelMap(request.tabKey), 'update');
      return;
    }
    if (request.mergeMode === 'prepend') {
      this.openLatestFetchConfirmation(request);
      return;
    }
    const p = request.platformData;
    if (request.tabKey === 'videos') {
      this.fetchData(p, 'videos', this.state.fetchSocialVideos(p.platform, p.username, undefined, request.limit), this.cancelVideoFetchSubjects, request.mergeMode);
      return;
    }
    if (request.tabKey === 'shorts') {
      this.fetchData(p, 'shorts', this.state.fetchSocialShorts(p.platform, p.username, undefined, request.limit), this.cancelShortFetchSubjects, request.mergeMode);
      return;
    }
    this.fetchData(p, 'posts', this.state.fetchSocialPosts(p.platform, p.username, undefined, request.limit), this.cancelPostFetchSubjects, request.mergeMode);
  }

  handleFetchImagesForPlatform(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'platformImages', this.state.fetchPlatformImages(p.platform, p.username), this.cancelPlatformImageFetchSubjects);
  }

  handleFetchImageCursor(request: ImageCursorFetchRequest): void {
    if (request.mergeMode === 'prepend') {
      this.openLatestFetchConfirmation(request);
      return;
    }
    const p = request.platformData;
    this.fetchData(p, 'platformImages', this.state.fetchPlatformImages(p.platform, p.username, request.limit), this.cancelPlatformImageFetchSubjects, request.mergeMode);
  }

  onLatestFetchConfirmation(confirmed: boolean): void {
    const confirmation = this.latestFetchConfirmationData();
    this.latestFetchConfirmationData.set(null);
    if (!confirmed || !confirmation) {
      return;
    }
    this.runLatestFetch(confirmation.request);
  }

  private openLatestFetchConfirmation(request: LatestFetchRequest): void {
    this.latestFetchConfirmationData.set({
      request,
      message: `Fetching latest ${this.getLatestFetchSectionLabel(request)} will delete all existing records in this section and replace them with newly fetched records.`,
    });
  }

  private runLatestFetch(request: LatestFetchRequest): void {
    if (this.isPostCursorFetchRequest(request)) {
      const p = request.platformData;
      if (request.tabKey === 'videos') {
        this.fetchData(p, 'videos', this.state.fetchSocialVideos(p.platform, p.username), this.cancelVideoFetchSubjects);
        return;
      }
      if (request.tabKey === 'shorts') {
        this.fetchData(p, 'shorts', this.state.fetchSocialShorts(p.platform, p.username), this.cancelShortFetchSubjects);
        return;
      }
      this.fetchData(p, 'posts', this.state.fetchSocialPosts(p.platform, p.username), this.cancelPostFetchSubjects);
      return;
    }
    const p = request.platformData;
    this.fetchData(p, 'platformImages', this.state.fetchPlatformImages(p.platform, p.username), this.cancelPlatformImageFetchSubjects);
  }

  private getLatestFetchSectionLabel(request: LatestFetchRequest): string {
    if (!this.isPostCursorFetchRequest(request)) {
      return 'images';
    }
    return request.tabKey === 'videos' ? 'videos' : request.tabKey === 'shorts' ? 'shorts' : 'posts';
  }

  private isPostCursorFetchRequest(request: LatestFetchRequest): request is PostCursorFetchRequest {
    return 'tabKey' in request;
  }

  private getPostCancelMap(tabKey: PostContentTabKey): Map<string, Subject<void>> {
    if (tabKey === 'videos') {
      return this.cancelVideoFetchSubjects;
    }
    if (tabKey === 'shorts') {
      return this.cancelShortFetchSubjects;
    }
    return this.cancelPostFetchSubjects;
  }

  handleFetchFollowers(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'followers', this.state.fetchFollowers(p.platform, p.username), this.cancelFollowersFetchSubjects);
  }

  handleFetchFollowing(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    this.fetchData(p, 'following', this.state.fetchFollowing(p.platform, p.username), this.cancelFollowingFetchSubjects);
  }

  handleFetchOnlinePresence(request: OnlinePresenceFetchRequest): void {
    const p = request.platformData;
    this.cancelAllFetchesForUser(p.keyUsername);
    const tokens = (request.token || p.platform || '')
      .split(/[,\s]+/)
      .map(token => token.trim().toLowerCase())
      .filter(Boolean);
    const username = (p.username || p.keyUsername || '').replace(/^@+/, '');
    this.fetchData(p,
      'onlinePresence',
      this.state.fetchProfileMetadataTokens(tokens.length > 0 ? tokens : [p.platform], username).pipe(map(onlinePresence => ({ onlinePresence }))),
      this.cancelOnlinePresenceFetchSubjects);
  }

  handleFetchStealerLogs(p: PlatformResult): void {
    this.cancelAllFetchesForUser(p.keyUsername);
    const username = SocialNormalizationUtil.normalizeIdentity(p.username || p.keyUsername);
    const domain = this.getPlatformDomain(p);
    this.fetchData(p,
      'stealerLogs',
      this.state.fetchPlatformStealerLogs(username, domain).pipe(map(stealerLogs => ({ stealerLogs: this.filterStealerLogRecords(stealerLogs, username, domain) }))),
      this.cancelStealerLogsFetchSubjects);
  }

  private fetchData(platformResult: PlatformResult, stateKey: FetchStateKey, request$: any, cancelMap: Map<string, Subject<void>>, mergeMode?: FetchMergeMode): void {
    this.state.fetchPlatformData({
      platformResult,
      stateKey,
      request$,
      cancelMap,
      destroyRef: this.destroyRef,
      updateState: this.updateState.bind(this),
      mergeMode
    });
  }

  cancelFetchProfileDetails(p: PlatformResult): void {
    this.cancelFetch(p, 'profile', this.cancelProfileFetchSubjects);
  }

  handleCancelFetchSocialPosts(p: PlatformResult): void {
    this.cancelFetch(p, 'posts', this.cancelPostFetchSubjects);
  }

  handleCancelFetchSocialVideos(p: PlatformResult): void {
    this.cancelFetch(p, 'videos', this.cancelVideoFetchSubjects);
  }

  handleCancelFetchSocialShorts(p: PlatformResult): void {
    this.cancelFetch(p, 'shorts', this.cancelShortFetchSubjects);
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

  handleCancelFetchOnlinePresence(p: PlatformResult): void {
    this.cancelFetch(p, 'onlinePresence', this.cancelOnlinePresenceFetchSubjects);
  }

  handleCancelFetchStealerLogs(p: PlatformResult): void {
    this.cancelFetch(p, 'stealerLogs', this.cancelStealerLogsFetchSubjects);
  }

  private cancelFetch(p: PlatformResult, stateKey: FetchStateKey, cancelMap: Map<string, Subject<void>>): void {
    this.state.cancelPlatformFetch(p, stateKey, cancelMap);
  }

  cancelAllFetchesForUser(username: string): void {
    this.state.cancelAllPlatformFetchesForUser(username, this.scanResults(), {
      profile: (p: PlatformResult) => this.cancelFetchProfileDetails(p),
      posts: (p: PlatformResult) => this.handleCancelFetchSocialPosts(p),
      videos: (p: PlatformResult) => this.handleCancelFetchSocialVideos(p),
      shorts: (p: PlatformResult) => this.handleCancelFetchSocialShorts(p),
      images: (p: PlatformResult) => this.handleCancelFetchImagesForPlatform(p),
      followers: (p: PlatformResult) => this.handleCancelFetchFollowers(p),
      following: (p: PlatformResult) => this.handleCancelFetchFollowing(p),
      onlinePresence: (p: PlatformResult) => this.handleCancelFetchOnlinePresence(p),
      stealerLogs: (p: PlatformResult) => this.handleCancelFetchStealerLogs(p)
    });
  }

  private getPlatformDomain(platformData: PlatformResult): string {
    const fromUrl = SocialNormalizationUtil.normalizeDomain(platformData.url);
    if (fromUrl) {
      return fromUrl;
    }
    const platform = (platformData.platform || '').toLowerCase();
    const platformDomains: Record<string, string> = {
      behance: 'behance.net',
      facebook: 'facebook.com',
      github: 'github.com',
      instagram: 'instagram.com',
      tiktok: 'tiktok.com',
      twitter: 'twitter.com',
      vimeo: 'vimeo.com',
      x: 'x.com',
      youtube: 'youtube.com'
    };
    return platformDomains[platform] || platform;
  }

  private filterStealerLogRecords(records: any[], username: string, domain: string): SocialStealerLogRecord[] {
    if (!Array.isArray(records)) {
      return [];
    }
    return records.filter(record => SocialNormalizationUtil.recordMatchesIdentity(record, username) && SocialNormalizationUtil.recordMatchesDomain(record, domain));
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

  onHeaderBack(): void {
    const profileListing = this.profileListing();
    if (profileListing?.hasOpenProfileOverview()) {
      profileListing.clearProfileOverview();
      return;
    }
    void this.router.navigate(['/dashboard/home']);
  }

  onProfileOverviewLabelChanged(label: string | null): void {
    this.profileBreadcrumbLabel.set(label);
  }

  private getPlatformSelectionKey(platform: PlatformResult): string {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}|${platform.url}`;
  }

  private getResultSource(platformData: PlatformResult): SocialResultSource {
    return platformData.resultSource ?? 'normal';
  }

  private getVisiblePlatforms(platforms: PlatformResult[]): PlatformResult[] {
    const selectedPlatforms = platforms.filter(platform => platform.isSelected);
    return selectedPlatforms.length > 0 ? selectedPlatforms : [...platforms];
  }
}
