import {Component,Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataAccordianComponent} from './data-accordian/data-accordian.component'

@Component({
  selector: 'app-data-insight',
  imports: [
    CommonModule,
    DataAccordianComponent,
  ],
  templateUrl: './data-insight.component.html'
})
export class DataInsightComponent {
  @Input() analytics: any;

  categories = [
    { key: 'm_urls', label: 'Unique Urls', icon: 'assets/images/dashboard-report/uniqueUrl.svg' },
    { key: 'm_emails', label: 'Unique Emails', icon: 'assets/images/dashboard-report/search_side_email_icon.svg' },
    { key: 'mPhoneNumber', label: 'Unique Cellular', icon: 'assets/images/dashboard-report/document_count.svg' },
    { key: 'mArchiveUrl', label: 'Unique Archives', icon: 'assets/images/dashboard-report/document_count.svg' },
    { key: 'mName', label: 'Unique Names', icon: 'assets/images/dashboard-report/document_count.svg' },
    { key: 'm_document', label: 'Unique Documents', icon: 'assets/images/dashboard-report/document_count.svg' }
  ];
}
