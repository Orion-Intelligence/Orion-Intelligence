import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-results-grid',
  templateUrl: './dashboard-results-grid.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./dashboard-results-grid.component.css']
})
export class DashboardResultsGridComponent {
  constructor(public dashboardService:DashboardService) {
  }

  // protected readonly it = it;
}
