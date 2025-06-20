import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpParams} from '@angular/common/http';
import {ApiService} from '../../../services/api.service';

@Component({
  selector: 'app-report-mapping-list',
  templateUrl: './report-mapping-list.component.html',
  imports: [CommonModule],
})
export class ReportMappingListComponent implements OnInit {
  loading = false;
  result: any[] = [];
  filteredItems: any[] = [];

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.loadGraph();
  }

  loadGraph(): void {
    const parts = window.location.pathname.split('/');
    const value = parts[parts.length - 1];

    const params = new HttpParams()
      .set('data_point_type', 'document')
      .set('model_type', 'document')
      .set('query_value', value)
      .set('edge', '100')
      .set('depth', '2');

    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', {params}).subscribe({
      next: response => {
        const {results} = response;
        this.result = results;
        this.loading = true;
        this.getUniqueSortedItems(this.result, 500);
      }
    });
  }

  getUniqueSortedItems(result: any[], length: number) {
    const seenIds = new Set<string>();

    for (const item of result) {
      const id = this.extractId(item.edge?._id);
      const property = this.extractProperty(item.edge?._id);

      if (!id || !property || seenIds.has(id)) continue;

      seenIds.add(id);
      this.filteredItems.push(item);

      if (this.filteredItems.length >= length) break;
    }
  }

  viewReport(id: string) {
    const parts = window.location.pathname.split('/');
    const category = parts[parts.length - 3];
    const subCategory = parts[parts.length - 2];
    const baseUrl = `${window.location.origin}/dashboard/${category}/${subCategory}/${id}`;
    window.open(baseUrl, '_blank');
  }

  extractId(path: string): string {
    const match = path.match(/[a-f0-9]{64}/);
    return match ? match[0] : '';
  }

  extractProperty(id: string, mode: 'key' | 'value' = 'value'): string {
    const idTemp = this.extractId(id);
    const locationPoint = id.indexOf(idTemp) + idTemp.length + 1;

    if (locationPoint >= id.length) return '';

    const item = id.substring(locationPoint);
    const disallowedPrefixes = ['leak_to_', 'defacement_to_', 'chat_to_', 'general_to_'];
    if (disallowedPrefixes.some(prefix => item.startsWith(prefix))) return '';

    const segments = item.split('_');
    if (segments.length < 2 || !segments[0].startsWith('m')) return '';

    const key = segments.slice(0, 2).join('_');
    const value = segments.slice(2).join('_');

    if (mode === 'key') return key.replace(/^m_/, '').replaceAll('_', '');
    return value.replaceAll('_', ' ');
  }
}
