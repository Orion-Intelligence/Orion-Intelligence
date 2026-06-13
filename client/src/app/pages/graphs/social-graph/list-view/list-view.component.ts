import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isImageUrl, isUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { FetchingStateService } from '../services/fetching-state.service';
import { getMetadataEntries, getProfileDetailEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';

interface FeedUser {
  username: string;
  platforms: PlatformResult[];
}

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  standalone: true,
  imports: [SocialIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListViewComponent {
  private readonly PRIORITY_PLATFORMS = ['instagram', 'youtube', 'facebook', 'behance', 'tiktok', 'twitter', 'vimeo', 'x'];

  scanResults = input.required<Map<string, PlatformResult[]>>();
  sidebarPlatformClicked = output<string>();
  fetchPostsInline = output<PlatformResult>();
  fetchImagesInline = output<PlatformResult>();
  fetchFollowersInline = output<PlatformResult>();
  fetchFollowingInline = output<PlatformResult>();
  fetchMetadataInline = output<PlatformResult>();

  public state = inject(SocialMapperStateService);
  public fetchingState = inject(FetchingStateService);
  activeTabs = signal<Record<string, string | null>>({});
  profileOverviewIds = signal<Set<string>>(new Set<string>());
  fetchTabs = [
    { key: 'details', label: 'Details', icon: 'bi bi-person-vcard' },
    { key: 'posts', label: 'Posts', icon: 'bi bi-file-post' },
    { key: 'images', label: 'Images', icon: 'bi bi-images' },
    { key: 'connections', label: 'Connections', icon: 'bi bi-diagram-3' },
    { key: 'followers', label: 'Followers', icon: 'bi bi-people' },
    { key: 'following', label: 'Following', icon: 'bi bi-person-plus' }
  ];

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
    const index = Math.min(this.state.activeUserIndex(), Math.max(users.length - 1, 0));
    return users[index] ?? null;
  });

  setActiveTab(platformId: string, tabKey: string): void {
    this.activeTabs.update(current => ({ ...current, [platformId]: tabKey }));
  }

  openProfileOverviewTab(platformId: string, tabKey: string): void {
    this.profileOverviewIds.set(new Set<string>([platformId]));
    this.setActiveTab(platformId, tabKey);
  }

  openConnectionsOverview(platformId: string): void {
    this.openProfileOverviewTab(platformId, 'connections');
  }

  openManageProfiles(user: FeedUser): void {
    this.state.openManageProfilesModal(user.username);
  }

  getActiveTab(platformId: string): string {
    return this.activeTabs()[platformId] ?? 'details';
  }

  isTabLoading(platformData: PlatformResult, tabKey: string): boolean {
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
      default:
        return false;
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

  setActiveUserIndex(index: number): void {
    this.state.activeUserIndex.set(index);
    this.profileOverviewIds.set(new Set<string>());
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

  getUserTrackKey(_index: number, user: FeedUser): string {
    return user.username;
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

  toggleProfileOverview(platformId: string): void {
    this.profileOverviewIds.update(current => {
      if (current.has(platformId)) {
        return new Set<string>();
      }
      this.setActiveTab(platformId, 'details');
      return new Set<string>([platformId]);
    });
  }

  isProfileOverviewActive(platformId: string): boolean {
    return this.profileOverviewIds().has(platformId);
  }

  hasOpenProfileOverview(): boolean {
    return this.profileOverviewIds().size > 0;
  }

  handleSidebarPlatformClick(platformId: string): void {
    if (this.profileOverviewIds().size > 0) {
      this.setActiveTab(platformId, 'details');
      this.profileOverviewIds.set(new Set([platformId]));
      return;
    }
    this.sidebarPlatformClicked.emit(platformId);
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
}
