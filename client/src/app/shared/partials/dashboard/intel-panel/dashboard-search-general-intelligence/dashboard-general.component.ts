import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-general.component.html',
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral {

  constructor(public dashboardService: DashboardService) {
  }

  items = Array.from({ length: 10 }).map((_, i) => ({
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
