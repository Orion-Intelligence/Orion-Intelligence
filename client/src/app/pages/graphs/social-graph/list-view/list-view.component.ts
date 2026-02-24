import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkData, PlatformResult, CustomEntity, NetworkNode } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { getMetadataEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListViewComponent {
  networkData = input.required<NetworkData>();
  scanResults = input.required<Map<string, PlatformResult[]>>();
  customEntities = input.required<CustomEntity[]>();
  isSmallScreen = input.required<boolean>();
  expandedPlatformNodeId = input.required<string | null>();
  nodeClicked = output<string>();
  platformNodeClicked = output<string>();
  deleteCustomEntity = output<string>();
  public state = inject(SocialMapperStateService);
  expandedEntityIds = signal<Set<string>>(new Set<string>());
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;
  activeUserNodes = computed(() => this.networkData().nodes.filter(n => n.id.toString().startsWith('user-')));
  activeEntityNodesOnGraph = computed(() => this.networkData().nodes.filter(n => this.customEntities().some(e => e.id === n.id)));

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

  getFollowerSummary(platformData: PlatformResult): string {
    const followersCount = this.getFollowers(platformData).length;
    const followingCount = this.getFollowing(platformData).length;
    if (followersCount === 0 && followingCount === 0) {
      return 'Followers and following not fetched';
    }
    if (followersCount > 0 && followingCount > 0) {
      return `${followersCount} followers, ${followingCount} following`;
    }
    if (followersCount > 0) {
      return `${followersCount} followers`;
    }
    return `${followingCount} following`;
  }

  getProfileUrl(platformData: PlatformResult, username: string): string {
    return buildSocialProfileUrl(platformData.platform, username, platformData.url);
  }

  getPlatformData(platformNodeId: string): PlatformResult | undefined {
    if (!platformNodeId.startsWith('platform-')) {
      return undefined;
    }
    const key = platformNodeId.substring('platform-'.length);
    const [keyUsername, platformName, platformUsername] = key.split('|');
    const userResults = this.scanResults().get(keyUsername);
    return userResults?.find(p => p.platform === platformName && p.username === platformUsername);
  }

  getEntityData(entityNodeId: string): CustomEntity | undefined {
    return this.customEntities().find(e => e.id === entityNodeId);
  }

  getEntityReportRecords(entity: CustomEntity): Array<Record<string, unknown>> {
    const report = entity.reportData;
    if (!report || typeof report !== 'object') {
      return [];
    }
    const nestedResult = (report as any)?.result;
    if (Array.isArray(nestedResult)) {
      return nestedResult as Array<Record<string, unknown>>;
    }
    if (Array.isArray(nestedResult?.result)) {
      return nestedResult.result as Array<Record<string, unknown>>;
    }
    return [report as Record<string, unknown>];
  }

  getEntityRecordEntries(record: Record<string, unknown>): Array<{ key: string; label: string; values: string[]; }> {
    return Object.entries(record)
      .filter(([, value]) => value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))
      .map(([key, value]) => ({
        key,
        label: this.toFieldLabel(key),
        values: this.toDisplayValues(value)
      }));
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
        if (connectedNode) {
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
      return this.getIconForEntityType(entity.type);
    }
    return 'bi bi-record-circle text-teal-400';
  }

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
      case 'domain-scan': return 'bi bi-globe2 text-sky-400';
      case 'subdomains-scan': return 'bi bi-diagram-3 text-sky-400';
      case 'dns-scan': return 'bi bi-broadcast text-sky-400';
      case 'wayback-scan': return 'bi bi-clock-history text-sky-400';
      case 'email-breach': return 'bi bi-person-badge text-indigo-400';
      case 'social-scanner': return 'bi bi-people text-indigo-400';
      case 'wanted-list': return 'bi bi-person-exclamation text-indigo-400';
      case 'national-identity': return 'bi bi-card-text text-indigo-400';
      case 'playstore-scanner': return 'bi bi-google-play text-indigo-400';
      case 'software-scanner': return 'bi bi-window text-indigo-400';
      case 'ioc-extract': return 'bi bi-file-earmark-code text-indigo-400';
      case 'apk-scan': return 'bi bi-android2 text-indigo-400';
      case 'crypto-scanner': return 'bi bi-currency-bitcoin text-green-400';
      default: return 'bi bi-circle text-slate-400';
    }
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

  private toFieldLabel(key: string): string {
    const normalized = key.replace(/^m_/, '').replace(/_/g, ' ').trim();
    if (!normalized) {
      return key;
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private toDisplayValues(value: unknown): string[] {
    if (Array.isArray(value)) {
      const values = value
        .filter(item => item !== null && item !== undefined && `${item}`.trim() !== '')
        .map(item => `${item}`);
      return values.length > 0 ? values : ['-'];
    }
    return [this.toDisplayValue(value)];
  }

  private toDisplayValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value, null, 2);
    }
    catch {
      return String(value);
    }
  }
}
