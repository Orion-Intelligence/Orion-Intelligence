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
  isEmpty = false;

  constructor(private api: ApiService, private route: ActivatedRoute,) {
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
    const params = new HttpParams().set('data_point_type', data_point_type).set('model_type', type).set('query_value', value);

    this.api.get<any[]>('graph', {params}).subscribe({
      next: data => this.renderGraph(data, type, value),
      error: err => console.error('❌ Request failed:', err),
    });
  }

  private _sanitize(value: string): string {
    return value
      .replace(/ /g, "_")
      .replace(/[^a-zA-Z0-9_\-\.@()+,=;$!*'%:]/g, '')
      .toLowerCase();
  }

  renderGraph(data: any[], queryType: string, queryValue: string): void {
    this.isEmpty = data.length <= 0;
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();
    const nodeMap = new Map<string, Node>();

    const centralId = `cti_vertices/${queryType === 'property' ? queryValue : `${queryType}:${queryValue}`}`;

    data.forEach(item => {
      const vertex = item.vertex;
      const nodeId = vertex._id;

      let label: string;
      if (vertex.type === 'cluster') label = vertex._key;
      else if (vertex.type === 'document') label = vertex.m_document_id.substring(0, 8) + '...';
      else if (vertex.value) label = this._sanitize(vertex.value).toUpperCase();
      else label = vertex._key;

      const isCenter = nodeId === centralId;

      const node: Node = {
        id: nodeId,
        label,
        color: isCenter ? 'yellow' : '#40bf40',
        shape: 'dot',
        font: {
          size: 14,
          color: '#FFFFFF',
          background: '#000',
          strokeWidth: 0
        },
        size: isCenter ? 30 : 20,
        x: isCenter ? 0 : undefined,
        y: isCenter ? 0 : undefined
      };

      nodeMap.set(nodeId, node);
    });

    data.forEach(item => {
      const edge = item.edge;
      if (!edge) return;

      const fromId = edge._from;
      const toId = edge._to;

      if (!nodeMap.has(fromId)) {
        nodeMap.set(fromId, {
          id: fromId,
          label: fromId,
          color: 'yellow',
          shape: 'dot',
          font: {
            size: 14,
            color: '#FFFFFF',
            background: '#000',
            strokeWidth: 0
          },
          size: 20
        });
      }

      const centralIdNormalized = this._sanitize(centralId.toLowerCase());
      const isCenter = toId.toLowerCase() === centralIdNormalized || toId.includes(centralIdNormalized.split("all:")[1]) || toId.includes(centralIdNormalized.split("document:")[1]);

      nodeMap.set(toId, {
        id: toId,
        label: toId,
        color: isCenter ? 'yellow' : (toId.includes('cti_vertices/') && toId.split('/')[1].length === 64 ? '#FF6666' : '#538cc6'),
        shape: 'dot',
        font: {
          size: 14,
          color: '#FFFFFF',
          background: '#000',
          strokeWidth: 0
        },
        size: isCenter ? 30 : 20,
      });

      const edgeColor = isCenter ? 'yellow' : '#FFFFFF';
      if (isCenter) {
        edges.add({
          from: toId,
          to: fromId,
          arrows: {to: {enabled: false}},
          color: {color: edgeColor},
          width: 4
        });
      } else {
        edges.add({
          from: fromId,
          to: toId,
          arrows: 'to',
          color: {color: edgeColor},
          width: 2
        });
      }
    });
    nodes.add(Array.from(nodeMap.values()));

    const container = this.networkContainer.nativeElement;
    this.network = new Network(container, {nodes, edges}, {
      physics: {
        enabled: this.physicsEnabled,
        solver: 'forceAtlas2Based',
        timestep: 1,
        stabilization: {
          iterations: 20,
          fit: true
        },
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
        font: {
          size: 14,
          color: '#FFFFFF'
        }
      },
      layout: {
        randomSeed: 42
      },
      interaction: {
        selectConnectedEdges: false
      }
    });

    this.network.on('selectNode', (params: any) => {
      const connectedEdges = this.network.getConnectedEdges(params.nodes[0]);

      edges.forEach((edge: any) => {
        edges.update({id: edge.id, color: {color: '#FFFFFF'}, width: 2});
      });

      (connectedEdges as (string | number)[]).forEach(edgeId => {
        edges.update({id: edgeId, color: {color: 'yellow'}, width: 3});
      });
    });

    this.network.on('deselectNode', () => {
      edges.forEach((edge: any) => {
        edges.update({id: edge.id, color: {color: '#FFFFFF'}, width: 2});
      });
    });

    const searchNodeId = nodes.getIds().find(id => nodeMap.get(String(id))?.color === 'yellow');
    if (searchNodeId !== undefined) {
      this.network.focus(String(searchNodeId), {
        scale: 1.0,
        animation: true
      });
    }
  }


  onPhysicsToggled(enabled: boolean): void {
    this.physicsEnabled = enabled;
    if (this.network) {
      this.network.setOptions({physics: {enabled}});
    }
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
