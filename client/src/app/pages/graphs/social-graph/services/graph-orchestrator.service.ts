import { Injectable, inject } from '@angular/core';
import { Position } from 'vis-network';
import { GraphManagerService } from './graph-manager.service';
import { IconService } from '../../../../shared/services/icon.service';
import { FetchingStateService } from './fetching-state.service';
import { PlatformResult, TabState, NetworkNode } from '../../../../shared/model/social/social-scan.models';
import { RelationshipResolverService } from './relationship-resolver.service';
import { getSocialGraphLabelColor } from './theme-color.util';
const INITIAL_GRAPH_NODES = 30;
const GROUPING_THRESHOLD = 30;
const MAX_GROUP_SIZE = 25;
@Injectable({ providedIn: 'root' })
export class GraphOrchestratorService {
  private graphManager = inject(GraphManagerService);
  private iconService = inject(IconService);
  private fetchingState = inject(FetchingStateService);
  private relationshipResolver = inject(RelationshipResolverService);

  private getGraphLabelColor(): string {
    return getSocialGraphLabelColor();
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => resolve(), milliseconds);
    });
  }

  private getExpandedGroupNode(groupNode: NetworkNode): NetworkNode {
    return {
      ...groupNode,
      image: this.graphManager.createGroupNodeSvg(groupNode.groupedPlatforms?.length ?? 0, true),
      size: 50,
      borderWidth: 3,
      borderWidthSelected: 4,
      shadow: {
        enabled: true,
        color: 'rgba(250, 204, 21, 0.75)',
        size: 24,
        x: 0,
        y: 0
      },
      color: {
        border: '#facc15',
        background: 'transparent',
        hover: { border: '#facc15', background: 'transparent' },
        highlight: { border: '#facc15', background: 'transparent' },
      },
    };
  }

  public async updateGraphFromModal(state: TabState, username: string, selectedPlatforms: PlatformResult[]) {
    if (selectedPlatforms.length > GROUPING_THRESHOLD) {
      this._updateGraphWithGroupedNodes(state, username, selectedPlatforms);
      return;
    }
    state.graphPlatformBatches.update(batches => {
      const newBatches = new Map(batches);
      if (selectedPlatforms.length > 0) {
        newBatches.set(username, { all: selectedPlatforms, visibleCount: Math.min(selectedPlatforms.length, INITIAL_GRAPH_NODES) });
      }
      else {
        newBatches.delete(username);
      }
      return newBatches;
    });
    state.expandedGroupDataByUser.update(current => {
      const newMap = { ...current }; delete newMap[username]; return newMap; 
    });
    const batchInfo = state.graphPlatformBatches().get(username);
    const platformsToDisplay = batchInfo ? batchInfo.all.slice(0, batchInfo.visibleCount) : [];
    const iconUrlMap = new Map<string, string>();
    if (platformsToDisplay.length > 0) {
      const iconUrls = await Promise.all(platformsToDisplay.map(p => this.iconService.getWhiteIconDataUrl(p.platform, { type: 'graph' })));
      platformsToDisplay.forEach((p, i) => iconUrlMap.set(p.platform, iconUrls[i]));
    }
    state.networkData.update(currentData => {
      const centralNodeId = `user-${username}`;
      const newNodes = currentData.nodes.filter(n => !n.id.toString().startsWith(`platform-${username}|`) && !n.id.toString().startsWith(`group-${username}-`) && n.id.toString() !== centralNodeId);
      const newEdges = currentData.edges.filter(e => e.from !== centralNodeId && e.to !== centralNodeId);
      if (platformsToDisplay.length === 0) {
        state.activeUsernames.update(s => {
          const newSet = new Set(s); newSet.delete(username); return newSet; 
        });
      }
      return { nodes: newNodes, edges: newEdges };
    });
    if (platformsToDisplay.length > 0) {
      this.addNodesAndEdges(state, username, platformsToDisplay, iconUrlMap);
    }
    else {
      await this.updateUserConnections(state);
    }
  }

  private _updateGraphWithGroupedNodes(state: TabState, username: string, platforms: PlatformResult[]) {
    const centralNodeId = `user-${username}`;
    const totalPlatforms = platforms.length;
    const sortedPlatforms = [...platforms].sort((a, b) => a.platform.localeCompare(b.platform));
    const numGroups = Math.ceil(totalPlatforms / MAX_GROUP_SIZE);
    const chunkSize = Math.ceil(totalPlatforms / numGroups);
    const platformGroups = Array.from({ length: numGroups }, (_, i) => sortedPlatforms.slice(i * chunkSize, (i + 1) * chunkSize));
    let newNodes = state.networkData().nodes.filter(n => !n.id.toString().startsWith(`platform-${username}|`) && !n.id.toString().startsWith(`group-${username}-`) && n.id.toString() !== centralNodeId);
    let newEdges = state.networkData().edges.filter(e => e.from !== centralNodeId && e.to !== centralNodeId);
    newNodes.push(this.graphManager.createUserNode(username));
    state.activeUsernames.update(s => new Set(s).add(username));
    platformGroups.forEach((group, index) => {
      const groupId = `group-${username}-part-${index + 1}`;
      const groupStart = index * chunkSize + 1, groupEnd = groupStart + group.length - 1;
      newNodes.push({
        id: groupId, label: ``, shape: 'circularImage', image: this.graphManager.createGroupNodeSvg(group.length), size: 45,
        font: { color: this.getGraphLabelColor() }, color: { border: 'transparent', background: 'transparent', hover: { border: '#7dd3fc', background: 'transparent' }, highlight: { border: '#7dd3fc', background: 'transparent' } },
        borderWidth: 0, borderWidthSelected: 3, title: `Platforms ${groupStart}-${groupEnd} | ${group.length} platforms | Double-click to expand.`,
        groupedPlatforms: group,
      });
      newEdges.push({ from: centralNodeId, to: groupId });
    });
    state.networkData.set({ nodes: newNodes, edges: newEdges });
    state.graphPlatformBatches.update(b => {
      const nb = new Map(b); nb.delete(username); return nb; 
    });
    state.expandedGroupDataByUser.update(c => {
      const nc = { ...c }; delete nc[username]; return nc; 
    });
  }

  private addNodesAndEdges(state: TabState, username: string, platforms: PlatformResult[], iconUrlMap: Map<string, string>) {
    const centralNodeId = `user-${username}`;
    const userNode = this.graphManager.createUserNode(username);
    const platformNodes = platforms.map(p => this.graphManager.createPlatformNode(p, iconUrlMap));
    if (!state.networkData().nodes.some(n => n.id === centralNodeId)) {
      state.networkData.update(d => ({ ...d, nodes: [...d.nodes, userNode] }));
    }
    state.activeUsernames.update(s => new Set(s).add(username));
    const addNodeSequentially = (index: number) => {
      if (index >= platformNodes.length) {
        this.updateUserConnections(state).then();
        return;
      }
      const node = platformNodes[index], edge = { from: centralNodeId, to: node.id };
      state.networkData.update(d => ({ nodes: [...d.nodes, node], edges: [...d.edges, edge] }));
      setTimeout(() => addNodeSequentially(index + 1), 75);
    };
    addNodeSequentially(0);
  }

  public removeUserFromGraph(state: TabState, username: string) {
    state.networkData.update(currentData => {
      const centralNodeId = `user-${username}`;
      const nodesToRemove = new Set<string | number>([centralNodeId]);
      currentData.edges.forEach(edge => {
        let otherNodeId: string | number | null = null;
        if (edge.from === centralNodeId) {
          otherNodeId = edge.to;
        }
        else if (edge.to === centralNodeId) {
          otherNodeId = edge.from;
        }
        if (otherNodeId && !otherNodeId.toString().startsWith('user-') && !state.customEntities().some(e => e.id === otherNodeId)) {
          nodesToRemove.add(otherNodeId);
        }
      });
      return {
        nodes: currentData.nodes.filter(n => !nodesToRemove.has(n.id)),
        edges: currentData.edges.filter(e => !nodesToRemove.has(e.from) && !nodesToRemove.has(e.to))
      };
    });
    state.activeUsernames.update(currentSet => {
      const newSet = new Set(currentSet); newSet.delete(username); return newSet; 
    });
    state.expandedGroupDataByUser.update(current => {
      const newMap = { ...current }; delete newMap[username]; return newMap; 
    });
    state.graphPlatformBatches.update(batches => {
      const newBatches = new Map(batches); newBatches.delete(username); return newBatches; 
    });
    this.updateUserConnections(state).then();
  }

  public addEntityToGraph(state: TabState, entityId: string) {
    const entity = state.customEntities().find(e => e.id === entityId);
    if (!entity || entity.onGraph || entity.status === 'pending') {
      return;
    }
    const newNode = this.graphManager.createEntityNode(entity);
    state.networkData.update(d => ({ ...d, nodes: [...d.nodes, newNode] }));
    state.customEntities.update(e => e.map(en => en.id === entityId ? { ...en, onGraph: true } : en));
  }

  public deleteCustomEntity(state: TabState, nodeId: string) {
    state.customEntities.update(e => e.filter(en => en.id !== nodeId));
    state.networkData.update(d => ({
      ...d,
      nodes: d.nodes.filter(n => n.id !== nodeId),
      edges: d.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    }));
  }

  public removeAllPlatformNodes(state: TabState, username: string) {
    state.networkData.update(d => ({
      nodes: d.nodes.filter(n => !n.id.toString().startsWith(`platform-${username}|`) && !n.id.toString().startsWith(`group-${username}-`)),
      edges: d.edges.filter(e => e.from !== `user-${username}`)
    }));
    state.activeUsernames.update(s => {
      const ns = new Set(s); ns.delete(username); return ns; 
    });
    state.graphPlatformBatches.update(b => {
      const nb = new Map(b); nb.delete(username); return nb; 
    });
  }

  public removeSingleNode(state: TabState, nodeId: string) {
    state.networkData.update(d => {
      let newNodes = d.nodes.filter(n => n.id !== nodeId);
      let newEdges = d.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
      if (nodeId.startsWith('platform-')) {
        const [keyUsername] = nodeId.substring('platform-'.length).split('|');
        const userNodeId = `user-${keyUsername}`;
        if (!newEdges.some(e => e.from === userNodeId && (e.to.toString().startsWith('platform-') || e.to.toString().startsWith('group-')))) {
          newNodes = newNodes.filter(n => n.id !== userNodeId);
          state.activeUsernames.update(s => {
            const ns = new Set(s); ns.delete(keyUsername); return ns; 
          });
          state.graphPlatformBatches.update(b => {
            const nb = new Map(b); nb.delete(keyUsername); return nb; 
          });
        }
      }
      return { nodes: newNodes, edges: newEdges };
    });
  }

  public addEdge( state: TabState, edge: { from: string; to: string; } ) {
    const isConnectingToEntity = state.customEntities().some(e => e.id === edge.from || e.id === edge.to);
    const styledEdge = isConnectingToEntity
      ? { ...edge, dashes: [2, 2], color: { color: '#a78bfa', highlight: '#c4b5fd', hover: '#8b5cf6' }, width: 2, smooth: { type: 'dynamic' } }
      : { ...edge };
    state.networkData.update(d => ({ ...d, edges: [...d.edges, styledEdge] }));
  }

  public deleteEdges(state: TabState, edgeIds: string[]) {
    state.networkData.update(d => ({ ...d, edges: d.edges.filter((e: any) => !edgeIds.includes(e.id)) }));
  }

  public async handleGroupNodeClicked( state: TabState, { nodeId, position }: { nodeId: string; position: Position; } ) {
    const username = nodeId.split('-')[1];
    const centralNodeId = `user-${username}`;
    const expandedGroupForUser = state.expandedGroupDataByUser()[username];
    const isCollapsing = expandedGroupForUser?.id === nodeId;
    const collapseGroupAnimated = async (currentState: TabState) => {
      const groupToCollapse = currentState.expandedGroupDataByUser()[username];
      if (!groupToCollapse || !groupToCollapse.groupedPlatforms) {
        return;
      }
      const platformIdsToRemove = groupToCollapse.groupedPlatforms.map(p => this.fetchingState.getPlatformUniqueKey(p));
      const chunkSize = 6;
      for (let index = platformIdsToRemove.length - 1; index >= 0; index -= chunkSize) {
        const currentChunk = platformIdsToRemove.slice(Math.max(0, index - chunkSize + 1), index + 1);
        const removeIds = new Set(currentChunk);
        currentState.networkData.update(d => ({
          nodes: d.nodes.filter(n => !removeIds.has(n.id.toString())),
          edges: d.edges.filter(e => !(e.from === centralNodeId && removeIds.has(e.to.toString())))
        }));
        await this.wait(16);
      }
      currentState.networkData.update(d => ({
        nodes: d.nodes.map(n => n.id === groupToCollapse.id ? groupToCollapse : n),
        edges: d.edges
      }));
    };
    if (isCollapsing) {
      await collapseGroupAnimated(state);
      state.expandedGroupDataByUser.update(c => ({ ...c, [username]: null }));
    }
    else {
      if (expandedGroupForUser) {
        await collapseGroupAnimated(state);
        state.expandedGroupDataByUser.update(c => ({ ...c, [username]: null }));
      }
      const groupNodeToExpand = state.networkData().nodes.find(n => n.id === nodeId);
      if (groupNodeToExpand?.groupedPlatforms) {
        const platformsToAdd = groupNodeToExpand.groupedPlatforms;
        const iconUrls = await Promise.all(platformsToAdd.map(p => this.iconService.getWhiteIconDataUrl(p.platform, { type: 'graph' })));
        const iconUrlMap = new Map<string, string>(platformsToAdd.map((p, i) => [p.platform, iconUrls[i]]));
        const expandedGroupNode = this.getExpandedGroupNode(groupNodeToExpand);
        state.networkData.update(d => ({
          nodes: d.nodes.map(n => n.id === nodeId ? expandedGroupNode : n),
          edges: d.edges
        }));
        state.expandedGroupDataByUser.update(c => ({ ...c, [username]: groupNodeToExpand }));
        const platformNodes = platformsToAdd.map(platform => ({ ...this.graphManager.createPlatformNode(platform, iconUrlMap), x: position?.x, y: position?.y }));
        const newEdges = platformsToAdd.map(platform => ({ from: centralNodeId, to: this.fetchingState.getPlatformUniqueKey(platform) }));
        const chunkSize = 6;
        for (let index = 0; index < platformNodes.length; index += chunkSize) {
          const nodeChunk = platformNodes.slice(index, index + chunkSize);
          const edgeChunk = newEdges.slice(index, index + chunkSize);
          state.networkData.update(d => ({
            nodes: [...d.nodes, ...nodeChunk],
            edges: [...d.edges, ...edgeChunk]
          }));
          await this.wait(16);
        }
      }
    }
  }

  public async updateUserConnections(state: TabState) {
    const activeUsers = Array.from(state.activeUsernames());
    const scanResults = state.scanResults();
    const currentNetworkData = state.networkData();
    const allNodeIdsOnGraph = new Set(currentNetworkData.nodes.map(node => node.id.toString()));
    const nodesToKeep = currentNetworkData.nodes.filter(node => !node.id.toString().startsWith('relationship-node-'));
    const edgesToKeep = currentNetworkData.edges.filter(edge => !edge.id?.toString().startsWith('relationship-user-') && !edge.id?.toString().startsWith('relationship-edge-'));
    const newRelationshipNodes: NetworkNode[] = [];
    const newRelationshipEdges: any[] = [];
    for (let i = 0; i < activeUsers.length; i++) {
      for (let j = i + 1; j < activeUsers.length; j++) {
        const userA = activeUsers[i];
        const userB = activeUsers[j];
        const userANodeId = `user-${userA}`;
        const userBNodeId = `user-${userB}`;
        if (!allNodeIdsOnGraph.has(userANodeId) || !allNodeIdsOnGraph.has(userBNodeId)) {
          continue;
        }
        const userAPlatforms = scanResults.get(userA) || [];
        const userBPlatforms = scanResults.get(userB) || [];
        const userAHandles = this.relationshipResolver.getUserHandleSet(userA, userAPlatforms);
        const userBHandles = this.relationshipResolver.getUserHandleSet(userB, userBPlatforms);
        let followsAtoB = false;
        let followsBtoA = false;
        const matchedPlatforms = new Set<string>();
        const detectorProfiles = new Set<string>();
        for (const platformA of userAPlatforms) {
          const aToBDetected = this.relationshipResolver.containsAnyHandle(platformA.following_list, userBHandles)
                        || this.relationshipResolver.containsAnyHandle(platformA.followers_list, userBHandles);
          if (aToBDetected) {
            followsAtoB = true;
            matchedPlatforms.add(platformA.platform);
            detectorProfiles.add(`${userA}|${platformA.platform}|${platformA.username}`);
          }
        }
        for (const platformB of userBPlatforms) {
          const bToADetected = this.relationshipResolver.containsAnyHandle(platformB.following_list, userAHandles)
                        || this.relationshipResolver.containsAnyHandle(platformB.followers_list, userAHandles);
          if (bToADetected) {
            followsBtoA = true;
            matchedPlatforms.add(platformB.platform);
            detectorProfiles.add(`${userB}|${platformB.platform}|${platformB.username}`);
          }
        }
        if (!followsAtoB && !followsBtoA) {
          continue;
        }
        const relationshipKey = [userA, userB].sort().join('--');
        const relationshipNodeId = `relationship-node-${relationshipKey}`;
        const detectorProfileCount = detectorProfiles.size;
        const matchedPlatformsText = Array.from(matchedPlatforms).sort().join(', ') || 'Unknown';
        const isMutual = followsAtoB && followsBtoA;
        const directionTitle = isMutual ? `${userA} and ${userB} follow each other` : (followsAtoB ? `${userA} follows ${userB}` : `${userB} follows ${userA}`);
        newRelationshipNodes.push({
          id: relationshipNodeId,
          label: `${detectorProfileCount}`,
          shape: 'dot',
          size: 14,
          font: { color: this.getGraphLabelColor(), size: 10 },
          color: {
            border: '#fbbf24',
            background: '#78350f',
            highlight: { border: '#fde68a', background: '#92400e' },
            hover: { border: '#fde68a', background: '#92400e' }
          },
          borderWidth: 2,
          borderWidthSelected: 3,
          title: `${directionTitle}\nDetected by ${detectorProfileCount} social profile(s)\nPlatforms: ${matchedPlatformsText}`
        });
        const edgeStyle = {
          color: { color: '#f59e0b', highlight: '#fbbf24', hover: '#f59e0b' },
          width: 2.5,
          smooth: { type: 'dynamic', roundness: 0.18 }
        };
        if (isMutual) {
          newRelationshipEdges.push({
            id: `relationship-edge-${relationshipKey}-a`,
            from: userANodeId,
            to: relationshipNodeId,
            arrows: { from: { enabled: true, scaleFactor: 0.75, type: 'arrow' }, to: { enabled: true, scaleFactor: 0.75, type: 'arrow' } },
            ...edgeStyle
          });
          newRelationshipEdges.push({
            id: `relationship-edge-${relationshipKey}-b`,
            from: relationshipNodeId,
            to: userBNodeId,
            arrows: { from: { enabled: true, scaleFactor: 0.75, type: 'arrow' }, to: { enabled: true, scaleFactor: 0.75, type: 'arrow' } },
            ...edgeStyle
          });
        }
        else {
          let sourceUserNodeId = userANodeId;
          let targetUserNodeId = userBNodeId;
          if (followsBtoA) {
            sourceUserNodeId = userBNodeId;
            targetUserNodeId = userANodeId;
          }
          newRelationshipEdges.push({
            id: `relationship-edge-${relationshipKey}-a`,
            from: sourceUserNodeId,
            to: relationshipNodeId,
            arrows: { to: { enabled: true, scaleFactor: 0.85, type: 'arrow' } },
            ...edgeStyle
          });
          newRelationshipEdges.push({
            id: `relationship-edge-${relationshipKey}-b`,
            from: relationshipNodeId,
            to: targetUserNodeId,
            arrows: { to: { enabled: true, scaleFactor: 0.85, type: 'arrow' } },
            ...edgeStyle
          });
        }
      }
    }
    state.networkData.set({
      nodes: [...nodesToKeep, ...newRelationshipNodes],
      edges: [...edgesToKeep, ...newRelationshipEdges]
    });
  }
}
