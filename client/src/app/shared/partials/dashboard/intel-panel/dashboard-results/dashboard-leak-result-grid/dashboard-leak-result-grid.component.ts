import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-leak-result-grid', imports: [NgForOf],
  templateUrl: './dashboard-leak-result-grid.component.html',
})
export class DashboardLeakResultGridComponent {
  constructor(public dashboardService:DashboardService) {
  }
}
