import { Injectable, inject } from '@angular/core';
import { Position } from 'vis-network';
import { GraphManagerService } from './graph-manager.service';
import { IconService } from '../../../shared/services/icon.service';
import { FetchingStateService } from './fetching-state.service';
import { PlatformResult, TabState, NetworkNode } from '../../../shared/model/social/social-scan.models';

const INITIAL_GRAPH_NODES = 30;
const GROUPING_THRESHOLD = 30;
const MAX_GROUP_SIZE = 25;

@Injectable({ providedIn: 'root' })
export class GraphOrchestratorService {
  private graphManager = inject(GraphManagerService);
  private iconService = inject(IconService);
  private fetchingState = inject(FetchingStateService);

  private wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => resolve(), milliseconds);
    });
  }

  private async animateNodeScale(state: TabState, nodeId: string, fromSize: number, toSize: number, steps: number, delayMs: number): Promise<void> {
    const totalSteps = Math.max(1, steps);

    for (let step = 1; step <= totalSteps; step++) {
      const progress = step / totalSteps;
      const nextSize = fromSize + ((toSize - fromSize) * progress);

      state.networkData.update(d => ({
        nodes: d.nodes.map(n => n.id.toString() === nodeId ? { ...n, size: nextSize } : n),
        edges: d.edges
      }));

      await this.wait(delayMs);
    }
  }

  private getExpandedGroupNode(groupNode: NetworkNode): NetworkNode {
    return {
      ...groupNode,
      image: this.graphManager.createGroupNodeSvg(groupNode.groupedPlatforms?.length ?? 0, true),
      borderWidth: 3,
      borderWidthSelected: 4,
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
      } else {
        newBatches.delete(username);
      }
      return newBatches;
    });
    state.expandedGroupDataByUser.update(current => { const newMap = { ...current }; delete newMap[username]; return newMap; });

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
        state.activeUsernames.update(s => { const newSet = new Set(s); newSet.delete(username); return newSet; });
      }
      return { nodes: newNodes, edges: newEdges };
    });

    if (platformsToDisplay.length > 0) {
      this.addNodesAndEdges(state, username, platformsToDisplay, iconUrlMap);
    } else {
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
        font: { color: '#e5e7eb' }, color: { border: 'transparent', background: 'transparent', hover: { border: '#7dd3fc', background: 'transparent' }, highlight: { border: '#7dd3fc', background: 'transparent' } },
        borderWidth: 0, borderWidthSelected: 3, title: `Platforms ${groupStart}-${groupEnd} | ${group.length} platforms | Double-click to expand.`,
        groupedPlatforms: group,
      });
      newEdges.push({ from: centralNodeId, to: groupId });
    });
    state.networkData.set({ nodes: newNodes, edges: newEdges });
    state.graphPlatformBatches.update(b => { const nb = new Map(b); nb.delete(username); return nb; });
    state.expandedGroupDataByUser.update(c => { const nc = { ...c }; delete nc[username]; return nc; });
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
        if (otherNodeId && !otherNodeId.toString().startsWith('user-') && !state.customEntities().some(e => e.id === otherNodeId))
{
          nodesToRemove.add(otherNodeId);
        }
      });
      return {
        nodes: currentData.nodes.filter(n => !nodesToRemove.has(n.id)),
        edges: currentData.edges.filter(e => !nodesToRemove.has(e.from) && !nodesToRemove.has(e.to))
      };
    });

    state.activeUsernames.update(currentSet => { const newSet = new Set(currentSet); newSet.delete(username); return newSet; });
    state.expandedGroupDataByUser.update(current => { const newMap = { ...current }; delete newMap[username]; return newMap; });
    state.graphPlatformBatches.update(batches => { const newBatches = new Map(batches); newBatches.delete(username); return newBatches; });

    this.updateUserConnections(state).then();
  }

  public addEntityToGraph(state: TabState, entityId: string) {
    const entity = state.customEntities().find(e => e.id === entityId);
    if (!entity || entity.onGraph || entity.status === 'pending') {
	return;

}
    const colors = { wallet: { border: '#4ade80', bg: '#166534' }, email: { border: '#facc15', bg: '#854d0e' }, domain: { border: '#38bdf8', bg: '#075985' } };
    const newNode: NetworkNode = {
      id: entity.id, label: entity.label, shape: 'box', size: 25, font: { color: '#e5e7eb' },
      color: { border: colors[entity.type].border, background: colors[entity.type].bg, highlight: { border: '#facc15', background: colors[entity.type].bg }, hover: { border: '#ffffff', background: colors[entity.type].bg } },
      title: `${entity.type.toUpperCase()} | ${entity.label}`, borderWidth: 2, borderWidthSelected: 4
    };

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
    state.activeUsernames.update(s => { const ns = new Set(s); ns.delete(username); return ns; });
    state.graphPlatformBatches.update(b => { const nb = new Map(b); nb.delete(username); return nb; });
  }

  public removeSingleNode(state: TabState, nodeId: string) {
    state.networkData.update(d => {
      let newNodes = d.nodes.filter(n => n.id !== nodeId);
      let newEdges = d.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
      if (nodeId.startsWith('platform-')) {
        const [keyUsername] = nodeId.substring('platform-'.length).split('|');
        const userNodeId = `user-${keyUsername}`;
        if (!newEdges.some(e => e.from === userNodeId && (e.to.toString().startsWith('platform-') || e.to.toString().startsWith('group-'))))
{
          newNodes = newNodes.filter(n => n.id !== userNodeId);
          state.activeUsernames.update(s => { const ns = new Set(s); ns.delete(keyUsername); return ns; });
          state.graphPlatformBatches.update(b => { const nb = new Map(b); nb.delete(keyUsername); return nb; });
        }
      }
      return { nodes: newNodes, edges: newEdges };
    });
  }

  public addEdge(state: TabState, edge: { from: string, to: string }) {
    const isConnectingToEntity = state.customEntities().some(e => e.id === edge.from || e.id === edge.to);
    const styledEdge = isConnectingToEntity
      ? { ...edge, dashes: [2, 2], color: { color: '#a78bfa', highlight: '#c4b5fd', hover: '#8b5cf6' }, width: 2, smooth: { type: 'dynamic' } }
      : { ...edge };
    state.networkData.update(d => ({ ...d, edges: [...d.edges, styledEdge] }));
  }

  public deleteEdges(state: TabState, edgeIds: string[]) {
    state.networkData.update(d => ({ ...d, edges: d.edges.filter((e: any) => !edgeIds.includes(e.id)) }));
  }

  public async handleGroupNodeClicked(state: TabState, { nodeId, position }: { nodeId: string, position: Position }) {
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

      for (let index = platformIdsToRemove.length - 1; index >= 0; index--) {
        const platformNodeId = platformIdsToRemove[index];
        const currentNode = currentState.networkData().nodes.find(n => n.id.toString() === platformNodeId);
        const currentSize = typeof currentNode?.size === 'number' ? currentNode.size : 25;

        await this.animateNodeScale(currentState, platformNodeId, currentSize, 5, 5, 14);

        currentState.networkData.update(d => ({
          nodes: d.nodes.filter(n => n.id.toString() !== platformNodeId),
          edges: d.edges.filter(e => !(e.from === centralNodeId && e.to.toString() === platformNodeId))
        }));
        await this.wait(18);
      }

      currentState.networkData.update(d => ({
        nodes: d.nodes.map(n => n.id === groupToCollapse.id ? groupToCollapse : n),
        edges: d.edges
      }));
    };

    if (isCollapsing) {
      await collapseGroupAnimated(state);
      state.expandedGroupDataByUser.update(c => ({ ...c, [username]: null }));
    } else {
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

        for (const platform of platformsToAdd) {
          const platformNode = { ...this.graphManager.createPlatformNode(platform, iconUrlMap), x: position?.x, y: position?.y, size: 5 };
          const platformNodeId = this.fetchingState.getPlatformUniqueKey(platform);
          const edge = { from: centralNodeId, to: platformNodeId };
          state.networkData.update(d => ({
            nodes: [...d.nodes, platformNode],
            edges: [...d.edges, edge]
          }));
          await this.animateNodeScale(state, platformNodeId, 5, 25, 6, 14);
          await this.wait(10);
        }
      }
    }
  }

  public async updateUserConnections(state: TabState) {
    const activeUsers = Array.from(state.activeUsernames());
    const scanResults = state.scanResults();
    const currentNetworkData = state.networkData();
    const allNodeIdsOnGraph = new Set(currentNetworkData.nodes.map(n => n.id));

    const edgesToKeep = currentNetworkData.edges.filter(edge => !edge.id?.toString().startsWith('relationship-'));
    const newRelationshipEdges: any[] = [];
    const processedConnections = new Set<string>();

    for (let i = 0; i < activeUsers.length; i++) {
      for (let j = i + 1; j < activeUsers.length; j++) {
        const userA_platforms = scanResults.get(activeUsers[i]) || [];
        const userB_platforms = scanResults.get(activeUsers[j]) || [];

        for (const pA of userA_platforms) for (const pB of userB_platforms) {
          if (pA.platform.toLowerCase() !== pB.platform.toLowerCase())
continue;
          const aFollowsB = pA.following_list?.some(f => f.toLowerCase() === pB.username.toLowerCase()) || pB.followers_list?.some(f => f.toLowerCase() === pA.username.toLowerCase());
          const bFollowsA = pB.following_list?.some(f => f.toLowerCase() === pA.username.toLowerCase()) || pA.followers_list?.some(f => f.toLowerCase() === pB.username.toLowerCase());
          if (aFollowsB || bFollowsA) {
            const nodeA_id = this.fetchingState.getPlatformUniqueKey(pA);
            const nodeB_id = this.fetchingState.getPlatformUniqueKey(pB);
            if (allNodeIdsOnGraph.has(nodeA_id) && allNodeIdsOnGraph.has(nodeB_id))
{
              const edgeId = `relationship-${pA.platform}-${[nodeA_id, nodeB_id].sort().join('--')}`;
              if (processedConnections.has(edgeId)) {
	continue;
}
              processedConnections.add(edgeId);

              const isMutual = aFollowsB && bFollowsA;
              const title = isMutual ? `Mutual connection on ${pA.platform}` : (aFollowsB ? `${pA.username} follows ${pB.username}` : `${pB.username} follows ${pA.username}`) + ` on ${pA.platform}`;
              const edge: any = { id: edgeId, from: nodeA_id, to: nodeB_id, title, color: { color: '#fb923c', highlight: '#fdba74', hover: '#f97316' }, width: 2.5, smooth: { type: 'curvedCW', roundness: 0.15 }, dashes: [5, 5] };
              if (!isMutual) {
                edge.arrows = { to: { enabled: true, scaleFactor: 0.8, type: 'arrow' } };
                if (bFollowsA) {
                  [edge.from, edge.to] = [edge.to, edge.from];
                }
              }
              newRelationshipEdges.push(edge);
            }
          }
        }
      }
    }
    state.networkData.set({ nodes: state.networkData().nodes, edges: [...edgesToKeep, ...newRelationshipEdges] });
  }
}
