import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {Network, DataSet, Node, Edge} from 'vis-network/standalone';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../../shared/services/api.service';
import {SidebarComponent} from './sidebar/sidebar.component';
import {GraphInfoComponent} from './graph-info/graph-info.component';
import {NgIf} from '@angular/common';
import {fadeInDashboardItem} from '../../shared/animations/dashboard.item.animation';

interface ExtendedNode extends Node {
  isGroup?: boolean;
  subNodes?: string[];
}

@Component({
  selector: 'app-graphs',
  standalone: true,
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css'],
  animations: [fadeInDashboardItem],
  imports: [FormsModule, SidebarComponent, GraphInfoComponent, NgIf]
})
export class GraphComponent implements OnInit {
  @ViewChild('networkContainer', {static: true}) networkContainer!: ElementRef;
  network!: Network;
  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  physicsEnabled = true;
  expandEnabled = false;
  isEmpty = false;
  limitReached = false
  result: any[] = []

  private rawNodes: ExtendedNode[] = [];
  private rawEdges: Edge[] = [];
  private nodeSet!: DataSet<ExtendedNode>;
  private edgeSet!: DataSet<Edge>;
  private groupInfo: Record<string, string[]> = {};
  private groupExpandedState: Record<string, boolean> = {};
  private highlightedNodeId: string | null = null;

