import { Component } from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-dashboard-search-no-suggestion',
  imports: [
    AsyncPipe
  ],
  templateUrl: './dashboard-search-no-suggestion.component.html',
  styleUrl: './dashboard-search-no-suggestion.component.css'
})
export class DashboardSearchNoSuggestionComponent {
  constructor(public dashboardService: DashboardService) {
  }
}
