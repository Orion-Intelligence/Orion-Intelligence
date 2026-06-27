import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformResult, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialService } from '../services/social.service';
import { getProfileDetailEntries } from '../utils/summary-view.util';
import { StealerlogSectionComponent } from '../stealerlog-section/stealerlog-section.component';
import type { FeedUser, FetchTab, FetchTabKey, OnlinePresenceFetchRequest, PostCursorFetchRequest, SocialPlatformCapabilityMap } from '../models/social-graph.models';
import { SocialNormalizationUtil } from '../utils/social-normalization.util';
import socialPlatformCapabilities from '../../../../../assets/data/social-graph/platform-capabilities.json';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { SocialDefaultListSectionComponent } from './default-list-section.component';
import { SocialProfileTabsSectionComponent } from '../profile-detail/profile-tabs-section/profile-tabs-section.component';

@Component({
  selector: 'app-social-profile-listing',
  templateUrl: './profile-listing.component.html',
  standalone: true,
  imports: [SocialIconComponent, StealerlogSectionComponent, SocialDefaultListSectionComponent, SocialProfileTabsSectionComponent],
  animations: [fadeInDashboardItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileListingComponent {
  private readonly PRIORITY_PLATFORMS = ['instagram', 'youtube', 'facebook', 'behance', 'tiktok', 'twitter', 'vimeo', 'x'];
  private readonly baseFetchTabs: FetchTab[] = [ { key: 'details', label: 'Details', icon: 'bi bi-person-badge' }, { key: 'posts', label: 'Posts', icon: 'bi bi-file-post' }, { key: 'images', label: 'Images', icon: 'bi bi-images' }, { key: 'connections', label: 'Connections', icon: 'bi bi-diagram-3' } ];
  private readonly mappedFetchTabs: Partial<Record<FetchTabKey, FetchTab>> = { videos: { key: 'videos', label: 'Videos', icon: 'bi bi-play-btn' }, shorts: { key: 'shorts', label: 'Shorts', icon: 'bi bi-play-circle' } };
  private readonly followerFetchTabs: FetchTab[] = [ { key: 'followers', label: 'Followers', icon: 'bi bi-people' }, { key: 'following', label: 'Following', icon: 'bi bi-person-plus' } ];
  private readonly onlinePresenceTab: FetchTab = { key: 'onlinePresence', label: 'Online Presence', icon: 'bi bi-globe2' };
  private readonly stealerLogsTab: FetchTab = { key: 'stealerLogs', label: 'Stealer Logs', icon: 'bi bi-shield-exclamation' };
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private appliedProfileQuery = signal(false);

  scanResults = input.required<Map<string, PlatformResult[]>>();
  isInitialLoading = input(false);
  sidebarPlatformClicked = output<string>();
  fetchPostsInline = output<PlatformResult>();
  fetchVideosInline = output<PlatformResult>();
  fetchShortsInline = output<PlatformResult>();
  fetchPostCursorInline = output<PostCursorFetchRequest>();
  fetchImagesInline = output<PlatformResult>();
  fetchFollowersInline = output<PlatformResult>();
  fetchFollowingInline = output<PlatformResult>();
  fetchMetadataInline = output<PlatformResult>();
  fetchOnlinePresenceInline = output<OnlinePresenceFetchRequest>();
  fetchStealerLogsInline = output<PlatformResult>();
  profileOverviewLabelChanged = output<string | null>();
  public state = inject(SocialService);
  activeTabs = signal<Record<string, FetchTabKey | null>>({});
  profileOverviewIds = signal<Set<string>>(new Set<string>());
  platformSearchTerm = signal('');
  onlinePresenceSearchTerms = signal<Record<string, string>>({});
  activeUsers = computed<FeedUser[]>(() => {
    return Array.from(this.scanResults().entries())
      .map(([username, platforms]) => ({
        username,
        platforms: this.getVisiblePlatforms(platforms).sort((a, b) => this.comparePlatforms(a, b))
      }))
      .filter(user => user.platforms.length > 0);
  });
  hasResults = computed(() => this.activeUsers().length > 0);
  activeUser = computed(() => {
    const users = this.activeUsers();
    const activeUsername = this.state.activeUsername();
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
    effect(() => {
      this.activeUsers();
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
    if (platformData && !this.isFetchTabAllowed(platformData, 'connections')) {
      return;
    }
    this.openProfileOverviewTab(platformId, 'connections', platformData);
  }

  openManageProfiles(user: FeedUser): void {
    this.state.openManageProfilesModal(user.username);
  }

  getActiveTab(platformId: string): FetchTabKey {
    return this.activeTabs()[platformId] ?? 'details';
  }

  getActiveTabForPlatform(platformData: PlatformResult): FetchTabKey {
    return this.getAllowedTabKey(platformData, this.getActiveTab(this.getPlatformCardId(platformData)));
  }

  getFetchTabs(platformData: PlatformResult): FetchTab[] {
    const sharedTabs = [...this.baseFetchTabs, this.onlinePresenceTab, this.stealerLogsTab];
    const tabs = this.isPriorityPlatform(platformData.platform)
      ? [...this.baseFetchTabs, ...this.followerFetchTabs, this.onlinePresenceTab, this.stealerLogsTab]
      : sharedTabs;
    const capability = this.platformCapabilities[platformData.platform.toLowerCase()];
    for (const key of capability?.allow ?? []) {
      const mappedTab = this.mappedFetchTabs[key as FetchTabKey];
      if (mappedTab && !tabs.some(tab => tab.key === mappedTab.key)) {
        tabs.splice(Math.max(tabs.findIndex(tab => tab.key === 'images'), 2), 0, mappedTab);
      }
    }
    const disabledTabs = new Set(capability?.disallow ?? []);
    return tabs.filter(tab => !disabledTabs.has(tab.key));
  }

  isFetchTabAllowed(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    return this.getFetchTabs(platformData).some(tab => tab.key === tabKey);
  }

  isTabLoading(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    return this.state.isTabLoading(platformData, tabKey);
  }

  private fetchTabData(platformData: PlatformResult, tabKey: FetchTabKey): void {
    if (this.hasTabData(platformData, tabKey) && !this.isTabLoading(platformData, tabKey)) {
      return;
    }
    this.refetchTabData(platformData, tabKey);
  }

  refetchTabData(platformData: PlatformResult, tabKey: FetchTabKey): void {
    switch (tabKey) {
      case 'details':
        this.fetchMetadataInline.emit(platformData);
        break;
      case 'posts':
        this.fetchPostsInline.emit(platformData);
        break;
      case 'videos':
        this.fetchVideosInline.emit(platformData);
        break;
      case 'shorts':
        this.fetchShortsInline.emit(platformData);
        break;
      case 'connections':
        this.fetchPostsInline.emit(platformData);
        break;
      case 'images':
        this.fetchImagesInline.emit(platformData);
        break;
      case 'followers':
        this.fetchFollowersInline.emit(platformData);
        break;
      case 'following':
        this.fetchFollowingInline.emit(platformData);
        break;
      case 'onlinePresence':
        this.searchOnlinePresence(platformData);
        break;
      case 'stealerLogs':
        this.fetchStealerLogsInline.emit(platformData);
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
    return this.getFetchTabs(platformData).reduce<Partial<Record<FetchTabKey, boolean>>>((states, tab) => {
      states[tab.key] = this.isTabLoading(platformData, tab.key);
      return states;
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

  isPriorityPlatform(platformName?: string): boolean {
    if (!platformName) {
      return false;
    }
    return this.PRIORITY_PLATFORMS.includes(platformName.toLowerCase());
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
    this.fetchOnlinePresenceInline.emit({ platformData, token });
  }

  getPlatformCardId(platformData: PlatformResult): string {
    return this.state.getPlatformUniqueKey(platformData);
  }

  getPlatformTrackKey(_index: number, platformData: PlatformResult): string {
    return this.getPlatformCardId(platformData);
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

  getUniquePosts(platformData: PlatformResult, tabKey: 'posts' | 'videos' | 'shorts' = 'posts'): SocialPost[] {
    const posts = this.getPostContentItems(platformData, tabKey);
    const seen = new Set<string>();
    return posts.filter(post => {
      if (!post) {
        return false;
      }
      const key = post.post_url || JSON.stringify(post);
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
      return '--';
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
    return items.length ? new Set(items.map(item => item.post_url || JSON.stringify(item))).size : null;
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
    const normalizedProfile = SocialNormalizationUtil.normalizeUsername(profile);
    const normalizedPlatform = platform.toLowerCase();
    for (const user of this.activeUsers()) {
      const match = user.platforms.find(item => item.platform.toLowerCase() === normalizedPlatform && SocialNormalizationUtil.normalizeUsername(item.username) === normalizedProfile);
      if (match) {
        const platformId = this.getPlatformCardId(match);
        this.state.graphState.activeUsername.set(user.username);
        this.profileOverviewIds.set(new Set([platformId]));
        this.setActiveTab(platformId, 'details', match);
        this.emitProfileOverviewLabel(match);
        this.appliedProfileQuery.set(true);
        return;
      }
    }
    if (this.activeUsers().length > 0) {
      this.appliedProfileQuery.set(true);
    }
  }

  private setProfileQuery(platformData: PlatformResult): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: SocialNormalizationUtil.normalizeProfilePathUsername(platformData.username || platformData.keyUsername), platform: platformData.platform.toLowerCase() },
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
    const aPriority = this.isPriorityPlatform(a.platform);
    const bPriority = this.isPriorityPlatform(b.platform);
    if (aPriority && !bPriority) {
      return -1;
    }
    if (!aPriority && bPriority) {
      return 1;
    }
    return a.platform.localeCompare(b.platform);
  }

  private getVisiblePlatforms(platforms: PlatformResult[]): PlatformResult[] {
    const selectedPlatforms = platforms.filter(platform => platform.isSelected);
    return selectedPlatforms.length > 0 ? selectedPlatforms : [...platforms];
  }

  private getAllowedTabKey(platformData: PlatformResult, tabKey: FetchTabKey): FetchTabKey {
    return this.getFetchTabs(platformData).some(tab => tab.key === tabKey) ? tabKey : 'details';
  }
}
