import {Component} from '@angular/core';
import {DashboardDataInsightComponent} from './dashboard-data-insight/dashboard-data-insight.component';
import {DashboardGeneralInsightsComponent} from './dashboard-general-insights/dashboard-general-insights.component';
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
  analytics = {
    unique_urls: [
      {m_title: 'Example Title', m_url: 'https://example.com'}
    ],
    total_p_document_list_length: 123,
    m_documents_length: 50,
    m_clearnet_links_count: 30,
    active_links: 20,
    inactive_links: 5,
    seldom_active_links: 10,
    m_emails: ['test@example.com'],
    mPhoneNumber: ['123-456-7890'],
    mArchiveUrl: ['https://archive.com'],
    mName: ['John Doe'],
    m_document: ['Document 1']
  };
}
