import { Component } from '@angular/core';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard-api',
  imports: [
    FormsModule
  ],
  templateUrl: './dashboard-api.component.html',
  styleUrl: './dashboard-api.component.css'
})
export class DashboardApiComponent {
  ery: string = '';
  searchQuery: string = '';
  email: any;
  username: any;

  constructor(public dashboardService: DashboardService) {
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.dashboardService.searchGeneralParamModel.q = this.searchQuery.trim();
      // this.dashboardService.fetchGeneralResults().subscribe();
    }
  }
}
