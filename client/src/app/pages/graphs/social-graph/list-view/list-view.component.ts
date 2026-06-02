import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, effect, OnDestroy } from '@angular/core';

import { NetworkData, PlatformResult, CustomEntity, NetworkNode, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
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
  deleteCustomEntity = output<string>();
  cancelEntityScan = output<string>();
  addEntityRequested = output<CustomEntity['type']>();
  public state = inject(SocialMapperStateService);
  readonly socialEntityUiService = inject(SocialEntityUiService);
  addSearchTerm = signal('');
  entityAddOptions: { type: CustomEntity['type']; label: string; iconClass: string; }[] = [ { type: 'email-breach', label: 'Add Email Breach', iconClass: 'bi bi-person-badge text-indigo-400' }, { type: 'social-scanner', label: 'Add Social Scanner', iconClass: 'bi bi-people text-indigo-400' }, { type: 'wanted-list', label: 'Add Wanted List', iconClass: 'bi bi-person-exclamation text-indigo-400' }, { type: 'national-identity', label: 'Add National Identity', iconClass: 'bi bi-card-text text-indigo-400' }, { type: 'playstore-scanner', label: 'Add Playstore Scanner', iconClass: 'bi bi-google-play text-indigo-400' }, { type: 'software-scanner', label: 'Add Software Scanner', iconClass: 'bi bi-window text-indigo-400' }, { type: 'phone', label: 'Add Phone', iconClass: 'bi bi-telephone text-indigo-400' }, { type: 'crypto-scanner', label: 'Add Crypto Scanner', iconClass: 'bi bi-currency-bitcoin text-green-400' } ];
  expandedEntityIds = signal<Set<string>>(new Set<string>());
  animatedProgressByEntityId = signal<Record<string, number>>({});
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;
  activeUserNodes = computed(() => this.networkData().nodes.filter(n => n.id.toString().startsWith('user-')));
  displayEntitiesInFeed = computed(() => this.customEntities());
  activeUserIndex = signal<number>(0);

  constructor() {
    effect(() => {
      const entities = this.customEntities();
      this.pruneAnimatedEntityProgress(entities);
      this.startProgressAnimation();
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setActiveUserIndex(index: number) {
    this.activeUserIndex.set(index);
  }

  nextUser() {
    this.activeUserIndex.update(i =>
      i < this.activeUserNodes().length - 1 ? i + 1 : 0);
  }

  prevUser() {
    this.activeUserIndex.update(i =>
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
    return this.networkData().nodes.filter(n => n.id.toString().startsWith(`platform-${username}|`));
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
    return (platformData.posts || []).filter(Boolean).slice(0, 3);
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

  getMetadataEntries(platformNodeId: string): {
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

  private pruneAnimatedEntityProgress(entities: CustomEntity[]) {
    const next = this.socialEntityUiService.pruneAnimatedProgressMap(entities, this.animatedProgressByEntityId());
    if (next) {
      this.animatedProgressByEntityId.set(next);
    }
  }

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
}
