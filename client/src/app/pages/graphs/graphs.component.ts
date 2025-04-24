import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {ApiService} from '../../shared/services/api.service';
import {Network, DataSet, Node, Edge} from 'vis-network/standalone';
import {FormsModule} from '@angular/forms';
import {NgIf, NgFor} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-graphs',
  standalone: true,
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css'],
  imports: [FormsModule, NgIf, NgFor]
})
export class GraphComponent implements OnInit {
  @ViewChild('networkContainer', {static: true}) networkContainer!: ElementRef;

  network!: Network;

  selectedType = 'cluster';
  singleInput = 'general';
  propertyType = 'm_email_addresses';
  propertyValue = '';

  clusterOptions = ['general', 'leak', 'defacement'];

  allowedProperties = [
    {label: 'Email Addresses', key: 'm_email_addresses'},
    {label: 'Phone Numbers', key: 'm_phone_numbers'},
    {label: 'States', key: 'm_states'},
    {label: 'Location Info', key: 'm_location_info'},
    {label: 'Social Media Profiles', key: 'm_social_media_profiles'},
    {label: 'Name', key: 'm_name'},
    {label: 'Industry', key: 'm_industry'},
    {label: 'Company Name', key: 'm_company_name'},
    {label: 'Country Name', key: 'm_country_name'},
    {label: 'IP', key: 'm_ip'}
  ];

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'general';
      this.propertyType = params['propertyType'] || 'm_email_addresses';
      this.propertyValue = params['propertyValue'] || '';

      if (this.selectedType === 'property' && this.propertyType && this.propertyValue) {
        this.loadGraphByNode(this.propertyType, this.propertyValue);
      } else if ((this.selectedType === 'cluster' || this.selectedType === 'document') && this.singleInput) {
        this.loadGraphByNode(this.selectedType, this.singleInput);
      }
    });
  }

  search(): void {
    let type = '';
    let value = '';

    if (this.selectedType === 'property' && this.propertyType && this.propertyValue) {
      type = this.propertyType;
      value = this.propertyValue;
    } else if ((this.selectedType === 'cluster' || this.selectedType === 'document') && this.singleInput) {
      type = this.selectedType;
      value = this.singleInput;
    }

    if (type && value) {
      this.router.navigate([], {
        queryParams: {
          selectedType: this.selectedType,
          singleInput: this.singleInput,
          propertyType: this.propertyType,
          propertyValue: this.propertyValue
        }
      }).then();

      this.loadGraphByNode(type, value);
    }
  }

  loadGraphByNode(type: string, value: string): void {
    const params = new HttpParams()
      .set('model_type', type)
      .set('query_value', value);

    this.api.get<any[]>('graph', {params}).subscribe({
      next: (data) => {
        this.renderGraph(data, type, value);
      },
      error: (err) => {
        console.error('❌ Request failed:', err);
      }
    });
  }

  renderGraph(data: any[], queryType: string, queryValue: string): void {
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();
    const nodeMap = new Map<string, Node>();

    data.forEach(item => {
      const vertex = item.vertex;
      const nodeId = vertex._id;

      let label = '';
      let color = '#AAAAAA';

      if (vertex.type === 'cluster') {
        label = vertex._key;
      } else if (vertex.type === 'document') {
        label = vertex.m_document_id.substring(0, 8) + '...';
      } else if (vertex.type === 'm_location_info') {
        label = vertex.value.replace('_', ' ').toUpperCase();
      }

      const isCenter =
        (queryType === 'cluster' && vertex._key === queryValue) ||
        (queryType === 'document' && vertex.m_document_id === queryValue) ||
        (queryType === 'm_location_info' && vertex.value === queryValue);

      const node: Node = {
        id: nodeId,
        label,
        color: isCenter ? 'yellow' : '#FFF',
        shape: 'dot',
        font: {size: 14, color: '#FFFFFF'},
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
          label: fromId.split('/')[1],
          color: '#AAAAAA',
          shape: 'dot',
          font: {size: 14, color: '#FFFFFF'}
        });
      }

      const isCenter = queryType === 'm_location_info' && toId.toLowerCase() === `cti_vertices/m_location_info:${queryValue.toLowerCase()}`;

      nodeMap.set(toId, {
        id: toId,
        label: toId.split(':')[1]?.replace(/_/g, ' ').toUpperCase() || toId,
        color: isCenter ? 'yellow' : (toId.includes('cti_vertices/') && toId.split('/')[1].length === 64 ? '#FF6666' : '#538cc6'),
        shape: 'dot',
        font: {size: 14, color: '#FFFFFF'},
        size: isCenter ? 30 : 20,
        x: isCenter ? 0 : undefined,
        y: isCenter ? 0 : undefined
      });

      if (isCenter) {
        edges.add({
          from: toId,
          to: fromId,
          arrows: 'to',
          color: {color: '#FFFFFF'},
          width: 2
        });
      }else {
      edges.add({
        from: toId,
        to: fromId,
        arrows: 'to',
        color: {color: '#FFFFFF'},
        width: 2
      });
      }
    });

    nodes.add(Array.from(nodeMap.values()));

    const container = this.networkContainer.nativeElement;
    const networkData = {nodes, edges};
    const options = {
      physics: {enabled: false},
      edges: {
        arrows: {to: {enabled: true, scaleFactor: 1}},
        color: {color: '#FFFFFF'},
        width: 2
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: {size: 14, color: '#FFFFFF'}
      },
      layout: {
        randomSeed: 42
      }
    };

    this.network = new Network(container, networkData, options);

    const searchNodeId = nodes.getIds().find(id => nodeMap.get(String(id))?.color === 'yellow');
    if (searchNodeId !== undefined) {
      this.network.focus(String(searchNodeId), {
        scale: 1.0,
        animation: true
      });
    }
  }
}
