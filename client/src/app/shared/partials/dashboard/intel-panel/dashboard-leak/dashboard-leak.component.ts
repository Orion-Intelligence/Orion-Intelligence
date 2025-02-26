import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-leak',
  imports: [
    NgForOf
  ],
  templateUrl: './dashboard-leak.component.html',
  styleUrl: './dashboard-leak.component.css'
})
export class DashboardLeakComponent {
  constructor(public dashboardService: DashboardService) {
  }
}
