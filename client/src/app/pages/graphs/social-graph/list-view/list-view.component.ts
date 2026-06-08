import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal } from '@angular/core';

import { NetworkData, PlatformResult, CustomEntity, NetworkNode } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { SocialEntityUiService } from '../services/social-entity-ui.service';
import { getMetadataEntries } from '../utils/summary-view.util';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { getEntityRecordEntries, getEntityReportRecords, getScanResultsByUsername, parsePlatformNodeId } from '../utils/social-graph-view.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  standalone: true,
  imports: [SocialIconComponent, TranslatePipe],
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
  readonly socialEntityUiService = inject(SocialEntityUiService);
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
    const parsed = parsePlatformNodeId(platformNodeId);
    if (!parsed) {
      return undefined;
    }
    const userResults = getScanResultsByUsername(this.scanResults(), parsed.keyUsername);
    return userResults?.find(p =>
      (p.platform || '').toLowerCase() === parsed.platformName.toLowerCase() &&
            (p.username || '').toLowerCase() === parsed.platformUsername.toLowerCase());
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

}