  constructor(private api: ApiService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const selectedType = params['selectedType'] || 'cluster';
      const singleInput = params['singleInput'] || 'general';
      const propertyType = params['propertyType'] || 'm_email_addresses';
      const propertyValue = params['propertyValue'] || '';

      if (selectedType === 'property' && propertyType && propertyValue) {
        this.loadGraphByNode(selectedType, propertyType, propertyValue);
      } else if ((selectedType === 'cluster' || selectedType === 'document') && singleInput) {
        this.loadGraphByNode(selectedType, selectedType, singleInput);
      }
    });
  }

  loadGraphByNode(data_point_type: string, type: string, value: string): void {
    const params = new HttpParams()
      .set('data_point_type', data_point_type)
      .set('model_type', type)
      .set('query_value', value);

    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', {params}).subscribe({
      next: response => {
        const {results, limit_reached} = response;
        this.result = results
        this.renderGraph(this.result);
        this.limitReached = limit_reached;
      },
      error: err => {
        console.error('❌ Request failed:', err);
        this.isEmpty = true;
        this.limitReached = false;
      },
    });
  }


  private renderGraph(data: any[], reset = false): void {
    this.isEmpty = data.length === 0;
    this.rawNodes = [];
    this.rawEdges = [];
    this.groupInfo = {};
    this.groupExpandedState = {};

    const edgeMap: Record<string, number> = {};
    const rawNodeMap: Map<string, ExtendedNode> = new Map();

    data.forEach(item => {
      const v = item.vertex;
      const id = v._id;

      let label = v._key;
      if (v.value) {
        label = `${v._key}`;
        label = label.replace(":", " :: ").replace("m_", "")
      }

      rawNodeMap.set(id, {
        id,
        label,
        color: '#FF6666',
        shape: 'dot',
        font: {
          size: 20,
          color: '#FFFFFF'
        },
        size: 20
      });
      console.log('All node labels:', Array.from(rawNodeMap.values()).map(n => n.label));

      const pathVertices = item.path?.vertices || [];
      pathVertices.forEach((pv: { _id: string; _key: any; value: any[]; }) => {
        if (!pv._id || rawNodeMap.has(pv._id)) return;

        let label = pv._key || pv._id;
        if (pv.value) {
          label = `${pv._key}`;
          label = label.replace(":", " :: ").replace("m_", "")
        }

        rawNodeMap.set(pv._id, {
          id: pv._id,
          label,
          color: '#538cc6',
          shape: 'dot',
          font: {
            size: 20,
            color: '#FFFFFF'
          },
          size: 20
        });
      });

    });


    data.forEach(item => {
      const e = item.edge;
      if (!e || !e._from || !e._to) return;

      this.rawEdges.push({
        id: e._id || `${e._from}->${e._to}`,
        from: e._from,
        to: e._to,
        arrows: 'to',
        color: {color: '#FFFFFF'},
        width: 2
      });

      edgeMap[e._from] = (edgeMap[e._from] || 0) + 1;
    });

    this.rawNodes = [];

    const groupCandidates: ExtendedNode[] = [];

    rawNodeMap.forEach(node => {
      const idStr = String(node.id);
      const labelStr = String(node.label);
      const isLeakNode = idStr.toLowerCase().includes('leak') || labelStr.toLowerCase().includes('leak');
      const degree = edgeMap[idStr] || 0;

      if (degree > 6 && !isLeakNode) {
        groupCandidates.push(node);
      }
    });

    const enableGrouping = groupCandidates.length >= 5;
    const clusters = ['leak', 'defacement', 'chat'];

    rawNodeMap.forEach(node => {
      const idStr = String(node.id).toLowerCase();
      const labelStr = String(node.label).toLowerCase();

      const isClusterNode = clusters.includes(idStr) || clusters.includes(labelStr);

      let degree = edgeMap[idStr] || 0;
      if (this.expandEnabled) {
        degree = 0
      }
      const isGroupable = degree > 6 && !isClusterNode;

      if (isGroupable && enableGrouping) {
        const subNodes = this.rawEdges
          .filter(e => e.from === node.id)
          .map(e => e.to as string);

        this.groupInfo[idStr] = subNodes;

        this.rawNodes.push({
          id: node.id,
          label: `Group: ${node.label}\nSub Nodes: ${subNodes.length}`,
          color: '#ffc966',
          shape: 'dot',
          isGroup: true,
          subNodes,
          font: {
            size: 20,
            color: '#FFFFFF',
            strokeWidth: 1
          },
          size: 20
        });
      } else {
        if (labelStr === 'leak') {
          node.color = '#40bf40';
        } else {
          const hasOutgoing = edgeMap[node.id as string];
          if (!hasOutgoing) {
            node.color = '#1E90FF';
          }
        }

        this.rawNodes.push(node);
      }
    });

    const groupedSubNodeIds = new Set(Object.values(this.groupInfo).flat());
    const visibleNodes = this.rawNodes.filter(
      node => node.isGroup || !groupedSubNodeIds.has(node.id as string)
    );

    const visibleEdges = this.rawEdges.filter(edge => {
      const subNodes = this.groupInfo[edge.from as string];
      return !(subNodes && subNodes.includes(edge.to as string));
    });

    this.nodeSet = new DataSet(visibleNodes);
    this.edgeSet = new DataSet(visibleEdges);

    const container = this.networkContainer.nativeElement;
    this.network = new Network(container, {nodes: this.nodeSet, edges: this.edgeSet}, {
      physics: {
        enabled: this.physicsEnabled,
        solver: 'forceAtlas2Based',
        timestep: 1,
        stabilization: {iterations: 20, fit: true},
        forceAtlas2Based: {
          gravitationalConstant: -170,
          centralGravity: 0.005,
          springLength: 10,
          springConstant: 0.08,
          avoidOverlap: 1
        }
      },
      edges: {
        arrows: {to: {enabled: true, scaleFactor: 1}},
        color: {color: '#FFFFFF'},
        width: 2
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: {size: 20, color: '#FFFFFF'}
      },
      interaction: {selectConnectedEdges: false}
    });
    setTimeout(() => {
      this.physicsEnabled = false;
      let enabled = false
      if (this.network) {
        this.network.setOptions({physics: {enabled}});
      }
    }, 1500);

    this.network.on('click', params => {
      const nodeId = params.nodes[0];

      if (!nodeId) return;

      const node = this.nodeSet.get(nodeId) as ExtendedNode;

      if (node?.isGroup && node.subNodes) {
        const isExpanded = this.groupExpandedState[nodeId] || false;
        if (!isExpanded) {
          const centerPos = this.network.getPositions([nodeId])[nodeId];
          const radius = 200;

          const newEdges = this.rawEdges.filter(
            e => e.from === nodeId && node.subNodes!.includes(e.to as string)
          );
          this.edgeSet.add(newEdges);
          this.groupExpandedState[nodeId] = true;

          const newNodes: ExtendedNode[] = [];

          node.subNodes.forEach((subId, index) => {
            if (this.nodeSet.get(subId)) return;

            const rawNode = this.rawNodes.find(n => n.id === subId);
            if (!rawNode) return;

            // @ts-ignore
            const angle = (2 * Math.PI * index) / node.subNodes.length;
            const x = centerPos.x + radius * Math.cos(angle);
            const y = centerPos.y + radius * Math.sin(angle);

            newNodes.push({
              ...rawNode,
              x,
              y,
              physics: true
            });
          });

          this.nodeSet.add(newNodes);

          this.nodeSet.update({
            id: nodeId,
            color: {background: '#bf80ff', border: '#bf80ff'}
          });
          this.network.selectNodes([nodeId]);
          this.network.unselectAll();
        } else {
          node.subNodes.forEach(subId => {
            if (this.nodeSet.get(subId)) this.nodeSet.remove(subId);
          });

          const edgeIdsToRemove = this.rawEdges
            .filter(e => e.from === nodeId && node.subNodes!.includes(e.to as string))
            .map(e => e.id as string);

          this.edgeSet.remove(edgeIdsToRemove);
          this.groupExpandedState[nodeId] = false;

          this.nodeSet.update({
            id: nodeId,
            color: {background: '#F2F3F4', border: '#F2F3F4'}
          });
        }

      } else {
        const isSameNodeClicked = this.highlightedNodeId === nodeId;
        const allEdges = this.edgeSet.get();
        const resetEdges = allEdges
          .filter(e => e.id)
          .map(e => ({
            id: e.id!,
            color: {color: '#FFFFFF'},
            width: 2
          }));
        this.edgeSet.update(resetEdges);


        if (isSameNodeClicked) {
          this.highlightedNodeId = null;
        } else {
          const connectedEdges = this.edgeSet.get({
            filter: edge => edge.from === nodeId || edge.to === nodeId
          });

          const highlightEdges = connectedEdges
            .filter(e => e.id)
            .map(e => ({
              id: e.id!,
              color: {color: 'yellow'},
              width: 3
            }));
          this.edgeSet.update(highlightEdges);

          this.highlightedNodeId = nodeId;

        }
      }
    });
    const matchedNodeIds: string[] = [];

    this.nodeSet.get().forEach(node => {
      const label = (node.label || '').toString().toLowerCase();
      if (this.propertyValue !== "" && label.includes(this.propertyValue.toLowerCase())) {
        matchedNodeIds.push(node.id as string);
        this.nodeSet.update({
          id: node.id,
          color: 'yellow'
        });
      }
    });

    const matchedEdges = this.edgeSet.get({
      filter: edge =>
        matchedNodeIds.includes(edge.from as string) ||
        matchedNodeIds.includes(edge.to as string)
    });

    this.edgeSet.update(
      matchedEdges.map(edge => ({
        id: edge.id!,
        color: {color: 'yellow'},
        dashes: true,
        width: 3,
        arrows: {to: {enabled: false}}
      }))
    );
  }

  onPhysicsToggled(enabled: boolean): void {
    this.physicsEnabled = enabled;
    if (this.network) {
      this.network.setOptions({physics: {enabled}});
    }
  }

  private physicsTimeoutId: any = null;

  onExpandToggled(enabled: boolean): void {
    if (this.physicsTimeoutId !== null) {
      clearTimeout(this.physicsTimeoutId);
      this.physicsTimeoutId = null;
    }

    if (!this.physicsEnabled) {
      if (this.network) {
        this.network.setOptions({physics: {enabled: true}});
      }

      this.physicsTimeoutId = setTimeout(() => {
        this.physicsEnabled = false;
        if (this.network) {
          this.network.setOptions({physics: {enabled: false}});
        }
        this.physicsTimeoutId = null;
      }, 1500);
    }

    this.nodeSet.get().forEach(node => {
      const extNode = node as ExtendedNode;
      if (!extNode.isGroup || !extNode.subNodes) return;

      const isExpanded = this.groupExpandedState[extNode.id as string] || false;

      if (enabled && !isExpanded) {
        const newNodes = extNode.subNodes
          .filter(subId => !this.nodeSet.get(subId))
          .map(subId => this.rawNodes.find(n => n.id === subId))
          .filter((n): n is ExtendedNode => n !== undefined);

        const newEdges = this.rawEdges.filter(
          e => e.from === extNode.id && extNode.subNodes!.includes(e.to as string)
        );

        this.nodeSet.add(newNodes);
        this.edgeSet.add(newEdges);
        this.groupExpandedState[extNode.id as string] = true;

        this.nodeSet.update({
          id: extNode.id,
          color: {background: '#bf80ff', border: '#bf80ff'}
        });

      } else if (!enabled && isExpanded) {
        extNode.subNodes.forEach(subId => {
          if (this.nodeSet.get(subId)) this.nodeSet.remove(subId);
        });

        const edgeIdsToRemove = this.rawEdges
          .filter(e => e.from === extNode.id && extNode.subNodes!.includes(e.to as string))
          .map(e => e.id as string);

        this.edgeSet.remove(edgeIdsToRemove);
        this.groupExpandedState[extNode.id as string] = false;

        this.nodeSet.update({
          id: extNode.id,
          color: {background: '#ffc966', border: '#ffc966'}
        });
      }
    });
  }

  onSidebarApply(filters: {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
  }): void {
    this.selectedType = filters.selectedType;
    this.singleInput = filters.singleInput;
    this.propertyType = filters.propertyType;
    this.propertyValue = filters.propertyValue;

    if (filters.selectedType === 'property' && filters.propertyType && filters.propertyValue) {
      this.loadGraphByNode(this.selectedType, filters.propertyType, filters.propertyValue);
    } else if ((filters.selectedType === 'cluster' || filters.selectedType === 'document') && filters.singleInput) {
      this.loadGraphByNode(this.selectedType, filters.selectedType, filters.singleInput);
    }
  }
}
