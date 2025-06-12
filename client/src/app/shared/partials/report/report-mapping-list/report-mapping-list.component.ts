import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-report-mapping-list',
  templateUrl: './report-mapping-list.component.html',
  imports: [CommonModule],
})
export class ReportMappingListComponent {
  loading = false
  result: any[] = []
  filteredItems: any[] = [];
  loopCount = Array.from({ length: 10 }, (_, i) => i);

  constructor(private api: ApiService, private route: ActivatedRoute,) {
  }

  ngOnInit(): void {
    const parts = window.location.pathname.split('/');
    const singleInput = parts[parts.length - 1];
    this.loadGraph('document', 'document', singleInput, '10', '1');

  }

  loadGraph(data_point_type: string, type: string, value: string, maxEdge: string, maxDepth: string): void {
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

    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', { params }).subscribe({
      next: response => {
        const { results, limit_reached } = response;
        this.result = results;
        this.loading = true;

        results.forEach(item => {
          const doc = item.vertex;
          if (doc?.type === 'document') {
            const docId = doc.m_document_id || doc._key;
            const docType = doc.type;

            // Object.entries(doc).forEach(([key, value]) => {
            //   if (key.startsWith('m_') && Array.isArray(value)) {
            //     value.forEach(val => {
            //       this.flattenedDocuments.push({
            //         m_document_id: docId,
            //         type: docType,
            //         property: key,
            //         value: val
            //       });
            //     });
            //   }
            // });
          }
        });
        this.getUniqueSortedItems(this.result, 10)
      }
    });
  }
  getUniqueSortedItems(result: any[], length: number) {
    const seenIds = new Set<string>();
    // const filteredItems: any[] = [];

    for (const item of result) {
      const id = this.extractId(item.edge?._id);
      const property = this.extractProperty(item.edge?._id);

      if (!id || !property || seenIds.has(id)) continue;

      seenIds.add(id);
      this.filteredItems.push(item);

      if (this.filteredItems.length >= length) break;
    }

    //return this.filteredItems;
  }
  viewReport(id: string) {
    const parts = window.location.pathname.split('/');
    const category = parts[parts.length - 3];
    const subCategory = parts[parts.length - 2];
    const singleInput = id;


    const baseUrl = `${window.location.origin}/dashboard/${category}/${subCategory}/${singleInput}`;
    const fullUrl = `${baseUrl}`;
    window.open(fullUrl, '_blank');

  }
  extractId(path: string): string {
    const match = path.match(/[a-f0-9]{64}/);
    return match ? match[0] : '';
  }
  extractProperty(id: string): string {
    let id_temp = this.extractId(id)
    let location_point = id.indexOf(id_temp) + id_temp.length + 1
    let item = id.substring(location_point)
    item = item.replace(/^m/, '');
    item = item.replaceAll("_", " ")
    return item
  }


  formatPropertyName(name: string): string {
    return name.replace(/^m_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
