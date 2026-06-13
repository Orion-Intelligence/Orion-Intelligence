import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialOnlinePresenceResult, SocialPost, SocialStealerLogRecord } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isImageUrl, isUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { FetchingStateService } from '../services/fetching-state.service';
import { getMetadataEntries, getProfileDetailEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { StealerlogSectionComponent } from '../stealerlog-section/stealerlog-section.component';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';

interface FeedUser {
  username: string;
  platforms: PlatformResult[];
}

type FetchTabKey = 'details' | 'posts' | 'images' | 'connections' | 'followers' | 'following' | 'onlinePresence' | 'stealerLogs';
type FetchTab = { key: FetchTabKey; label: string; icon: string; };
type OnlinePresenceFetchRequest = { platformData: PlatformResult; token: string; };

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  standalone: true,
  imports: [SocialIconComponent, StealerlogSectionComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListViewComponent {
  private readonly PRIORITY_PLATFORMS = ['instagram', 'youtube', 'facebook', 'behance', 'tiktok', 'twitter', 'vimeo', 'x'];
  private readonly stealerLogExportColumns = [ 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private readonly baseFetchTabs: FetchTab[] = [ { key: 'details', label: 'Details', icon: 'bi bi-person-badge' }, { key: 'posts', label: 'Posts', icon: 'bi bi-file-post' }, { key: 'images', label: 'Images', icon: 'bi bi-images' }, { key: 'connections', label: 'Connections', icon: 'bi bi-diagram-3' } ];
  private readonly followerFetchTabs: FetchTab[] = [ { key: 'followers', label: 'Followers', icon: 'bi bi-people' }, { key: 'following', label: 'Following', icon: 'bi bi-person-plus' } ];
  private readonly onlinePresenceTab: FetchTab = { key: 'onlinePresence', label: 'Online Presence', icon: 'bi bi-globe2' };
  private readonly stealerLogsTab: FetchTab = { key: 'stealerLogs', label: 'Stealer Logs', icon: 'bi bi-shield-exclamation' };

  scanResults = input.required<Map<string, PlatformResult[]>>();
  sidebarPlatformClicked = output<string>();
  fetchPostsInline = output<PlatformResult>();
  fetchImagesInline = output<PlatformResult>();
  fetchFollowersInline = output<PlatformResult>();
  fetchFollowingInline = output<PlatformResult>();
  fetchMetadataInline = output<PlatformResult>();
  fetchOnlinePresenceInline = output<OnlinePresenceFetchRequest>();
  fetchStealerLogsInline = output<PlatformResult>();
  public state = inject(SocialMapperStateService);
  public fetchingState = inject(FetchingStateService);
  activeTabs = signal<Record<string, FetchTabKey | null>>({});
  profileOverviewIds = signal<Set<string>>(new Set<string>());
  platformSearchTerm = signal('');
  onlinePresenceSearchTerms = signal<Record<string, string>>({});
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;
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

  setActiveTab(platformId: string, tabKey: FetchTabKey, platformData?: PlatformResult): void {
    this.activeTabs.update(current => ({ ...current, [platformId]: tabKey }));
    if (platformData) {
      this.fetchTabData(platformData, tabKey);
    }
  }

  openProfileOverviewTab(platformId: string, tabKey: FetchTabKey, platformData?: PlatformResult): void {
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, platformData ? this.getAllowedTabKey(platformData, tabKey) : tabKey, platformData);
  }

  openConnectionsOverview(platformId: string, platformData?: PlatformResult): void {
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
    return this.isPriorityPlatform(platformData.platform)
      ? [...this.baseFetchTabs, ...this.followerFetchTabs, this.onlinePresenceTab, this.stealerLogsTab]
      : sharedTabs;
  }

  isTabLoading(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    const key = this.fetchingState.getPlatformUniqueKey(platformData);
    switch (tabKey) {
      case 'details':
        return !!this.fetchingState.profile()[key];
      case 'posts':
      case 'connections':
        return !!this.fetchingState.posts()[key];
      case 'images':
        return !!this.fetchingState.platformImages()[key];
      case 'followers':
        return !!this.fetchingState.followers()[key];
      case 'following':
        return !!this.fetchingState.following()[key];
      case 'onlinePresence':
        return !!this.fetchingState.onlinePresence()[key];
      case 'stealerLogs':
        return !!this.fetchingState.stealerLogs()[key];
      default:
        return false;
    }
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

  private hasTabData(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    switch (tabKey) {
      case 'details':
        return this.getProfileDetailEntries(platformData).length > 0;
      case 'posts':
        return this.getUniquePosts(platformData).length > 0;
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

  isNumeric(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'number') {
      return true;
    }
    const s = String(value);
    return !isNaN(Number(s.replace(/,/g, ''))) && s.trim() !== '';
  }

  isBool(value: any): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    const s = String(value).toLowerCase().trim();
    return s === 'true' || s === 'false';
  }

  formatNumericValue(value: any): string {
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n.toLocaleString() : String(value);
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

  getOnlinePresence(platformData: PlatformResult): SocialOnlinePresenceResult | null {
    return platformData.onlinePresence || null;
  }

  getOnlinePresenceResults(platformData: PlatformResult): NonNullable<SocialOnlinePresenceResult['results']> {
    return platformData.onlinePresence?.results || [];
  }

  getStealerLogs(platformData: PlatformResult): SocialStealerLogRecord[] {
    return platformData.stealerLogs || [];
  }

  getPlatformStealerDomain(platformData: PlatformResult): string {
    const fromUrl = this.normalizeDomain(platformData.url);
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

  getStealerRecordHost(record: SocialStealerLogRecord): string {
    return this.firstStealerValue(record?.['source_domain'], record?.['domain'], record?.['ip'], record?.['url'], record?.['host'], record?.['raw']) || '-';
  }

  getStealerRecordIdentity(record: SocialStealerLogRecord): string {
    return this.firstStealerValue(record?.['email'], record?.['username'], record?.['user'], record?.['login'], record?.['credential'], record?.['raw']) || '-';
  }

  getStealerRecordDate(record: SocialStealerLogRecord): string {
    return this.firstStealerValue(record?.['date'], record?.['timestamp'], record?.['created_at'], record?.['updated_at']) || '-';
  }

  getStealerRecordTrackKey(index: number, record: SocialStealerLogRecord): string {
    return `${this.getStealerRecordHost(record)}|${this.getStealerRecordIdentity(record)}|${this.getStealerRecordDate(record)}|${index}`;
  }

  downloadStealerLogs(platformData: PlatformResult): void {
    const rows = this.getStealerLogs(platformData).map((item, index) => ({
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery: `${platformData.username || platformData.keyUsername} ${this.getPlatformStealerDomain(platformData)}`.trim(),
      email: this.toStealerExportValue(item?.['email']),
      username: this.toStealerExportValue(item?.['username']),
      domain: this.toStealerExportValue(item?.['domain']),
      source: this.toStealerExportValue(item?.['channel'] || item?.['filename'] || item?.['file']),
      hash: this.toStealerExportValue(item?.['m_hash']),
      title: '-',
      url: '-',
      rank: '-',
      date: this.toStealerExportValue(item?.['date']),
      team: '-',
      summary: '-'
    }));
    const csvLines = [
      this.stealerLogExportColumns.join(','),
      ...rows.map(row => this.stealerLogExportColumns.map(column => this.escapeCsvValue(row[column] ?? '-')).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stealerlogs_${this.normalizeDownloadName(platformData.username || platformData.keyUsername)}_${this.normalizeDownloadName(this.getPlatformStealerDomain(platformData))}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getOnlinePresenceSearchTerm(platformData: PlatformResult): string {
    const key = this.getPlatformCardId(platformData);
    return this.onlinePresenceSearchTerms()[key] ?? platformData.platform;
  }

  onOnlinePresenceSearchInput(platformData: PlatformResult, event: Event): void {
    const key = this.getPlatformCardId(platformData);
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onlinePresenceSearchTerms.update(current => ({ ...current, [key]: value }));
  }

  searchOnlinePresence(platformData: PlatformResult): void {
    const token = this.getOnlinePresenceSearchTerm(platformData).trim() || platformData.platform;
    this.fetchOnlinePresenceInline.emit({ platformData, token });
  }

  getFollowerPreview(platformData: PlatformResult): string[] {
    return this.getFollowers(platformData).slice(0, 3);
  }

  getFollowingPreview(platformData: PlatformResult): string[] {
    return this.getFollowing(platformData).slice(0, 3);
  }

  getProfileUrl(platformData: PlatformResult, username: string): string {
    return buildSocialProfileUrl(platformData.platform, username, platformData.url);
  }

  getPlatformCardId(platformData: PlatformResult): string {
    return this.fetchingState.getPlatformUniqueKey(platformData);
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

  getProfileBio(platformData: PlatformResult): string {
    return platformData.profileDetails?.bio
      || platformData.description
      || platformData.allMetadata?.['bio']
      || platformData.allMetadata?.['description']
      || '';
  }

  getPlatformTimestamp(platformData: PlatformResult): string {
    const metadata = platformData.allMetadata || {};
    const timestamp = platformData.timestamp || metadata['timestamp'] || metadata['Timestamp'];
    return timestamp ? String(timestamp) : '';
  }

  getPostCaption(post: SocialPost | null | undefined): string {
    return post?.caption?.trim() || '';
  }

  hasPostMedia(post: SocialPost | null | undefined): boolean {
    return !!post?.media_url;
  }

  isVideoPost(post: SocialPost | null | undefined): boolean {
    const mediaType = (post?.media_type || '').toLowerCase();
    const mediaUrl = (post?.media_url || '').toLowerCase();
    return mediaType.includes('video') || mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.webm');
  }

  getPostMediaTypeLabel(post: SocialPost | null | undefined): string {
    return post?.media_type?.replace(/_/g, ' ') || 'Media';
  }

  getUniquePosts(platformData: PlatformResult): SocialPost[] {
    const posts = platformData.posts || [];
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

  formatPostMetric(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0';
    }
    const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(value);
  }

  getStatValue(platformData: PlatformResult, key: keyof NonNullable<PlatformResult['profileDetails']>): string {
    const profileValue = platformData.profileDetails?.[key];
    const metadataValue = platformData.allMetadata?.[key as string];
    const rawValue = profileValue ?? metadataValue;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '--';
    }
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(rawValue);
  }

  getProfileDetailEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getProfileDetailEntries(platformData);
  }

  getPlatformMetadataEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getMetadataEntries(platformData.allMetadata);
  }

  getFilteredMetadataEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return this.getPlatformMetadataEntries(platformData)
      .filter(entry => entry.key.toLowerCase().replace(/[\s_-]+/g, '') !== 'timestamp');
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  toggleProfileOverview(platformId: string, platformData?: PlatformResult): void {
    if (this.profileOverviewIds().has(platformId)) {
      this.profileOverviewIds.set(new Set<string>());
      return;
    }
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, 'details', platformData);
  }

  clearProfileOverview(): void {
    this.profileOverviewIds.set(new Set<string>());
  }

  isProfileOverviewActive(platformId: string): boolean {
    return this.profileOverviewIds().has(platformId);
  }

  hasOpenProfileOverview(): boolean {
    return this.profileOverviewIds().size > 0;
  }

  handleSidebarPlatformClick(platformId: string): void {
    if (this.profileOverviewIds().size > 0) {
      this.setActiveTab(platformId, 'details', this.getPlatformById(platformId));
      this.profileOverviewIds.set(new Set([platformId]));
      return;
    }
    this.sidebarPlatformClicked.emit(platformId);
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

  private firstStealerValue(...values: any[]): string {
    for (const value of values) {
      const normalized = this.normalizeStealerValue(value);
      if (normalized) {
        return normalized;
      }
    }
    return '';
  }

  private normalizeStealerValue(value: any): string {
    if (Array.isArray(value)) {
      return this.normalizeStealerValue(value[0]);
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  }

  private toStealerExportValue(value: unknown, maxLength = 120): string {
    if (Array.isArray(value)) {
      return this.toStealerExportValue(value.join(', '), maxLength);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) {
      return '-';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  private escapeCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private normalizeDownloadName(value: string): string {
    return (value || 'profile').replace(/^@+/, '').replace(/[^a-z0-9.-]+/gi, '_') || 'profile';
  }

  private normalizeDomain(value: string): string {
    const raw = (value || '').trim().toLowerCase();
    if (!raw) {
      return '';
    }
    const candidate = raw.includes('://') ? raw : `https://${raw}`;
    try {
      return new URL(candidate).hostname.replace(/^(www|m)\./, '');
    }
    catch {
      return raw.replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/^(www|m)\./, '');
    }
  }
}
