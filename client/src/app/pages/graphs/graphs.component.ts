import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {Network, DataSet, Node, Edge, Color} from 'vis-network/standalone';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../../shared/services/api.service';
import {SidebarComponent} from './sidebar/sidebar.component';
import {GraphInfoComponent} from './graph-info/graph-info.component';
import {NgIf} from '@angular/common';
import {fadeInDashboardItem} from '../../shared/animations/dashboard.item.animation';
import {Clipboard} from '@angular/cdk/clipboard';
import {getDefaultRuleSet, RuleSet} from "../../shared/model/graph/ruleset_model";

interface ExtendedNode extends Node {
  isGroup?: boolean;
  subNodes?: string[];
}

@Component({
  selector: 'app-graphs',
  standalone: true,
  templateUrl: './graphs.component.html',
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
  maxEdge = 1;
  maxDepth = 50;
  loading = false

  physicsEnabled = true;
  expandEnabled = false;
  isEmpty = false;
  limitReached = false
  result: any[] = []
  ruleSet: RuleSet = getDefaultRuleSet();
  flattenedDocuments: any[] = []

  public rawNodes: ExtendedNode[] = [];
  public rawEdges: Edge[] = [];
  public nodeSet!: DataSet<ExtendedNode>;
  public edgeSet!: DataSet<Edge>;
  private groupInfo: Record<string, string[]> = {};
  private groupExpandedState: Record<string, boolean> = {};
  private highlightedNodeId: string | null = null;
  private contextMenuNodeId!: string;
  contextMenuNode: ExtendedNode | null = null;
  copied = false;
  copiedX = 0;
  copiedY = 0;
  orignalColor: string | Color = '';
  currentCategory: string = "";

  constructor(private api: ApiService, private route: ActivatedRoute, private clipboard: Clipboard) {
  }

  ngOnInit(): void {
  }

  resetGraph(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null!;
    }

    if (this.nodeSet) this.nodeSet.clear();
    if (this.edgeSet) this.edgeSet.clear();

    this.nodeSet = new DataSet<ExtendedNode>();
    this.edgeSet = new DataSet<Edge>();

    this.rawNodes = [];
    this.rawEdges = [];
    this.groupInfo = {};
    this.groupExpandedState = {};
    this.highlightedNodeId = null;
    this.contextMenuNode = null;
    this.contextMenuNodeId = '';
    this.currentCategory = '';
    this.result = [];

    if ((this as any).originalNodeColors instanceof Map) {
      (this as any).originalNodeColors.clear();
    }

    const container = this.networkContainer?.nativeElement;
    if (container) {
      container.innerHTML = '';
    }
  }

  loadGraphByNode(data_point_type: string, type: string, value: string, maxEdge: string, maxDepth: string): void {
    this.expandEnabled = false
    let params = new HttpParams();
    this.loading = false;

    if (data_point_type) {
      params = params.set('data_point_type', data_point_type);
    }
    if (type) {
      params = params.set('model_type', type);
    }
    if (value) {
      params = params.set('query_value', value);
    }
    if (maxEdge) {
      params = params.set('edge', maxEdge);
    }
    if (maxDepth) {
      params = params.set('depth', maxDepth);
    }

    this.resetGraph();

    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', {params}).subscribe({
      next: response => {
        const {results, limit_reached} = response;
        this.result = results;
        this.renderGraph(this.result);
        this.limitReached = limit_reached;
        this.loading = true;

        this.flattenedDocuments = [];
        results.forEach(item => {
          const doc = item.vertex;
          if (doc?.type === 'document') {
            const docId = doc.m_document_id || doc._key;
            const docType = doc.type;

            Object.entries(doc).forEach(([key, value]) => {
              if (key.startsWith('m_') && Array.isArray(value)) {
                value.forEach(val => {
                  this.flattenedDocuments.push({
                    m_document_id: docId,
                    type: docType,
                    property: key,
                    value: val
                  });
                });
              }
            });
          }
        });

      },
      error: err => {
        this.isEmpty = true;
        this.limitReached = false;
        this.loading = true;
      },
    });
  }


  private renderGraph(data: any[], _ = false): void {
    this.resetGraph()
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
        arrows: this.ruleSet.edgePointers ? 'to' : '',
        ...(!this.ruleSet.edgeColor ? {color: {color: '#FFFFFF'}} : {}),
        width: 2
      });

      edgeMap[e._from] = (edgeMap[e._from] || 0) + 1;
    });

    this.rawNodes = [];

    const nodeTypeMap: Record<string, string> = {};
    data.forEach(item => {
      nodeTypeMap[item.vertex._id] = item.vertex.type || '';
      // @ts-ignore
      (item.path?.vertices || []).forEach(pv => {
        if (pv._id && pv.type) {
          nodeTypeMap[pv._id] = pv.type;
        }
      });
    });

    rawNodeMap.forEach(node => {
      const nodeId = node.id as string;
      const nodeType = nodeTypeMap[nodeId] || '';
      let degree = edgeMap[nodeId] || 0;

      const isClusterNode = nodeType === 'cluster';
      if (this.expandEnabled) {
        degree = 0;
      }

      const isGroupable = degree > 2 && !isClusterNode;

      if (isGroupable) {
        const subNodes = this.rawEdges
          .filter(e => e.from === node.id)
          .map(e => e.to as string);
        this.groupInfo[nodeId] = subNodes;
        this.rawNodes.push({
          id: node.id,
          label: `Group (${nodeType}) : ${node.label}\nSub Nodes: ${subNodes.length}`,
          color: node.id === "cti_vertices/" + this.singleInput ? "#ffff00" : "#66ff66",
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
        if (isClusterNode) {
          if (this.currentCategory === "") {
            this.currentCategory = node.label!;
            this.currentCategory = this.cleanString(this.currentCategory)
          }
          node.color = 'yellow';
        } else {
          const hasOutgoing = edgeMap[node.id as string];
          if (!hasOutgoing) {
            if (this.selectedType == "cluster") {
              node.color = '#FF6666';
            } else if (this.propertyValue && String(node.id).includes(this.propertyValue)) {
              node.color = 'yellow';
            } else {
              node.color = '#1E90FF';
            }
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
        arrows: {to: {enabled: false, scaleFactor: 1}},
        width: 2
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: {size: 20, color: '#FFFFFF'}
      },
      interaction: {selectConnectedEdges: false}
    });

    container.addEventListener('contextmenu', (e: { preventDefault: () => any; }) => e.preventDefault());


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

    this.network.on('oncontext', params => {
      this.hideContextMenu();
      const pointer = params.pointer.DOM;
      const rawNodeId = this.network.getNodeAt(pointer);

      if (!rawNodeId) {
        this.hideContextMenu();
        return;
      }

      const nodeId = String(rawNodeId);
      const node = this.nodeSet.get(nodeId) as ExtendedNode;
      const clusterNodeIds = new Set([
        'cti_vertices/general',
        'cti_vertices/defacement',
        'cti_vertices/leak',
        'cti_vertices/chat'
      ]);
      const hasClusterConnection = this.rawEdges.some(edge =>
        (edge.from === node.id && clusterNodeIds.has(edge.to as string)) ||
        (edge.to === node.id && clusterNodeIds.has(edge.from as string))
      );
      if (!hasClusterConnection) return;

      if (!node) {
        this.hideContextMenu();
        return;
      }

      this.showContextMenu(pointer.x + 85, pointer.y, node);
    });
    this.network.on('click', params => {
      this.hideContextMenu();
      const pointer = params.pointer.DOM;
      const nodeId = this.network.getNodeAt(pointer);

      if (!nodeId) return;

      const node = this.nodeSet.get(nodeId) as ExtendedNode;
      const isExpanded = this.groupExpandedState[nodeId] || false;
      if (!this.ruleSet.expandTrigger && !isExpanded) {
        return;
      }

      if (node?.isGroup && node.subNodes) {

        if (!isExpanded) {
          const centerPos = this.network.getPositions([nodeId])[nodeId];
          const radius = 200;

          const newEdges = this.rawEdges.filter(
            e => e.from === nodeId && node.subNodes!.includes(e.to as string)
          ).filter(e => !this.edgeSet.get(e.id!));

          const newNodes: ExtendedNode[] = [];

          node.subNodes.forEach((subId, index) => {
            if (this.nodeSet.get(subId)) return;

            const rawNode = this.rawNodes.find(n => n.id === subId);
            if (!rawNode) return;

            const angle = (2 * Math.PI * index) / (node.subNodes!.length || 1);
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
          this.edgeSet.add(newEdges);

          this.groupExpandedState[nodeId] = true;
          this.network.selectNodes([nodeId]);
          this.network.unselectAll();
        } else {
          const edgeIdsToRemove = this.rawEdges
            .filter(e => e.from === nodeId && node.subNodes!.includes(e.to as string))
            .map(e => e.id as string);

          this.edgeSet.remove(edgeIdsToRemove);

          node.subNodes.forEach(subId => {
            const remainingEdges = this.edgeSet.get({
              filter: edge => edge.from === subId || edge.to === subId
            });

            if (remainingEdges.length === 0 && this.nodeSet.get(subId)) {
              this.nodeSet.remove(subId);
            }
          });

          this.groupExpandedState[nodeId] = false;

          if (this.orignalColor) {
            this.nodeSet.update({
              id: nodeId,
              color: this.orignalColor
            });
          }
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

          if (this.ruleSet.edgeHighlight) {
            const highlightEdges = connectedEdges
              .filter(e => e.id)
              .map(e => ({
                id: e.id!,
                color: {color: 'yellow'},
                width: 3
              }));
            this.edgeSet.update(highlightEdges);
          }

          this.highlightedNodeId = String(nodeId);
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


  showContextMenu(x: number, y: number, node: ExtendedNode) {
    const menu = document.getElementById('customContextMenu');
    if (!menu) return;
    const nodeId = node?.id;
    if (node) {
      if (node.color) {
        this.orignalColor = node.color;
      }
    }
    if (node && (typeof node.id === 'string')) {
      menu.style.display = 'block';
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      this.contextMenuNodeId = node.id;
      this.contextMenuNode = node;
      if (node.color) {
        this.orignalColor = node.color;
      }
      this.nodeSet.update({
        id: nodeId,
        color: '#FFFFFF',
      });
    }
  }

  hideContextMenu() {
    const menu = document.getElementById('customContextMenu');
    const listingMenu = document.getElementById('contextMenu');
    if (listingMenu) listingMenu.style.display = "none";
    if (menu) {
      menu.style.display = 'none';
      if (this.contextMenuNodeId) {
        this.nodeSet.update({
          id: this.contextMenuNodeId,
          color: this.orignalColor
        });
      }
    }
  }

  expandGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id;

    if (!nodeId || !node.subNodes) return;

    const subNodes = node.subNodes;

    const isExpanded = this.groupExpandedState[nodeId] || false;
    if (isExpanded) return;

    const centerPos = this.network.getPositions([nodeId])[nodeId];
    const radius = 200;

    const newEdges = this.rawEdges.filter(
      e => e.from === nodeId && subNodes.includes(e.to as string)
    );
    this.edgeSet.add(newEdges);
    this.groupExpandedState[nodeId] = true;

    const newNodes: ExtendedNode[] = [];

    subNodes.forEach((subId, index) => {
      if (this.nodeSet.get(subId)) return;

      const rawNode = this.rawNodes.find(n => n.id === subId);
      if (!rawNode) return;

      const angle = (2 * Math.PI * index) / subNodes.length;
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
    this.hideContextMenu();
  }

  collapseGroupNode(): void {
    this.hideContextMenu();
    const node = this.contextMenuNode!;
    const nodeId = node.id;

    if (!nodeId) return;
    if (node.isGroup && node.subNodes && node.subNodes.length > 0) {
      const isExpanded = this.groupExpandedState[nodeId] || false;
      if (!isExpanded) return;
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

    } else {
      this.nodeSet.remove(nodeId);

      const connectedEdgeIds = this.rawEdges
        .filter(e => e.from === nodeId || e.to === nodeId)
        .map(e => e.id as string);

      this.edgeSet.remove(connectedEdgeIds);
    }
    this.hideContextMenu();
  }

  openCTI() {
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    const parts = this.contextMenuNodeId.split('/');
    const singleInput = parts[parts.length - 1];

    const params = new URLSearchParams({
      selectedType: 'document', singleInput: singleInput
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
    this.hideContextMenu();
  }

  copyNodeLabel(event: MouseEvent) {
    const _label = this.contextMenuNode?.label;
    if (_label) {
      this.clipboard.copy(_label);
      this.showCopiedMessage(event);
      this.hideContextMenu()
    }
  }

  viewReport() {
    this.hideContextMenu();

    const nodeId = this.contextMenuNodeId;
    const parts = nodeId.split('/');
    const singleInput = parts[parts.length - 1];

    let category = '';

    if (this.rawEdges.some(edge =>
      (edge.from === nodeId && edge.to === 'cti_vertices/general') ||
      (edge.to === nodeId && edge.from === 'cti_vertices/general')
    )) {
      category = 'general';
    } else if (this.rawEdges.some(edge =>
      (edge.from === nodeId && edge.to === 'cti_vertices/leak') ||
      (edge.to === nodeId && edge.from === 'cti_vertices/leak')
    )) {
      category = 'leak';
    } else if (this.rawEdges.some(edge =>
      (edge.from === nodeId && edge.to === 'cti_vertices/defacement') ||
      (edge.to === nodeId && edge.from === 'cti_vertices/defacement')
    )) {
      category = 'defacement';
    } else if (this.rawEdges.some(edge =>
      (edge.from === nodeId && edge.to === 'cti_vertices/chat') ||
      (edge.to === nodeId && edge.from === 'cti_vertices/chat')
    )) {
      category = 'chat';
    }

    if (category === 'leak') {
      const baseUrl = `${window.location.origin}/dashboard/breach/all/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'defacement') {
      const baseUrl = `${window.location.origin}/dashboard/defacement/archive/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'general') {
      const baseUrl = `${window.location.origin}/dashboard/strategic/all/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'chat') {
      const baseUrl = `${window.location.origin}/dashboard/social/telegram/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    }

    this.hideContextMenu();
  }

  showCopiedMessage(event: MouseEvent) {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();

    this.copiedX = buttonRect.right + 10;
    this.copiedY = buttonRect.top + window.scrollY;

    this.copied = true;

    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }


  onPhysicsToggled(enabled: boolean): void {
    this.physicsEnabled = enabled;
    if (this.network) {
      this.network.setOptions({physics: {enabled}});
    }
  }

  private physicsTimeoutId: any = null;

  onExpandToggled(enabled: boolean): void {
    this.expandEnabled = true
    if (this.physicsTimeoutId !== null) {
      clearTimeout(this.physicsTimeoutId);
      this.physicsTimeoutId = null;
    }

    if (!this.physicsEnabled && this.network) {
      this.network.setOptions({physics: {enabled: true}});
      this.network.stabilize();
      this.network.setOptions({physics: {enabled: false}});
      this.physicsEnabled = false;
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
          color: (extNode.id === "cti_vertices/" + this.singleInput)
            ? 'yellow'
            : {background: '#bf80ff', border: '#bf80ff'}
        });

        if (extNode.id === "cti_vertices/" + this.singleInput) {
          this.network.getConnectedEdges(extNode.id).forEach(id => {
            this.edgeSet.update({
              id,
              color: {color: 'yellow', highlight: 'yellow', hover: 'yellow'},
              dashes: true,
              width: 3
            });
          });
        }

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
          color: (node.id === "cti_vertices/" + this.singleInput)
            ? 'yellow'
            : {background: '#66ff66', border: '#66ff66'}
        });
      }
    });
  }

  onSidebarApply(filters: {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
  }): void {
    this.selectedType = filters.selectedType;
    this.singleInput = filters.singleInput;
    this.propertyType = filters.propertyType;
    this.propertyValue = filters.propertyValue;
    this.maxEdge = filters.maxEdge;
    this.maxDepth = filters.maxDepth;

    if (filters.selectedType === 'property' && filters.propertyType && filters.propertyValue) {
      this.loadGraphByNode(this.selectedType, filters.propertyType, filters.propertyValue, this.maxEdge.toString(), this.maxDepth.toString());
    } else if ((filters.selectedType === 'cluster' || filters.selectedType === 'document') && filters.singleInput) {
      this.loadGraphByNode(this.selectedType, filters.selectedType, filters.singleInput, this.maxEdge.toString(), this.maxDepth.toString());
    }
  }

  cleanString(input: string): string {
    const parts = input.replace(/['"]/g, '').split(',');

    const uniqueParts = Array.from(new Set(parts.map(part => part.trim())));

    return uniqueParts[0];
  }

  toggleEdgeArrows(enable: boolean): void {
    const allEdges = this.edgeSet.get();
    const updatedEdges = allEdges.map(edge => ({
      id: edge.id!,
      arrows: enable ? 'to' : '',
      ...(this.ruleSet.edgeColor ? {} : {color: {color: '#FFFFFF'}}),
    }));
    this.edgeSet.update(updatedEdges);
  }

  ruleSetChange(ruleSet: RuleSet) {
    this.toggleEdgeArrows(ruleSet.edgePointers)
  }

  onResetAll() {
    this.ngOnInit()
  }

}
