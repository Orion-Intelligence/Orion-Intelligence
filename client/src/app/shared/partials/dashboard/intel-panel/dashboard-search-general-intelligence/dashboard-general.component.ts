import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-general.component.html',
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral {

  activeSection: number | null = null; // No section open by default

  toggleSection(section: number) {
    this.activeSection = this.activeSection === section ? null : section; // Toggle logic
  }

  constructor(public dashboardService: DashboardService) {
    if (this.dashboardService.searchGeneralCallbackModel?.Result?.length > 0) {
      console.log(this.dashboardService.searchGeneralCallbackModel.Result[0].m_content);
    } else {
      console.log('searchGeneralCallbackModel is undefined or Result array is empty');
    }
  }

  items = Array.from({length: 10}).map((_, i) => ({
    header: `Header ${i + 1}`,
    description: `Description ${i + 1}`,
    url: `https://example.com/page${i + 1}`,
    publishedOn: `2025-02-${10 + i}`,
    network: `Network ${i + 1}`,
    updatedOn: `2025-02-${15 + i}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));

  protected readonly JSON = JSON;
}
