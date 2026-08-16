import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, timer } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import type { PlatformResult, SocialPost } from '../models/social-scan.models';
import { formatFollowers } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/partials/social-icon/social-icon.component';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { SocialFetchService } from '../services/social-fetch.service';
import { SocialStorageService } from '../services/social-storage.service';
import { getProfileDetailEntries } from '../utils/summary-view.util';
import { StealerlogSectionComponent } from '../stealerlog-section/stealerlog-section.component';
import { WantedListSectionComponent } from '../wanted-list-section/wanted-list-section.component';
import type { FetchMergeMode, FetchStateKey, FetchTabKey, SocialResultSource } from '../enums/social-graph.enums';
import type { FeedUser, FetchTab, PostCursorFetchRequest } from '../models/social-graph.models';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { SocialDefaultListSectionComponent } from './default-list-section.component';
import { SocialProfileTabsSectionComponent } from '../profile-detail/profile-tabs-section/profile-tabs-section.component';
import { SocialExtensionManagerComponent } from '../profile-detail/extension-manager/extension-manager.component';
import { ExtensionState, SocialExtensionService } from '../services/social-extension.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface LatestFetchConfirmationData {
  message: string;
  request: PostCursorFetchRequest;
}

@Component({
  selector: 'app-social-profile-listing',
  templateUrl: './profile-listing.component.html',
  standalone: true,
  imports: [SocialIconComponent, ConfirmationPopupComponent, StealerlogSectionComponent, WantedListSectionComponent, SocialDefaultListSectionComponent, SocialProfileTabsSectionComponent, SocialExtensionManagerComponent, TranslatePipe],
  animations: [fadeInDashboardItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileListingComponent {
  private readonly detailsTab: FetchTab = { key: 'details', label: 'Details', icon: 'bi bi-person-badge' };
  private readonly onlinePresenceTab: FetchTab = { key: 'onlinePresence', label: 'Online Presence', icon: 'bi bi-globe2' };
  private readonly stealerLogsTab: FetchTab = { key: 'stealerLogs', label: 'Stealer Logs', icon: 'bi bi-shield-exclamation' };
  private readonly profileFetchTabs: FetchTab[] = [this.detailsTab, this.onlinePresenceTab, this.stealerLogsTab];
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fetchService = inject(SocialFetchService);
  private readonly extensionService = inject(SocialExtensionService);
  private readonly storageService = inject(SocialStorageService);
  private readonly fetchCancelSubjects = new Map<string, Subject<void>>();
  private appliedProfileQuery = signal(false);
  private readonly loadingByRequestKey = signal<Record<string, boolean>>({});
  private extensionOpened = false;

  readonly scanResults = this.storageService.profilesState.scanResults;
  readonly extensionState = signal<ExtensionState>('install');
  isInitialLoading = input(false);
  sidebarPlatformClicked = output<string>();
  profileOverviewLabelChanged = output<string | null>();
  manageProfilesRequested = output<FeedUser>();
  highlightedNodeId = input<string | null>(null);
  activeTabs = signal<Record<string, FetchTabKey | null>>({});
  profileOverviewIds = signal<Set<string>>(new Set<string>());
  activeResultSources = input<Record<string, SocialResultSource>>({});
  platformSearchTerm = signal('');
  readonly missingStatValue = 'Not fetched';
  onlinePresenceSearchTerms = signal<Record<string, string>>({});
  latestFetchConfirmationData = signal<LatestFetchConfirmationData | null>(null);
  activeUsers = computed<FeedUser[]>(() => {
    return Array.from(this.scanResults().entries())
      .map(([username, platforms]) => {
        const allPlatforms = this.getVisiblePlatforms(platforms).sort((a, b) => this.comparePlatforms(a, b));
        const activeResultSource = this.getActiveResultSource(username, allPlatforms);
        return {
          username,
          allPlatforms,
          platforms: allPlatforms.filter(platform => this.getResultSource(platform) === activeResultSource)
        };
      })
      .filter(user => user.allPlatforms.length > 0);
  });
  hasResults = computed(() => this.activeUsers().length > 0);
  activeUser = computed(() => {
    const users = this.activeUsers();
    const activeUsername = this.storageService.activeUsername();
    if (activeUsername) {
      const matchingUser = users.find(user => user.username.toLowerCase() === activeUsername.toLowerCase());
      if (matchingUser) {
        return matchingUser;
      }
    }
    return users[0] ?? null;
  });
  activeProfilePlatform = computed(() => {
    const [platformId] = Array.from(this.profileOverviewIds());
    return platformId ? this.getPlatformById(platformId) ?? null : null;
  });

  constructor() {
    this.startExtensionHeartbeat();
    effect(() => {
      this.activeUsers();
      this.isInitialLoading();
      queueMicrotask(() => this.openProfileOverviewFromQuery());
    });
  }

  setActiveTab(platformId: string, tabKey: FetchTabKey, platformData?: PlatformResult): void {
    this.activeTabs.update(current => ({ ...current, [platformId]: tabKey }));
    if (platformData) {
      this.fetchTabData(platformData, tabKey);
    }
  }

  openProfileOverviewTab(platformId: string, tabKey: FetchTabKey, platformData?: PlatformResult): void {
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, platformData ? this.getAllowedTabKey(platformData, tabKey) : tabKey, platformData);
    if (platformData) {
      this.setProfileQuery(platformData);
      this.emitProfileOverviewLabel(platformData);
    }
  }

  openConnectionsOverview(platformId: string, platformData?: PlatformResult): void {
    if (platformData && !this.isFetchTabAllowed('connections')) {
      return;
    }
    this.openProfileOverviewTab(platformId, 'connections', platformData);
  }

  openManageProfiles(user: FeedUser): void {
    this.manageProfilesRequested.emit(user);
  }

  getActiveTab(platformId: string): FetchTabKey {
    return this.activeTabs()[platformId] ?? 'details';
  }

  getActiveTabForPlatform(platformData: PlatformResult): FetchTabKey {
    return this.getAllowedTabKey(platformData, this.getActiveTab(this.getPlatformCardId(platformData)));
  }

  getFetchTabs(): FetchTab[] {
    return this.profileFetchTabs;
  }

  isFetchTabAllowed(tabKey: FetchTabKey): boolean {
    return this.profileFetchTabs.some(tab => tab.key === tabKey);
  }

  isTabLoading(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    const stateKey = tabKey === 'details'
      ? 'profile'
      : tabKey === 'images'
        ? 'platformImages'
        : tabKey === 'connections'
          ? 'posts'
          : tabKey;
    return !!this.loadingByRequestKey()[this.getRequestKey(stateKey, platformData)];
  }

  private fetchTabData(platformData: PlatformResult, tabKey: FetchTabKey): void {
    if (this.hasTabData(platformData, tabKey) && !this.isTabLoading(platformData, tabKey)) {
      return;
    }
    this.refetchTabData(platformData, tabKey);
  }

  private startExtensionHeartbeat(): void {
    timer(0, 3000).pipe(switchMap(() => this.extensionService.detect()), takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.extensionState.set(state);

      if (state === 'signin' && !this.extensionOpened) {
        this.extensionOpened = true;
        this.extensionService.openExtension();
      }
      else if (state !== 'signin') {
        this.extensionOpened = false;
      }
    });
  }

  refetchTabData(platformData: PlatformResult, tabKey: FetchTabKey): void {
    if (this.getResultSource(platformData) === 'darkweb' && (tabKey === 'details' || tabKey === 'posts')) {
      return;
    }
    switch (tabKey) {
      case 'details':
        this.fetchProfileDetails(platformData);
        break;
      case 'posts':
        this.fetchSocialPosts(platformData);
        break;
      case 'videos':
        this.fetchSocialVideos(platformData);
        break;
      case 'shorts':
        this.fetchSocialShorts(platformData);
        break;
      case 'connections':
        this.fetchSocialPosts(platformData);
        break;
      case 'images':
        this.fetchImagesForPlatform(platformData);
        break;
      case 'followers':
        this.fetchFollowers(platformData);
        break;
      case 'following':
        this.fetchFollowing(platformData);
        break;
      case 'onlinePresence':
        this.searchOnlinePresence(platformData);
        break;
      case 'stealerLogs':
        this.fetchStealerLogs(platformData);
        break;
    }
  }

  onProfileTabSelected(platformData: PlatformResult, tabKey: FetchTabKey): void {
    this.setActiveTab(this.getPlatformCardId(platformData), tabKey, platformData);
  }

  onProfileTabRefetch(platformData: PlatformResult, tabKey: FetchTabKey): void {
    this.refetchTabData(platformData, tabKey);
  }

  onProfileOnlinePresenceTermChanged(platformData: PlatformResult, term: string): void {
    const key = this.getPlatformCardId(platformData);
    this.onlinePresenceSearchTerms.update(current => ({ ...current, [key]: term }));
  }

  onDefaultProfileOverview(platformData: PlatformResult): void {
    this.toggleProfileOverview(this.getPlatformCardId(platformData), platformData);
  }

  onDefaultConnectionsOverview(platformData: PlatformResult): void {
    this.openConnectionsOverview(this.getPlatformCardId(platformData), platformData);
  }

  onDefaultProfileTab(event: { platformData: PlatformResult; tabKey: FetchTabKey }): void {
    this.openProfileOverviewTab(this.getPlatformCardId(event.platformData), event.tabKey, event.platformData);
  }

  getLoadingStates(platformData: PlatformResult): Partial<Record<FetchTabKey, boolean>> {
    return this.getFetchTabs().reduce<Partial<Record<FetchTabKey, boolean>>>((currentStates, tab) => {
      currentStates[tab.key] = this.isTabLoading(platformData, tab.key);
      return currentStates;
    }, {});
  }

  private hasTabData(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    switch (tabKey) {
      case 'details':
        return this.getProfileDetailEntries(platformData).length > 0;
      case 'posts':
        return this.getUniquePosts(platformData, 'posts').length > 0;
      case 'videos':
        return this.getUniquePosts(platformData, 'videos').length > 0;
      case 'shorts':
        return this.getUniquePosts(platformData, 'shorts').length > 0;
      case 'connections':
        return this.getPostConnections(platformData).length > 0;
      case 'images':
        return (platformData.images || []).length > 0;
      case 'followers':
        return this.getFollowers(platformData).length > 0;
      case 'following':
        return this.getFollowing(platformData).length > 0;
      case 'onlinePresence':
        return !!platformData.onlinePresence;
      case 'stealerLogs':
        return this.getStealerLogs(platformData).length > 0;
    }
  }

  formatMetadataValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      }
      catch {
        return String(value);
      }
    }
    return String(value);
  }

  copyToClipboard(text: any): void {
    const str = this.formatMetadataValue(text);
    void navigator.clipboard?.writeText(str);
  }

  getFollowers(platformData: PlatformResult): string[] {
    return platformData.followers_list || [];
  }

  getFollowing(platformData: PlatformResult): string[] {
    return platformData.following_list || [];
  }

  getPostConnections(platformData: PlatformResult): string[] {
    return platformData.post_connections || [];
  }

  getStealerLogs(platformData: PlatformResult): any[] {
    return platformData.stealerLogs || [];
  }

  getOnlinePresenceSearchTerm(platformData: PlatformResult): string {
    const key = this.getPlatformCardId(platformData);
    return this.onlinePresenceSearchTerms()[key] ?? platformData.platform;
  }

  searchOnlinePresence(platformData: PlatformResult): void {
    const token = this.getOnlinePresenceSearchTerm(platformData).trim() || platformData.platform;
    this.fetchOnlinePresence(platformData, token);
  }

  fetchPostCursor(request: PostCursorFetchRequest): void {
    if (request.commentsOnly) {
      const platformData = request.platformData;
      this.fetchData(platformData, request.tabKey, this.fetchService.fetchSocialPostComments(platformData.platform, platformData.username, request.tabKey, request.cursorId, request.commentOffset, request.maxComments), 'update');
      return;
    }
    if (request.mergeMode === 'prepend') {
      this.openLatestFetchConfirmation(request);
    }
  }

  onLatestFetchConfirmation(confirmed: boolean): void {
    const confirmation = this.latestFetchConfirmationData();
    this.latestFetchConfirmationData.set(null);
    if (!confirmed || !confirmation) {
      return;
    }
    this.runLatestFetch(confirmation.request);
  }

  private fetchProfileDetails(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'profile', this.fetchService.fetchProfileInfo(platformData.platform, platformData.username));
  }

  private fetchSocialPosts(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'posts', this.fetchService.fetchSocialPosts(platformData.platform, platformData.username));
  }

  private fetchSocialVideos(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'videos', this.fetchService.fetchSocialVideos(platformData.platform, platformData.username));
  }

  private fetchSocialShorts(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'shorts', this.fetchService.fetchSocialShorts(platformData.platform, platformData.username));
  }

  private fetchImagesForPlatform(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'platformImages', this.fetchService.fetchPlatformImages(platformData.platform, platformData.username));
  }

  private fetchFollowers(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'followers', this.fetchService.fetchFollowers(platformData.platform, platformData.username));
  }

  private fetchFollowing(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    this.fetchData(platformData, 'following', this.fetchService.fetchFollowing(platformData.platform, platformData.username));
  }

  private fetchOnlinePresence(platformData: PlatformResult, token: string): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    const tokens = (token || platformData.platform || '')
      .split(/[,\s]+/)
      .map(token => token.trim().toLowerCase())
      .filter(Boolean);
    const username = (platformData.username || platformData.keyUsername || '').replace(/^@+/, '');
    this.fetchData(platformData, 'onlinePresence', this.fetchService.fetchProfileMetadataTokens(tokens.length > 0 ? tokens : [platformData.platform], username).pipe(map(onlinePresence => ({ onlinePresence }))));
  }

  private fetchStealerLogs(platformData: PlatformResult): void {
    this.cancelAllFetchesForUser(platformData.keyUsername);
    const username = platformData.username || platformData.keyUsername;
    const domain = this.getPlatformDomain(platformData);
    this.fetchData(platformData, 'stealerLogs', this.fetchService.fetchPlatformStealerLogs(username, domain).pipe(map(stealerLogs => ({ stealerLogs }))));
  }

  private fetchData(platformResult: PlatformResult, stateKey: FetchStateKey, request$: Observable<unknown>, mergeMode?: FetchMergeMode): void {
    const requestKey = this.getRequestKey(stateKey, platformResult);
    if (this.fetchCancelSubjects.has(requestKey)) {
      return;
    }
    const cancel$ = new Subject<void>();
    this.fetchCancelSubjects.set(requestKey, cancel$);
    this.setLoading(requestKey, true);
    request$.pipe(takeUntil(cancel$), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => this.setFetchedPlatformData(platformResult, stateKey, response, mergeMode),
      error: () => this.finishFetch(requestKey),
      complete: () => this.finishFetch(requestKey),
    });
  }

  cancelAllFetchesForUser(username: string): void {
    const prefix = `platform-${username}|`;
    for (const [requestKey, cancel$] of this.fetchCancelSubjects) {
      if (!requestKey.includes(prefix)) {
        continue;
      }
      cancel$.next();
      cancel$.complete();
      this.fetchCancelSubjects.delete(requestKey);
      this.setLoading(requestKey, false);
    }
  }

  private openLatestFetchConfirmation(request: PostCursorFetchRequest): void {
    this.latestFetchConfirmationData.set({
      request,
      message: `Fetching latest ${this.getLatestFetchSectionLabel(request)} will delete all existing records in this section and replace them with newly fetched records.`,
    });
  }

  private runLatestFetch(request: PostCursorFetchRequest): void {
    const platformData = request.platformData;
    if (request.tabKey === 'videos') {
      this.fetchData(platformData, 'videos', this.fetchService.fetchSocialVideos(platformData.platform, platformData.username));
      return;
    }
    if (request.tabKey === 'shorts') {
      this.fetchData(platformData, 'shorts', this.fetchService.fetchSocialShorts(platformData.platform, platformData.username));
      return;
    }
    this.fetchData(platformData, 'posts', this.fetchService.fetchSocialPosts(platformData.platform, platformData.username));
  }

  private getLatestFetchSectionLabel(request: PostCursorFetchRequest): string {
    return request.tabKey === 'videos' ? 'videos' : request.tabKey === 'shorts' ? 'shorts' : 'posts';
  }

  private getPlatformDomain(platformData: PlatformResult): string {
    return platformData.url || platformData.platform;
  }

  private setFetchedPlatformData(platformResult: PlatformResult, stateKey: FetchStateKey, response: unknown, mergeMode?: FetchMergeMode): void {
    if (!response || typeof response !== 'object') {
      return;
    }
    const responseRecord = response as Record<string, unknown>;
    const dataKey = Object.keys(responseRecord)[0];
    const data = dataKey ? responseRecord[dataKey] : null;
    const hasData = !!data && (Array.isArray(data) ? data.length > 0 : Object.keys(data as object).length > 0);
    let updatedProfiles: PlatformResult[] | null = null;

    this.storageService.profilesState.scanResults.update(results => {
      const currentProfiles = results.get(platformResult.keyUsername);
      if (!currentProfiles) {
        return results;
      }
      updatedProfiles = currentProfiles.map(platform => this.isSamePlatform(platform, platformResult)
        ? { ...platform, ...this.buildFetchedPlatformData(platform, stateKey, data, hasData, mergeMode) }
        : platform);
      return new Map(results).set(platformResult.keyUsername, updatedProfiles);
    });

    if (updatedProfiles) {
      this.storageService.saveProfiles(platformResult.keyUsername, updatedProfiles, true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  private buildFetchedPlatformData(platform: PlatformResult, stateKey: FetchStateKey, data: unknown, hasData: boolean, mergeMode?: FetchMergeMode): Partial<PlatformResult> {
    const propertyMap: Record<FetchStateKey, keyof PlatformResult> = {
      profile: 'profileDetails',
      posts: 'posts',
      videos: 'videos',
      shorts: 'shorts',
      platformImages: 'images',
      followers: 'followers_list',
      following: 'following_list',
      onlinePresence: 'onlinePresence',
      stealerLogs: 'stealerLogs',
    };
    const propertyName = propertyMap[stateKey];

    if (mergeMode === 'update' && this.isPostStateKey(stateKey) && Array.isArray(data)) {
      const existingPosts = Array.isArray(platform[propertyName]) ? platform[propertyName] as SocialPost[] : [];
      const incomingPosts = data as SocialPost[];
      const incomingByKey = new Map(incomingPosts.map(post => [this.getPostItemKey(post), post]));
      const mergedPosts = existingPosts.map(post => {
        const updatedPost = incomingByKey.get(this.getPostItemKey(post));
        return updatedPost ? { ...post, ...updatedPost } : post;
      });
      const update = { [propertyName]: mergedPosts } as Partial<PlatformResult>;
      if (stateKey === 'posts') {
        update.post_connections = this.extractConnections(mergedPosts);
      }
      return update;
    }

    const update = { [propertyName]: hasData ? data : null } as Partial<PlatformResult>;
    if (stateKey === 'posts') {
      update.post_connections = hasData ? this.extractConnections(data) : null;
    }
    return update;
  }

  private isSamePlatform(left: PlatformResult, right: PlatformResult): boolean {
    return left.keyUsername === right.keyUsername
      && left.platform.toLowerCase() === right.platform.toLowerCase()
      && left.username.toLowerCase() === right.username.toLowerCase();
  }

  private isPostStateKey(stateKey: FetchStateKey): stateKey is 'posts' | 'videos' | 'shorts' {
    return stateKey === 'posts' || stateKey === 'videos' || stateKey === 'shorts';
  }

  private extractConnections(posts: unknown): string[] | null {
    if (!Array.isArray(posts)) {
      return null;
    }
    return Array.from(new Set(posts.flatMap(post => Array.isArray(post?.connections) ? post.connections : [])
      .map(connection => String(connection || ''))
      .filter(Boolean)));
  }

  private getRequestKey(stateKey: FetchStateKey, platformData: PlatformResult): string {
    return `${stateKey}:${this.getPlatformCardId(platformData)}`;
  }

  private setLoading(requestKey: string, isLoading: boolean): void {
    this.loadingByRequestKey.update(current => {
      const next = { ...current };
      if (isLoading) {
        next[requestKey] = true;
      }
      else {
        delete next[requestKey];
      }
      return next;
    });
  }

  private finishFetch(requestKey: string): void {
    this.fetchCancelSubjects.delete(requestKey);
    this.setLoading(requestKey, false);
  }

  getPlatformCardId(platformData: PlatformResult): string {
    return `platform-${platformData.keyUsername}|${platformData.platform}|${platformData.username}`;
  }

  getPlatformTrackKey(_index: number, platformData: PlatformResult): string {
    return this.getPlatformCardId(platformData);
  }

  getUsernameInitial(username: string): string {
    return username.match(/\p{L}/u)?.[0].toLocaleUpperCase() ?? '?';
  }

  onPlatformSearchInput(event: Event): void {
    this.platformSearchTerm.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  getSidebarPlatforms(user: FeedUser): PlatformResult[] {
    const term = this.platformSearchTerm().trim().toLowerCase();
    if (!term) {
      return user.platforms;
    }
    return user.platforms.filter(platform => {
      return platform.platform.toLowerCase().includes(term)
        || platform.username.toLowerCase().includes(term);
    });
  }

  getResultSource(platformData: PlatformResult): SocialResultSource {
    return platformData.resultSource ?? 'normal';
  }

  getUniquePosts(platformData: PlatformResult, tabKey: 'posts' | 'videos' | 'shorts' = 'posts'): SocialPost[] {
    const posts = this.getPostContentItems(platformData, tabKey);
    const seen = new Set<string>();
    return posts.filter(post => {
      if (!post) {
        return false;
      }
      const key = this.getPostItemKey(post);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getPostContentItems(platformData: PlatformResult, tabKey: 'posts' | 'videos' | 'shorts'): SocialPost[] {
    if (tabKey === 'videos') {
      return platformData.videos || [];
    }
    if (tabKey === 'shorts') {
      return platformData.shorts || [];
    }
    return platformData.posts || [];
  }

  getStatValue(platformData: PlatformResult, key: keyof NonNullable<PlatformResult['profileDetails']>): string {
    const profileValue = platformData.profileDetails?.[key];
    const metadataValue = platformData.allMetadata?.[key as string];
    const rawValue = profileValue ?? metadataValue ?? this.getFallbackStatValue(platformData, key);
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return this.missingStatValue;
    }
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(rawValue);
  }

  getProfileDetailEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getProfileDetailEntries(platformData);
  }

  private getFallbackStatValue(platformData: PlatformResult, key: keyof NonNullable<PlatformResult['profileDetails']>): string | number | null {
    const metadata = platformData.allMetadata || {};
    switch (key) {
      case 'total_posts':
        return this.firstStatValue(metadata['totalPosts'], metadata['posts_count'], metadata['m_post_count'], this.getPostCollectionCount(platformData));
      case 'total_followers':
        return this.firstStatValue(platformData.followers, metadata['followers'], metadata['followers_count'], metadata['m_followers'], this.extractSocialCount(metadata['m_group_info']));
      case 'total_following':
        return this.firstStatValue(metadata['following'], metadata['following_count'], metadata['m_following'], platformData.following_list?.length);
      case 'total_likes':
        return this.firstStatValue(metadata['totalLikes'], metadata['likes'], metadata['m_likes'], metadata['m_post_likes']);
      default:
        return null;
    }
  }

  private firstStatValue(...values: Array<string | number | null | undefined>): string | number | null {
    return values.find(value => value !== null && value !== undefined && value !== '') ?? null;
  }

  private getPostCollectionCount(platformData: PlatformResult): number | null {
    const items = [...(platformData.posts || []), ...(platformData.videos || []), ...(platformData.shorts || [])];
    return items.length ? new Set(items.map(item => this.getPostItemKey(item))).size : null;
  }

  private getPostItemKey(post: SocialPost): string {
    return String(post.hash_id || post.post_url || post.media_url || post.caption || '');
  }

  private extractSocialCount(value: unknown): string | null {
    const text = typeof value === 'string' ? value : '';
    return text.match(/([\d,.]+[kmb]?)(?=\s*(subscribers|followers))/i)?.[1] ?? null;
  }

  toggleProfileOverview(platformId: string, platformData?: PlatformResult): void {
    if (this.profileOverviewIds().has(platformId)) {
      this.profileOverviewIds.set(new Set<string>());
      this.clearProfileQuery();
      this.profileOverviewLabelChanged.emit(null);
      return;
    }
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, 'details', platformData);
    if (platformData) {
      this.setProfileQuery(platformData);
      this.emitProfileOverviewLabel(platformData);
    }
  }

  clearProfileOverview(): void {
    this.profileOverviewIds.set(new Set<string>());
    this.clearProfileQuery();
    this.profileOverviewLabelChanged.emit(null);
  }

  isProfileOverviewActive(platformId: string): boolean {
    return this.profileOverviewIds().has(platformId);
  }

  hasOpenProfileOverview(): boolean {
    return this.profileOverviewIds().size > 0;
  }

  isProfileQueryLoading(): boolean {
    return !!this.route.snapshot.queryParamMap.get('profile')
      && !!this.route.snapshot.queryParamMap.get('platform')
      && !this.appliedProfileQuery();
  }

  showLoadingSkeleton(): boolean {
    return this.isInitialLoading() || this.isProfileQueryLoading();
  }

  handleSidebarPlatformClick(platformId: string): void {
    if (this.profileOverviewIds().size > 0) {
      const platform = this.getPlatformById(platformId);
      this.setActiveTab(platformId, 'details', platform);
      this.profileOverviewIds.set(new Set([platformId]));
      if (platform) {
        this.setProfileQuery(platform);
        this.emitProfileOverviewLabel(platform);
      }
      return;
    }
    this.sidebarPlatformClicked.emit(platformId);
  }

  private openProfileOverviewFromQuery(): void {
    if (this.appliedProfileQuery()) {
      return;
    }
    const profile = this.route.snapshot.queryParamMap.get('profile');
    const platform = this.route.snapshot.queryParamMap.get('platform');
    if (!profile || !platform) {
      this.appliedProfileQuery.set(true);
      return;
    }
    for (const user of this.activeUsers()) {
      const match = user.platforms.find(item => (item.platformKey || item.platform) === platform && item.username === profile);
      if (match) {
        const platformId = this.getPlatformCardId(match);
        this.storageService.sidebarState.activeUsername.set(user.username);
        this.profileOverviewIds.set(new Set([platformId]));
        this.setActiveTab(platformId, 'details', match);
        this.emitProfileOverviewLabel(match);
        this.appliedProfileQuery.set(true);
        return;
      }
    }
    if (this.activeUsers().length > 0 || !this.isInitialLoading()) {
      this.appliedProfileQuery.set(true);
    }
  }

  private setProfileQuery(platformData: PlatformResult): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: platformData.username || platformData.keyUsername, platform: platformData.platformKey || platformData.platform },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private clearProfileQuery(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: null, platform: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private emitProfileOverviewLabel(platformData: PlatformResult): void {
    this.profileOverviewLabelChanged.emit(`${platformData.platform} / ${platformData.username || platformData.keyUsername}`);
  }

  private getPlatformById(platformId: string): PlatformResult | undefined {
    for (const user of this.activeUsers()) {
      const platform = user.platforms.find(current => this.getPlatformCardId(current) === platformId);
      if (platform) {
        return platform;
      }
    }
    return undefined;
  }

  private comparePlatforms(a: PlatformResult, b: PlatformResult): number {
    return (a.platform ?? '').localeCompare(b.platform ?? '');
  }

  private getVisiblePlatforms(platforms: PlatformResult[]): PlatformResult[] {
    const selectedPlatforms = platforms.filter(platform => platform.isSelected);
    return selectedPlatforms.length > 0 ? selectedPlatforms : [...platforms];
  }

  private getActiveResultSource(username: string, platforms: PlatformResult[]): SocialResultSource {
    const preferred = this.activeResultSources()[username] ?? 'normal';
    if (platforms.some(platform => this.getResultSource(platform) === preferred)) {
      return preferred;
    }
    return platforms.some(platform => this.getResultSource(platform) === 'normal') ? 'normal' : 'darkweb';
  }

  private getAllowedTabKey(platformData: PlatformResult, tabKey: FetchTabKey): FetchTabKey {
    return this.getFetchTabs().some(tab => tab.key === tabKey) ? tabKey : 'details';
  }
}
