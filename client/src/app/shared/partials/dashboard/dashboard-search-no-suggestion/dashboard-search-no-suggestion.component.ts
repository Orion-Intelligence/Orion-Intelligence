import { Component } from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {AsyncPipe, NgIf} from '@angular/common';
import {Category} from '../../../../pages/dashboard/enums/pages';

@Component({
  selector: 'app-dashboard-search-no-suggestion',
  imports: [
    AsyncPipe
  ],
  templateUrl: './dashboard-search-no-suggestion.component.html',
})
export class DashboardSearchNoSuggestionComponent {

  constructor(public dashboardService: DashboardService) {
  }

  protected readonly category = Category;
}
