import {Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {
  DashboardSearchNoSuggestionComponent
} from '../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {Subject} from 'rxjs';
import {fadeAnimation} from '../../../../animations/animations';
import {
  DashboardResultsGridComponent
} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import {Router} from '@angular/router';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, DashboardSearchNoSuggestionComponent, DashboardResultsGridComponent, DashboardPaginationComponent, DashboardPaginationComponent],
  templateUrl: './dashboard-general.component.html',
  animations: [fadeAnimation],
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral implements OnInit {
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  isSearchSuccessful: boolean = false;
  isResultEmpty: boolean = true;

  constructor(public dashboardService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value;
    this.fetchSearchResults();
  }

  fetchSearchResults() {
    this.isResultEmpty = true
    this.dashboardService.fetchGeneralSearchResults().subscribe(response => {
      this.isSearchSuccessful = response.success;
      this.isResultEmpty = response.isEmpty;
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFormSubmit(): void {
    this.dashboardService.searchGeneralParamModel.q = this.searchQuery;
    this.dashboardService.searchQuery$.next(this.searchQuery);
    this.router.navigate([], {
      queryParams: { q: this.searchQuery },
      queryParamsHandling: 'merge'
    }).then();
    this.fetchSearchResults();
  }

  onPageChange(step: number) {
    this.dashboardService.searchGeneralParamModel.mSearchParamPage = step;
    this.onFormSubmit();
  }

  protected readonly Math = Math;
}
