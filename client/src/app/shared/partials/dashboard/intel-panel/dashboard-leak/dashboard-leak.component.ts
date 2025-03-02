import {Component, OnInit} from '@angular/core';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {Router} from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {DashboardSearchNoSuggestionComponent} from '../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {DashboardResultsGridComponent} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';

@Component({
  selector: 'app-dashboard-leak',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    DashboardSearchNoSuggestionComponent,
    DashboardResultsGridComponent,
    DashboardPaginationComponent,
    NgOptimizedImage
  ],
  templateUrl: './dashboard-leak.component.html'
})
export class DashboardLeakComponent implements OnInit {
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  isSearchSuccessful: boolean = false;
  isResultEmpty: boolean = true;

  constructor(public dashboardService: DashboardService, private router: Router) {
  }

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value;
    this.fetchSearchResults();
  }

  fetchSearchResults() {
    this.isResultEmpty = true
    this.dashboardService.fetchLeakSearchResults().subscribe(response => {
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
      queryParams: {q: this.searchQuery},
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
