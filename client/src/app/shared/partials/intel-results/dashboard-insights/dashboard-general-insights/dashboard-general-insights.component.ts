import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-dashboard-general-insights',
  templateUrl: './dashboard-general-insights.component.html',
  imports: [
    CommonModule,
    NgOptimizedImage
  ]
})
export class DashboardGeneralInsightsComponent implements OnChanges {
  @Input() analytics: any;

  sections: Array<{ title: string; items: any[] }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analytics'] && this.analytics) {
      this.initializeSections();
    }
  }

  initializeSections(): void {
    this.sections = [
      {
        title: 'Keyword Insights',
        items: [
          { label: 'Total Found', value: this.analytics.total_p_document_list_length },
          { label: 'Documents', value: this.analytics.m_documents_length },
          { label: 'Links', value: this.analytics.m_clearnet_links_count },
          { label: 'Pages', value: this.analytics.m_pages }
        ]
      },
      {
        title: 'Results General Coverage',
        items: [
          { label: 'Total Found', value: this.analytics.total_p_document_list_length },
          { label: 'Active', value: this.analytics.active_links, spanClass: 'search-insights__active-span' },
          { label: 'Inactive', value: this.analytics.inactive_links, spanClass: 'search-insights__inactive-span' },
          { label: 'Seldom Active', value: this.analytics.seldom_active_links, spanClass: 'search-insights__seldom-active-span' }
        ]
      }
    ];
  }
}
