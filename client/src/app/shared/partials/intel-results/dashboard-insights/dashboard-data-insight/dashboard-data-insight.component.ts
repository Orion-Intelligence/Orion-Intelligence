import {Component,Input} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {DataAccordianComponent} from './data-accordian/data-accordian.component'

@Component({
  selector: 'app-dashboard-data-insight',
  imports: [
    CommonModule,
    NgOptimizedImage,
    DataAccordianComponent,
  ],
  templateUrl: './dashboard-data-insight.component.html',
  styleUrl: './dashboard-data-insight.component.css'
})
export class DashboardDataInsightComponent {
  @Input() analytics: any;

  categories = [
    { key: 'm_urls', label: 'Unique Urls' },
    { key: 'm_emails', label: 'Unique Emails' },
    { key: 'mPhoneNumber', label: 'Unique Cellular' },
    { key: 'mArchiveUrl', label: 'Unique Archives' },
    { key: 'mName', label: 'Unique Names' },
    { key: 'm_document', label: 'Unique Documents' }
  ];
}
