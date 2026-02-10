import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkData, PlatformResult, CustomEntity, NetworkNode } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl } from '../../../shared/utils/formatters';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.css'],
  standalone: true,
  imports: [CommonModule],
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
  openManageProfiles = output<string>();
  openDeleteConfirmation = output<string>();
  deleteCustomEntity = output<string>();

  public getPlatformColor = getPlatformColor;
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
    return this.networkData().nodes.filter(n => n.id.toString().startsWith(`${username}-`));
  }

  getPlatformData(platformNodeId: string): PlatformResult | undefined {
    const [username, platformName] = platformNodeId.split('-');
    const userResults = this.scanResults().get(username);
    return userResults?.find(p => p.platform === platformName);
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
      if (edge.from === nodeId) connectedNodeId = edge.to;
      else if (edge.to === nodeId) connectedNodeId = edge.from;

      if (connectedNodeId) {
        const connectedNode = this.getNodeById(connectedNodeId);
        if (connectedNode) connections.push({ node: connectedNode, edge });
      }
    }
    return connections;
  }
  
  getNodeIcon(node: NetworkNode): string {
    if (node.id.toString().startsWith('user-')) {
      return 'bi bi-person-circle text-indigo-400';
    }
    const entity = this.getEntityData(node.id.toString());
    if (entity) return this.getIconForEntityType(entity.type);
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
    const metadata = platformData?.allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }
}