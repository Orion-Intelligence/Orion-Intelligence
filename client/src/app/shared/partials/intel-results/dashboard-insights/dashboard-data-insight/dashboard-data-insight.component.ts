import {Component,Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataAccordianComponent} from './data-accordian/data-accordian.component'

@Component({
  selector: 'app-dashboard-data-insight',
  imports: [
    CommonModule,
    DataAccordianComponent,
  ],
  templateUrl: './dashboard-data-insight.component.html'
})
export class DashboardDataInsightComponent {
  @Input() analytics: any;

  categories = [
    { key: 'm_urls', label: 'Unique Urls', icon: 'assets/images/shared/uniqueUrl.svg' },
    { key: 'm_emails', label: 'Unique Emails', icon: 'assets/images/shared/search_side_email_icon.svg' },
    { key: 'mPhoneNumber', label: 'Unique Cellular', icon: 'assets/images/shared/document_count.svg' },
    { key: 'mArchiveUrl', label: 'Unique Archives', icon: 'assets/images/shared/document_count.svg' },
    { key: 'mName', label: 'Unique Names', icon: 'assets/images/shared/document_count.svg' },
    { key: 'm_document', label: 'Unique Documents', icon: 'assets/images/shared/document_count.svg' }
  ];
}
