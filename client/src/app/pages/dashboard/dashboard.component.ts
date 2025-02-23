import { Component } from '@angular/core';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import {DashboardSideBarComponent} from '../../shared/partials/dashboard/dashboard-side-bar/dashboard-side-bar.component';
import {DashboardPaginationComponent} from '../../shared/partials/dashboard/dashboard-pagination/dashboard-pagination.component';
import {DashboardNoSuggestionComponent} from '../../shared/partials/dashboard/dashboard-no-suggestion/dashboard-no-suggestion.component';
import {DashboardSearchContentItemComponent} from '../../shared/partials/dashboard/dashboard-search-content-item/dashboard-search-content-item.component';
import {DashboardSafeSearchComponent} from '../../shared/partials/dashboard/dashboard-safe-search/dashboard-safe-search.component';
import {DashboardSearchPersonaResultComponent} from '../../shared/partials/dashboard/dashboard-search-persona-result/dashboard-search-persona-result.component'
  ;
import {NgOptimizedImage} from '@angular/common';
@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardHeaderComponent,
    DashboardSideBarComponent,
    DashboardSafeSearchComponent,
    DashboardPaginationComponent,
    DashboardNoSuggestionComponent,
    DashboardSearchContentItemComponent,
    DashboardSearchPersonaResultComponent,
    NgOptimizedImage
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

}
