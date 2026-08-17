import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import type { social_post, social_profile } from '../models/social.models';
import { formatFollowers } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/partials/social-icon/social-icon.component';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { SocialFetchService } from '../services/social-fetch.service';
import { SocialStorageService } from '../services/social-storage.service';
import { getProfileDetailEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { StealerlogSectionComponent } from '../stealerlog-section/stealerlog-section.component';
import { WantedListSectionComponent } from '../wanted-list-section/wanted-list-section.component';
import type { FetchMergeMode, FetchStateKey, FetchTabKey, SocialResultSource } from '../enums/social-graph.enums';
import type { FeedUser, FetchTab, PostCursorFetchRequest } from '../models/social-usability.models';
import { toUsername } from '../utils/username.util';
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

  readonly scanResults = this.storageService.state.scanResults;
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
        const allPlatforms = this.getVisiblePlatforms(username, platforms).sort((a, b) => this.comparePlatforms(a, b));
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

  setActiveTab(platformId: string, tabKey: FetchTabKey, platformData?: social_profile): void {
    this.activeTabs.update(current => ({ ...current, [platformId]: tabKey }));
    if (platformData) {
      this.fetchTabData(platformData, tabKey);
    }
  }

  openProfileOverviewTab(platformId: string, tabKey: FetchTabKey, platformData?: social_profile): void {
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, platformData ? this.getAllowedTabKey(platformData, tabKey) : tabKey, platformData);
    if (platformData) {
      this.setProfileQuery(platformData);
      this.emitProfileOverviewLabel(platformData);
    }
  }

  openConnectionsOverview(platformId: string, platformData?: social_profile): void {
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

  getActiveTabForPlatform(platformData: social_profile): FetchTabKey {
    return this.getAllowedTabKey(platformData, this.getActiveTab(this.getPlatformCardId(platformData)));
  }

  getFetchTabs(): FetchTab[] {
    return this.profileFetchTabs;
  }

  isFetchTabAllowed(tabKey: FetchTabKey): boolean {
    return this.profileFetchTabs.some(tab => tab.key === tabKey);
  }

  isTabLoading(platformData: social_profile, tabKey: FetchTabKey): boolean {
    const stateKey = tabKey === 'details'
      ? 'profile'
      : tabKey === 'images'
        ? 'platformImages'
        : tabKey === 'connections'
          ? 'posts'
          : tabKey;
    return !!this.loadingByRequestKey()[this.getRequestKey(stateKey, platformData)];
  }

  private fetchTabData(platformData: social_profile, tabKey: FetchTabKey): void {
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

  refetchTabData(platformData: social_profile, tabKey: FetchTabKey): void {
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
      case 'connections':
        this.fetchSocialPosts(platformData);
        break;
      case 'onlinePresence':
        this.searchOnlinePresence(platformData);
        break;
      case 'stealerLogs':
        this.fetchStealerLogs(platformData);
        break;
    }
  }

  onProfileTabSelected(platformData: social_profile, tabKey: FetchTabKey): void {
    this.setActiveTab(this.getPlatformCardId(platformData), tabKey, platformData);
  }

  onProfileTabRefetch(platformData: social_profile, tabKey: FetchTabKey): void {
    this.refetchTabData(platformData, tabKey);
  }

  onProfileOnlinePresenceTermChanged(platformData: social_profile, term: string): void {
    const key = this.getPlatformCardId(platformData);
    this.onlinePresenceSearchTerms.update(current => ({ ...current, [key]: term }));
  }

  onDefaultProfileOverview(platformData: social_profile): void {
    this.toggleProfileOverview(this.getPlatformCardId(platformData), platformData);
  }

  onDefaultConnectionsOverview(platformData: social_profile): void {
    this.openConnectionsOverview(this.getPlatformCardId(platformData), platformData);
  }

  onDefaultProfileTab(event: { platformData: social_profile; tabKey: FetchTabKey }): void {
    this.openProfileOverviewTab(this.getPlatformCardId(event.platformData), event.tabKey, event.platformData);
  }

  getLoadingStates(platformData: social_profile): Partial<Record<FetchTabKey, boolean>> {
    return this.getFetchTabs().reduce<Partial<Record<FetchTabKey, boolean>>>((currentStates, tab) => {
      currentStates[tab.key] = this.isTabLoading(platformData, tab.key);
      return currentStates;
    }, {});
  }

  private hasTabData(platformData: social_profile, tabKey: FetchTabKey): boolean {
    switch (tabKey) {
      case 'details':
        return this.getProfileDetailEntries(platformData).length > 0;
      case 'posts':
        return this.getUniquePosts(platformData, 'posts').length > 0;
      case 'onlinePresence':
        return !!platformData.online_presence;
      case 'stealerLogs':
        return this.getStealerLogs(platformData).length > 0;
      default:
        return false;
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

  getStealerLogs(platformData: social_profile): any[] {
    return platformData.stealer_logs || [];
  }

  getOnlinePresenceSearchTerm(platformData: social_profile): string {
    const key = this.getPlatformCardId(platformData);
    return this.onlinePresenceSearchTerms()[key] ?? '';
  }

  searchOnlinePresence(platformData: social_profile): void {
    this.fetchOnlinePresence(platformData, this.getOnlinePresenceSearchTerm(platformData).trim());
  }

  fetchPostCursor(request: PostCursorFetchRequest): void {
    if (request.commentsOnly) {
      const platformData = request.platformData;
      this.fetchData(platformData, request.tabKey, this.fetchService.fetchSocialPostComments(platformData.meta.platform, platformData.meta.username, request.tabKey, request.cursorId, request.commentOffset, request.maxComments), 'update');
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

  private fetchProfileDetails(platformData: social_profile): void {
    this.cancelAllFetchesForUser(platformData.meta.username);
    const profileUrl = buildSocialProfileUrl(platformData.meta.platform, platformData.meta.username, platformData.meta.url);
    this.fetchData(platformData, 'profile', this.extensionService.crawlProfile(platformData.meta.platform, profileUrl).pipe(filter((profile): profile is Record<string, unknown> => !!profile && Object.keys(profile).length > 0), map(profile => ({ profile }))));
  }

  private fetchSocialPosts(platformData: social_profile): void {
    this.cancelAllFetchesForUser(platformData.meta.username);
    this.fetchData(platformData, 'posts', this.fetchService.fetchSocialPosts(platformData.meta.platform, platformData.meta.username));
  }

  private fetchOnlinePresence(platformData: social_profile, token: string): void {
    this.cancelAllFetchesForUser(platformData.meta.username);
    const tokens = [...new Set([token, platformData.meta.platform ?? '']
      .join(' ')
      .split(/[,\s]+/)
      .map(entry => entry.trim().toLowerCase())
      .filter(Boolean))];
    const username = (platformData.meta.username || '').replace(/^@+/, '');
    this.fetchData(platformData, 'onlinePresence', this.fetchService.fetchProfileMetadataTokens(tokens.length > 0 ? tokens : [platformData.meta.platform], username).pipe(map(onlinePresence => ({ onlinePresence }))));
  }

  private fetchStealerLogs(platformData: social_profile): void {
    this.cancelAllFetchesForUser(platformData.meta.username);
    const username = platformData.meta.username;
    const domain = this.getPlatformDomain(platformData);
    this.fetchData(platformData, 'stealerLogs', this.fetchService.fetchPlatformStealerLogs(username, domain).pipe(map(stealerLogs => ({ stealerLogs }))));
  }

  private fetchData(platformResult: social_profile, stateKey: FetchStateKey, request$: Observable<unknown>, mergeMode?: FetchMergeMode): void {
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
    this.fetchData(platformData, 'posts', this.fetchService.fetchSocialPosts(platformData.meta.platform, platformData.meta.username));
  }

  private getLatestFetchSectionLabel(request: PostCursorFetchRequest): string {
    return request.tabKey === 'videos' ? 'videos' : request.tabKey === 'shorts' ? 'shorts' : 'posts';
  }

  private getPlatformDomain(platformData: social_profile): string {
    return platformData.meta.url || platformData.meta.platform;
  }

  private setFetchedPlatformData(platformResult: social_profile, stateKey: FetchStateKey, response: unknown, mergeMode?: FetchMergeMode): void {
    if (!response || typeof response !== 'object') {
      return;
    }
    const responseRecord = response as Record<string, unknown>;
    const dataKey = Object.keys(responseRecord)[0];
    const data = dataKey ? responseRecord[dataKey] : null;
    const hasData = !!data && (Array.isArray(data) ? data.length > 0 : Object.keys(data as object).length > 0);
    let updatedProfiles: social_profile[] | null = null;

    this.storageService.state.scanResults.update(results => {
      const currentProfiles = results.get(platformResult.meta.username);
      if (!currentProfiles) {
        return results;
      }
      updatedProfiles = currentProfiles.map(platform => this.isSamePlatform(platform, platformResult)
        ? { ...platform, ...this.buildFetchedPlatformData(platform, stateKey, data, hasData, mergeMode) }
        : platform);
      return new Map(results).set(platformResult.meta.username, updatedProfiles);
    });

    if (updatedProfiles) {
      this.storageService.saveProfiles(platformResult.meta.username, updatedProfiles, true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  private buildFetchedPlatformData(platform: social_profile, stateKey: FetchStateKey, data: unknown, hasData: boolean, mergeMode?: FetchMergeMode): Partial<social_profile> {
    const propertyMap: Partial<Record<FetchStateKey, keyof social_profile>> = {
      profile: 'profile_details',
      posts: 'posts',
      onlinePresence: 'online_presence',
      stealerLogs: 'stealer_logs',
    };
    const propertyName = propertyMap[stateKey];
    if (!propertyName) {
      return {};
    }

    if (mergeMode === 'update' && this.isPostStateKey(stateKey) && Array.isArray(data)) {
      const existingPosts = Array.isArray(platform[propertyName]) ? platform[propertyName] as social_post[] : [];
      const incomingPosts = data as social_post[];
      const incomingByKey = new Map(incomingPosts.map(post => [this.getPostItemKey(post), post]));
      const mergedPosts = existingPosts.map(post => {
        const updatedPost = incomingByKey.get(this.getPostItemKey(post));
        return updatedPost ? { ...post, ...updatedPost } : post;
      });
      return { [propertyName]: mergedPosts } as Partial<social_profile>;
    }

    return { [propertyName]: hasData ? data : null } as Partial<social_profile>;
  }

  private isSamePlatform(left: social_profile, right: social_profile): boolean {
    return left.meta.username === right.meta.username
      && left.meta.platform.toLowerCase() === right.meta.platform.toLowerCase()
      && left.meta.username.toLowerCase() === right.meta.username.toLowerCase();
  }

  private isPostStateKey(stateKey: FetchStateKey): stateKey is 'posts' | 'videos' | 'shorts' {
    return stateKey === 'posts' || stateKey === 'videos' || stateKey === 'shorts';
  }

  private getRequestKey(stateKey: FetchStateKey, platformData: social_profile): string {
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

  getPlatformCardId(platformData: social_profile): string {
    return `platform-${platformData.meta.username}|${platformData.meta.platform}|${platformData.meta.username}`;
  }

  getPlatformTrackKey(_index: number, platformData: social_profile): string {
    return this.getPlatformCardId(platformData);
  }

  getUsernameInitial(username: string): string {
    return username.match(/\p{L}/u)?.[0].toLocaleUpperCase() ?? '?';
  }

  getDisplayUsername(username: string): string {
    return toUsername(username);
  }

  onPlatformSearchInput(event: Event): void {
    this.platformSearchTerm.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  getSidebarPlatforms(user: FeedUser): social_profile[] {
    const term = this.platformSearchTerm().trim().toLowerCase();
    if (!term) {
      return user.platforms;
    }
    return user.platforms.filter(platform => {
      return platform.meta.platform.toLowerCase().includes(term)
        || platform.meta.username.toLowerCase().includes(term);
    });
  }

  getResultSource(_platformData: social_profile): SocialResultSource {
    return 'normal';
  }

  getUniquePosts(platformData: social_profile, tabKey: 'posts' | 'videos' | 'shorts' = 'posts'): social_post[] {
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

  private getPostContentItems(platformData: social_profile, _tabKey: 'posts' | 'videos' | 'shorts'): social_post[] {
    return platformData.posts || [];
  }

  getStatValue(platformData: social_profile, key: keyof NonNullable<social_profile['profile_details']>): string {
    const profileValue = platformData.profile_details?.[key];
    const rawValue = profileValue ?? this.getFallbackStatValue(platformData, key);
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return this.missingStatValue;
    }
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(rawValue);
  }

  getProfileDetailEntries(platformData: social_profile): { key: string; value: any; }[] {
    return getProfileDetailEntries(platformData);
  }

  private getFallbackStatValue(platformData: social_profile, key: keyof NonNullable<social_profile['profile_details']>): string | number | null {
    switch (key) {
      case 'total_posts':
        return this.firstStatValue(platformData.profile_details?.total_posts, this.getPostCollectionCount(platformData));
      case 'total_followers':
        return this.firstStatValue(Number(platformData.profile_details?.total_followers ?? 0));
      case 'total_following':
        return this.firstStatValue(platformData.profile_details?.total_following);
      case 'total_likes':
        return this.firstStatValue(platformData.profile_details?.total_likes);
      default:
        return null;
    }
  }

  private firstStatValue(...values: Array<string | number | null | undefined>): string | number | null {
    return values.find(value => value !== null && value !== undefined && value !== '') ?? null;
  }

  private getPostCollectionCount(platformData: social_profile): number | null {
    const items = [...(platformData.posts || [])];
    return items.length ? new Set(items.map(item => this.getPostItemKey(item))).size : null;
  }

  private getPostItemKey(post: social_post): string {
    return String(post.hash_id || post.post_url || post.media_url || post.caption || '');
  }

  toggleProfileOverview(platformId: string, platformData?: social_profile): void {
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
    const wantedProfile = profile.toLowerCase();
    const wantedPlatform = platform.toLowerCase();
    for (const user of this.activeUsers()) {
      const match = user.platforms.find(item => (item.meta.platform || '').toLowerCase() === wantedPlatform && (item.meta.username || '').toLowerCase() === wantedProfile);
      if (match) {
        const platformId = this.getPlatformCardId(match);
        this.storageService.state.activeUsername.set(user.username);
        this.profileOverviewIds.set(new Set([platformId]));
        this.setActiveTab(platformId, 'details');
        this.refetchTabData(match, 'details');
        this.emitProfileOverviewLabel(match);
        this.appliedProfileQuery.set(true);
        return;
      }
    }
    if (this.activeUsers().length > 0 || !this.isInitialLoading()) {
      this.appliedProfileQuery.set(true);
    }
  }

  private setProfileQuery(platformData: social_profile): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: platformData.meta.username, platform: platformData.meta.platform },
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

  private emitProfileOverviewLabel(platformData: social_profile): void {
    this.profileOverviewLabelChanged.emit(`${platformData.meta.platform} / ${platformData.meta.username}`);
  }

  private getPlatformById(platformId: string): social_profile | undefined {
    for (const user of this.activeUsers()) {
      const platform = user.platforms.find(current => this.getPlatformCardId(current) === platformId);
      if (platform) {
        return platform;
      }
    }
    return undefined;
  }

  private comparePlatforms(a: social_profile, b: social_profile): number {
    return (a.meta.platform ?? '').localeCompare(b.meta.platform ?? '');
  }

  private getVisiblePlatforms(ownerUsername: string, platforms: social_profile[]): social_profile[] {
    const selectedPlatforms = platforms.filter(platform => this.storageService.isSelected(ownerUsername, platform));
    return selectedPlatforms.length > 0 ? selectedPlatforms : [...platforms];
  }

  private getActiveResultSource(username: string, platforms: social_profile[]): SocialResultSource {
    const preferred = this.activeResultSources()[username] ?? 'normal';
    if (platforms.some(platform => this.getResultSource(platform) === preferred)) {
      return preferred;
    }
    return platforms.some(platform => this.getResultSource(platform) === 'normal') ? 'normal' : 'darkweb';
  }

  private getAllowedTabKey(platformData: social_profile, tabKey: FetchTabKey): FetchTabKey {
    return this.getFetchTabs().some(tab => tab.key === tabKey) ? tabKey : 'details';
  }
}
