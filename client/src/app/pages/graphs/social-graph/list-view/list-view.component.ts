import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkData, PlatformResult, CustomEntity, NetworkNode } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { getMetadataEntries } from '../utils/summary-view.util';

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
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  activeUserNodes = computed(() =>
    this.networkData().nodes.filter(n => n.id.toString().startsWith('user-'))
  );

  activeEntityNodesOnGraph = computed(() =>
    this.networkData().nodes.filter(n => this.customEntities().some(e => e.id === n.id))
  );

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
    let normalizedUsername = username.trim();
    const platform = platformData.platform.toLowerCase();
    if (normalizedUsername.startsWith('@')) {
      normalizedUsername = normalizedUsername.substring(1);
    }
    if (platform === 'twitter' || platform === 'x') {
      return `https://x.com/${normalizedUsername}`;
    }
    if (platform === 'instagram') {
      return `https://www.instagram.com/${normalizedUsername}`;
    }
    if (platform === 'tiktok') {
      return `https://www.tiktok.com/@${normalizedUsername}`;
    }
    if (platform === 'facebook') {
      return `https://www.facebook.com/${normalizedUsername}`;
    }
    if (platform === 'youtube') {
      return `https://www.youtube.com/@${normalizedUsername}`;
    }
    const baseUrl = platformData.url?.trim();
    if (!baseUrl) {
      return '#';
    }
    try {
      const parsedUrl = new URL(baseUrl);
      const hasTrailingSlash = parsedUrl.pathname.endsWith('/');
      parsedUrl.pathname = hasTrailingSlash ? `${parsedUrl.pathname}${normalizedUsername}` : `${parsedUrl.pathname}/${normalizedUsername}`;
      return parsedUrl.toString();
    } catch {
      return baseUrl;
    }
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

  getNodeById(nodeId: string | number): NetworkNode | undefined {
    return this.networkData().nodes.find(n => n.id === nodeId);
  }

  getConnectionsForNode(nodeId: string): { node: NetworkNode, edge: any }[] {
    const connections: { node: NetworkNode, edge: any }[] = [];
    for (const edge of this.networkData().edges) {
      let connectedNodeId: string | number | null = null;
      if (edge.from === nodeId) {
        connectedNodeId = edge.to;
      } else if (edge.to === nodeId) {
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
    }
  }

  getMetadataEntries(platformNodeId: string): { key: string, value: any }[] {
    const platformData = this.getPlatformData(platformNodeId);
    return getMetadataEntries(platformData?.allMetadata);
  }

  trackById(_index: number, item: { id: string | number }): string | number {
    return item.id;
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  trackConnectionById(_index: number, item: { node: NetworkNode }): string | number {
    return item.node.id;
  }
}
