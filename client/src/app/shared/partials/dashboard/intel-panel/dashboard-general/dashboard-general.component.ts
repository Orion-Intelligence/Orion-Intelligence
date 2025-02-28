import {Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpParams} from '@angular/common/http';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {
  DashboardSearchNoSuggestionComponent
} from '../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {Subject, tap, catchError, of} from 'rxjs';
import {ApiService} from '../../../../services/api.service';
import {SearchGeneralCallbackModel} from '../../../../../services/dashboard/models/search_general_callback_model';
import {fadeAnimation} from '../../../../animations/animations';
import {
  DashboardResultsGridComponent
} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule, DashboardSearchNoSuggestionComponent, DashboardResultsGridComponent],
  templateUrl: './dashboard-general.component.html',
  animations: [fadeAnimation],
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral implements OnInit {
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  isSearchSuccessful: boolean = false;
  isResultEmpty: boolean = false;

  constructor(public dashboardService: DashboardService, private apiService: ApiService, private router: Router) {
  }

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value
    this.fetchSearchResults()
  }

  fetchSearchResults() {
    const params = new HttpParams({fromObject: this.dashboardService.searchGeneralParamModel as any});

    this.apiService.get<SearchGeneralCallbackModel>('search/general', {params}).pipe(
      tap(response => {
        this.dashboardService.searchGeneralCallbackModel = new SearchGeneralCallbackModel(response);

        this.isSearchSuccessful = true;
        this.isResultEmpty = this.dashboardService.searchGeneralCallbackModel.Result.length === 0;
      }),
      catchError(_ => {
        this.isSearchSuccessful = false;
        this.isResultEmpty = false;
        return of(null);
      })
    ).subscribe();
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFormSubmit(event: Event): void {
    this.dashboardService.searchGeneralParamModel.q = this.searchQuery;
    this.dashboardService.searchQuery$.next(this.searchQuery);
    this.router.navigate([], {
      queryParams: { q: this.searchQuery },
      queryParamsHandling: 'merge' // Keeps existing query params intact
    }).then();
    event.preventDefault();
    this.fetchSearchResults();
  }
}
