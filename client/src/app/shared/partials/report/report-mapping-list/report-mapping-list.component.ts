import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { AuthService } from '../../../../services/authetication/auth.service';
import { SafeZoneProComponent } from "../../safe-zone-pro/safe-zone-pro.component";
import { Observable } from 'rxjs';

@Component({
  selector: 'app-report-mapping-list',
  templateUrl: './report-mapping-list.component.html',
  imports: [CommonModule, TooltipDirective, SafeZoneProComponent],
  animations: [fadeInDashboardItem],
})
export class ReportMappingListComponent implements OnInit {
  loading = true;
  result: any[] = [];
  filteredItems: any[] = [];
  isExpanded = false;
  username$!: Observable<string | null>;
  role$!: Observable<string | null>;
  showSubscriptionPopup = false;

  constructor(private api: ApiService, protected authService: AuthService) {
    this.username$ = this.authService.getUsername$();
    this.role$ = this.authService.getRole$();
  }

  ngOnInit(): void {
  }
  isAdmin(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'admin';
  }
  toggleContent(): void {
    if (!this.isAdmin()) {
      this.showSubscriptionPopup = true;
      return;
    }
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded && this.filteredItems.length == 0) {
      this.loadGraph();
    }
  }
  onSubscriptionPopupClose() {
    this.showSubscriptionPopup = false;
  }

  loadGraph(): void {
    const parts = window.location.pathname.split('/');
    const value = parts[parts.length - 1];

    const params = new HttpParams()
      .set('data_point_type', 'document')
      .set('model_type', 'document')
      .set('query_value', value)
      .set('edge', '25')
      .set('depth', '2');
    this.loading = true;
    this.api.get<{ results: any[]; limit_reached: boolean }>('graph', { params }).subscribe({
      next: response => {
        const { results } = response;
        this.result = results;
        this.loading = false;
        this.getUniqueSortedItems(this.result, 25);
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
