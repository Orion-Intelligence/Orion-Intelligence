import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, effect, OnDestroy } from '@angular/core';

import { NetworkData, PlatformResult, CustomEntity, NetworkNode, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { FetchingStateService } from '../services/fetching-state.service';
import { SocialEntityUiService } from '../services/social-entity-ui.service';
import { getMetadataEntries, getProfileDetailEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { getEntityRecordEntries, getEntityReportRecords, getScanResultsByUsername, parsePlatformNodeId } from '../utils/social-graph-view.util';
@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  standalone: true,
  imports: [SocialIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListViewComponent implements OnDestroy {
  private readonly USER_COLORS = [ '#1877f2','#e03131','#2f9e44','#e67700','#7048e8','#0c8599' ];
  private animationFrameId: number | null = null;

  networkData = input.required<NetworkData>();
  scanResults = input.required<Map<string, PlatformResult[]>>();
  customEntities = input.required<CustomEntity[]>();
  nodeClicked = output<string>();
  platformNodeClicked = output<string>();
  sidebarPlatformClicked = output<string>();
  deleteCustomEntity = output<string>();
  cancelEntityScan = output<string>();
  addEntityRequested = output<CustomEntity['type']>();
  fetchPostsInline = output<PlatformResult>();
  fetchImagesInline = output<PlatformResult>();
  fetchFollowersInline = output<PlatformResult>();
  fetchFollowingInline = output<PlatformResult>();
  fetchMetadataInline = output<PlatformResult>();

  public state = inject(SocialMapperStateService);
  public fetchingState = inject(FetchingStateService);
  readonly socialEntityUiService = inject(SocialEntityUiService);
  addSearchTerm = signal('');
  metadataSearchTerms = signal<Record<string, string>>({});
  activeTabs = signal<Record<string, string | null>>({});

  fetchTabs = [
    { key: 'details', label: 'Details', icon: 'bi bi-person-vcard' },
    { key: 'posts', label: 'Posts', icon: 'bi bi-file-post' },
    { key: 'images', label: 'Images', icon: 'bi bi-images' },
    { key: 'followers', label: 'Followers', icon: 'bi bi-people' },
    { key: 'following', label: 'Following', icon: 'bi bi-person-plus' }
  ];

  entityAddOptions: { type: CustomEntity['type']; label: string; iconClass: string; }[] = [ { type: 'email-breach', label: 'Add Email Breach', iconClass: 'bi bi-person-badge text-indigo-400' }, { type: 'wanted-list', label: 'Add Wanted List', iconClass: 'bi bi-person-exclamation text-indigo-400' }, { type: 'phone', label: 'Add Phone', iconClass: 'bi bi-telephone text-indigo-400' }, { type: 'crypto-scanner', label: 'Add Crypto Scanner', iconClass: 'bi bi-currency-bitcoin text-green-400' } ];
  expandedEntityIds = signal<Set<string>>(new Set<string>());
  profileOverviewIds = signal<Set<string>>(new Set<string>());
  animatedProgressByEntityId = signal<Record<string, number>>({});
  private readonly PRIORITY_PLATFORMS = ['instagram', 'youtube', 'facebook', 'behance', 'tiktok', 'twitter', 'vimeo', 'x'];
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  activeUserNodes = computed(() => this.networkData().nodes.filter(n => n.id.toString().startsWith('user-')));
  displayEntitiesInFeed = computed(() => this.customEntities());

  constructor() {
    effect(() => {
      const entities = this.customEntities();
      this.pruneAnimatedEntityProgress(entities);
      // this.startProgressAnimation();
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setActiveTab(platformNodeId: string, tabKey: string) {
    this.activeTabs.update(current => {
      const next = { ...current };
      if (next[platformNodeId] === tabKey) {
        delete next[platformNodeId];
      }
      else {
        next[platformNodeId] = tabKey;
      }
      return next;
    });
  }

  getActiveTab(platformNodeId: string): string | null {
    return this.activeTabs()[platformNodeId] ?? 'details';
  }

  isTabLoading(platformNodeId: string, tabKey: string): boolean {
    const platformData = this.getPlatformData(platformNodeId);
    if (!platformData) return false;
    const key = this.fetchingState.getPlatformUniqueKey(platformData);
    
    switch (tabKey) {
      case 'details':
      case 'metadata':
        return !!this.fetchingState.profile()[key];
      case 'posts':
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

  /* --- Disabled per user request (Metadata Search) ---
  updateMetadataSearch(platformNodeId: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.metadataSearchTerms.update(current => ({
      ...current,
      [platformNodeId]: value
    }));
  }
  --- End Disabled Block --- */

  isNumeric(value: any): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number') return true;
    const s = String(value);
    return !isNaN(Number(s.replace(/,/g, ''))) && s.trim() !== '';
  }

  isBool(value: any): boolean {
    if (typeof value === 'boolean') return true;
    const s = String(value).toLowerCase().trim();
    return s === 'true' || s === 'false';
  }

  formatNumericValue(value: any): string {
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n.toLocaleString() : String(value);
  }

  getFilteredMetadataEntries(platformNodeId: string): { key: string; value: any; }[] {
    const all = this.getPlatformMetadataEntries(platformNodeId);
    /* Search is disabled
    const term = (this.metadataSearchTerms()[platformNodeId] || '').toLowerCase().trim();
    if (!term) return all;
    return all.filter(e =>
      formatKey(e.key).toLowerCase().includes(term) ||
      String(e.value).toLowerCase().includes(term)
    );
    */
    return all;
  }

  copyToClipboard(text: any) {
    const str = String(text);
    navigator.clipboard.writeText(str).then(() => {
      // Could add a toast here if available
    });
  }

  isPriorityPlatform(platformName?: string): boolean {
    if (!platformName) return false;
    const normalized = platformName.toLowerCase();
    return this.PRIORITY_PLATFORMS.includes(normalized);
  }

  setActiveUserIndex(index: number) {
    this.state.activeUserIndex.set(index);
  }

  nextUser() {
    this.state.activeUserIndex.update(i =>
      i < this.activeUserNodes().length - 1 ? i + 1 : 0);
  }

  prevUser() {
    this.state.activeUserIndex.update(i =>
      i > 0 ? i - 1 : this.activeUserNodes().length - 1);
  }

  getUserColor(index: number): string {
    return this.USER_COLORS[index % this.USER_COLORS.length];
  }

  getUserColorLight(index: number): string {
    const lights = ['#42a5f5','#ff6b6b','#69db7c','#ffa94d','#9775fa','#38d9a9'];
    return lights[index % lights.length];
  }

  getUserColorAlpha(index: number, alpha: number): string {
    const hex = this.getUserColor(index);
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  getPlatformsForUserNode(userNodeId: string): NetworkNode[] {
    const username = userNodeId.replace('user-', '');
    const platforms = this.networkData().nodes.filter(n => n.id.toString().startsWith(`platform-${username}|`));
    return platforms.sort((a, b) => {
      const aPriority = this.isPriorityPlatform(a.label);
      const bPriority = this.isPriorityPlatform(b.label);
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return a.label.localeCompare(b.label);
    });
  }

  getFollowers(platformData: PlatformResult): string[] {
    return platformData.followers_list || [];
  }

  getFollowing(platformData: PlatformResult): string[] {
    return platformData.following_list || [];
  }

  getFollowerPreview(platformData: PlatformResult): string[] {
    const followers = this.getFollowers(platformData);
    return followers.slice(0, 3);
  }

  getFollowingPreview(platformData: PlatformResult): string[] {
    const following = this.getFollowing(platformData);
    return following.slice(0, 3);
  }

  getProfileUrl(platformData: PlatformResult, username: string): string {
    return buildSocialProfileUrl(platformData.platform, username, platformData.url);
  }

  getPlatformData(platformNodeId: string): PlatformResult | undefined {
    const parsed = parsePlatformNodeId(platformNodeId);
    if (!parsed) {
      return undefined;
    }
    const userResults = getScanResultsByUsername(this.scanResults(), parsed.keyUsername);
    return userResults?.find(p =>
      (p.platform || '').toLowerCase() === parsed.platformName.toLowerCase() &&
            (p.username || '').toLowerCase() === parsed.platformUsername.toLowerCase());
  }

  getProfileBio(platformData: PlatformResult): string {
    return platformData.profileDetails?.bio
      || platformData.description
      || platformData.allMetadata?.['bio']
      || platformData.allMetadata?.['description']
      || '';
  }

  getRecentPosts(platformData: PlatformResult): SocialPost[] {
    return this.getUniquePosts(platformData).slice(0, 3);
  }

  getUniquePosts(platformData: PlatformResult): SocialPost[] {
    const posts = platformData.posts || [];
    const seen = new Set<string>();
    return posts.filter(post => {
      if (!post) return false;
      const key = post.post_url || JSON.stringify(post);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

  getEntityData(entityNodeId: string): CustomEntity | undefined {
    return this.customEntities().find(e => e.id === entityNodeId);
  }

  getEntityReportRecords(entity: CustomEntity): Record<string, unknown>[] {
    return getEntityReportRecords(entity);
  }

  getEntityRecordEntries(record: Record<string, unknown>): { key: string; label: string; values: string[]; }[] {
    return getEntityRecordEntries(record);
  }

  getNodeById(nodeId: string | number): NetworkNode | undefined {
    return this.networkData().nodes.find(n => n.id === nodeId);
  }

  getConnectionsForNode(nodeId: string): {
        node: NetworkNode;
        edge: any;
    }[] {
    const connections: {
            node: NetworkNode;
            edge: any;
        }[] = [];
    for (const edge of this.networkData().edges) {
      let connectedNodeId: string | number | null = null;
      if (edge.from === nodeId) {
        connectedNodeId = edge.to;
      }
      else if (edge.to === nodeId) {
        connectedNodeId = edge.from;
      }
      if (connectedNodeId) {
        const connectedNode = this.getNodeById(connectedNodeId);
        const nodeLabel = typeof connectedNode?.label === 'string' ? connectedNode.label.trim() : '';
        if (connectedNode && nodeLabel.length > 0) {
          connections.push({ node: connectedNode, edge });
        }
      }
    }
    return connections;
  }

  getNodeIcon(node: NetworkNode): string {
    if (node.id.toString().startsWith('user-')) {
      return 'bi bi-person-circle text-indigo-400';
    }
    const entity = this.getEntityData(node.id.toString());
    if (entity) {
      return this.socialEntityUiService.getIconForEntityType(entity.type);
    }
    return 'bi bi-record-circle text-teal-400';
  }

  getPlatformMetadataEntries(platformNodeId: string): {
        key: string;
        value: any;
    }[] {
    const platformData = this.getPlatformData(platformNodeId);
    return getMetadataEntries(platformData?.allMetadata);
  }

  trackById( _index: number, item: { id: string | number; } ): string | number {
    return item.id;
  }

  trackByKey( _index: number, item: { key: string; } ): string {
    return item.key;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  trackConnectionById( _index: number, item: { node: NetworkNode; } ): string | number {
    return item.node.id;
  }

  isEntityExpanded(entityId: string): boolean {
    return this.expandedEntityIds().has(entityId);
  }

  toggleProfileOverview(platformId: string) {
    this.profileOverviewIds.update(current => {
      const next = new Set(current);
      if (next.has(platformId)) {
        next.delete(platformId);
      }
      else {
        next.add(platformId);
      }
      return next;
    });
  }

  isProfileOverviewActive(platformId: string): boolean {
    return this.profileOverviewIds().has(platformId);
  }

  toggleEntity(entityId: string) {
    this.expandedEntityIds.update(current => {
      const next = new Set(current);
      if (next.has(entityId)) {
        next.delete(entityId);
      }
      else {
        next.add(entityId);
      }
      return next;
    });
  }

  /* --- Disabled per user request (Right Sidebar) ---
  get filteredEntityAddOptions(): { type: CustomEntity['type']; label: string; iconClass: string; }[] {
    const term = this.addSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.entityAddOptions;
    }
    return this.entityAddOptions.filter(option => option.label.toLowerCase().includes(term));
  }

  onAddSearchInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.addSearchTerm.set(nextValue);
  }

  getEntityProgress(entity: CustomEntity): number {
    const value = entity.progress ?? (entity.status === 'added' ? 100 : 0);
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  getAnimatedEntityProgress(entity: CustomEntity): number {
    const current = this.animatedProgressByEntityId()[entity.id];
    if (current !== undefined) {
      return Math.round(current);
    }
    return this.getEntityProgress(entity);
  }

  showEntityProgress(entity: CustomEntity): boolean {
    const progress = this.getAnimatedEntityProgress(entity);
    if (entity.status === 'added') {
      return progress > 0 && progress < 100;
    }
    if (entity.status === 'failed') {
      return progress > 0;
    }
    return true;
  }
  --- End Disabled Block --- */

  private pruneAnimatedEntityProgress(entities: CustomEntity[]) {
    const next = this.socialEntityUiService.pruneAnimatedProgressMap(entities, this.animatedProgressByEntityId());
    if (next) {
      this.animatedProgressByEntityId.set(next);
    }
  }

  /*
  private startProgressAnimation() {
    if (this.animationFrameId !== null) {
      return;
    }
    const tick = () => {
      const currentEntityMap = this.animatedProgressByEntityId();
      const nextEntityMap: Record<string, number> = { ...currentEntityMap };
      let hasPendingAnimation = false;
      let hasChanges = false;
      for (const entity of this.customEntities()) {
        if (entity.status === 'failed') {
          continue;
        }
        const target = this.getEntityProgress(entity);
        const current = nextEntityMap[entity.id] ?? target;
        const diff = target - current;
        if (Math.abs(diff) < 0.2) {
          if (nextEntityMap[entity.id] !== target) {
            nextEntityMap[entity.id] = target;
            hasChanges = true;
          }
        }
        else {
          const easedStep = diff * 0.16;
          nextEntityMap[entity.id] = current + easedStep;
          hasPendingAnimation = true;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this.animatedProgressByEntityId.set(nextEntityMap);
      }
      if (hasPendingAnimation) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
      else {
        this.animationFrameId = null;
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }
  */
}
