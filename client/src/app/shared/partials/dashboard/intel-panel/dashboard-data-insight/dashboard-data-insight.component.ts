import {Component,Input} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-dashboard-data-insight',
  imports: [
    CommonModule,
    NgOptimizedImage
  ],
  templateUrl: './dashboard-data-insight.component.html',
  styleUrl: './dashboard-data-insight.component.css'
})
export class DashboardDataInsightComponent {
  @Input() analytics: any;

  categories = [
    {key: 'm_emails', label: 'Unique Emails'},
    {key: 'mPhoneNumber', label: 'Unique Cellular'},
    {key: 'mArchiveUrl', label: 'Unique Archives'},
    {key: 'mName', label: 'Unique Names'},
    {key: 'm_document', label: 'Unique Documents'}
  ];
}
