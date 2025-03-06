import { Component } from '@angular/core';
import { DashboardDataInsightComponent } from './dashboard-data-insight/dashboard-data-insight.component';
import { DashboardGeneralInsightsComponent } from './dashboard-general-insights/dashboard-general-insights.component';
import { Analytics } from './analytics.model';

@Component({
  selector: 'app-dashboard-insights',
  imports: [
    DashboardDataInsightComponent,
    DashboardGeneralInsightsComponent
  ],
  templateUrl: './dashboard-insights.component.html',
  styleUrl: './dashboard-insights.component.css'
})
export class DashboardInsightsComponent {
  mSearchCallbackRelevantSearchType = 'general'; // Example value

  analytics: Analytics = {
    unique_urls: [
      { m_title: 'Example Title 1', m_url: 'https://example1.com' },
      { m_title: 'Example Title 2', m_url: 'https://example2.com' }
    ],
    total_p_document_list_length: '123',
    m_documents_length: '50',
    m_clearnet_links_count: '30',
    active_links: '20',
    inactive_links: '5',
    seldom_active_links: '10',
    m_urls: ['example1.com', 'example2.com'],
    m_emails: ['test1@example.com', 'test2@example.com'],
    mPhoneNumber: ['123-456-7890', '098-765-4321'],
    mArchiveUrl: ['https://archive1.com', 'https://archive2.com'],
    mName: ['John Doe', 'Jane Doe'],
    m_document: ['Document 1', 'Document 2']
  };
}
