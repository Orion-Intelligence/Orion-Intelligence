import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  DashboardSearchGeneralIntelligenceComponent
} from '../dashboard-search-general-intelligence/dashboard-search-general-intelligence.component';

@Component({
  selector: 'app-dashboard-search-content-items',
  imports: [
    CommonModule,
    DashboardSearchGeneralIntelligenceComponent
  ],
  templateUrl: './dashboard-search-content-items.component.html',
  styleUrl: './dashboard-search-content-items.component.css'
})
export class DashboardSearchContentItemsComponent {
  @Input() selectedSection!: string;
}
