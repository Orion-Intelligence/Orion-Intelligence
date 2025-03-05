import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-general-results-grid',
  templateUrl: './dashboard-general-results-grid.component.html',
  imports: [
    NgForOf
  ]
})
export class DashboardGeneralResultsGridComponent {
  constructor(public dashboardService:DashboardService) {
  }
}
