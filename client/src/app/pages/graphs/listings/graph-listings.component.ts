import { Component, Input, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-listings',
  imports: [NgFor, NgIf, FormsModule, TooltipDirective],
  templateUrl: './graph-listings.component.html',
  animations: [fadeInDashboardItem]
})
export class GraphListingsComponent implements OnInit {
  @Input() result: any[] = [];

  collapseToggle = false;
  searchText = '';
  copied = false;
  copiedX = 0;
  copiedY = 0;
  showResults = false;

  ngOnInit(): void {
    this.showResults = true;
    this.flattenResult();
  }

  flattenResult(): void {
    this.result = this.result.flatMap(item => {
      const doc = item.vertex;
      if (!doc || doc.type !== 'document') return [];

      const docId = doc.m_document_id || doc._key;
      const docType = doc.type;

      return Object.entries(doc).flatMap(([key, value]) => {
        if (key.startsWith('m_') && Array.isArray(value)) {
          return value.map(val => ({
            m_document_id: docId,
            type: docType,
            property: key,
            value: val
          }));
        }
        return [];
      });
    });
  }

  toggleCollapse() {
    this.collapseToggle = !this.collapseToggle;
  }

  onSearchClick(): any[] {
    const query = this.searchText.toLowerCase();

    if (!query) {
      return this.result.slice(0, 25);
    }

    return this.result.filter(doc => {
      return (
        doc.m_document_id?.toLowerCase().includes(query) ||
        doc.property?.toLowerCase().includes(query) ||
        doc.value?.toLowerCase().includes(query)
      );
    }).slice(0, 25);
  }

  formatPropertyName(name: string): string {
    return name.replace(/^m_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  viewReport(doc_id: string, path: string): void {
    if (!doc_id || !path) return;
    const url = `${window.location.origin}/dashboard/${path}/${doc_id}`;
    window.open(url, '_blank');
  }
}
