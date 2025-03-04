import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { Subject } from 'rxjs';
import {DashboardResultsGridComponent} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import {DashboardSearchNoSuggestionComponent} from '../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {fadeDashboardItem} from '../../../../../pages/app/animations/dashboard-item.animations';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  templateUrl: './dashboard-general.component.html',
  styleUrls: ['./dashboard-general.component.css'],
  animations: [fadeDashboardItem],
  imports: [CommonModule, DashboardResultsGridComponent, DashboardSearchNoSuggestionComponent, DashboardPaginationComponent, FormsModule, NgOptimizedImage] // ✅ Required for ngIf and animations to work in standalone mode
})
export class DashboardGeneral implements OnInit {
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  isSearchSuccessful: boolean = false;
  isResultEmpty: boolean = true;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value;
    this.fetchSearchResults();
    this.route.paramMap.subscribe(params => {
      this.isSearchSuccessful = false;
      this.dashboardService.searchGeneralParamModel.pSearchParamType = params.get('category') || 'all';
      this.onFormSubmit();
      this.cdr.detectChanges();
    });
  }

  fetchSearchResults() {
    this.isResultEmpty = true;
    this.dashboardService.fetchGeneralSearchResults().subscribe(response => {
      this.isSearchSuccessful = response.success;
      this.isResultEmpty = response.isEmpty;
      this.cdr.detectChanges();
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFormSubmit(): void {
    this.dashboardService.searchGeneralParamModel.q = this.searchQuery;
    this.dashboardService.searchQuery$.next(this.searchQuery);
    this.fetchSearchResults();
  }

  onPageChange(step: number) {
    this.dashboardService.searchGeneralParamModel.mSearchParamPage = step;
    this.onFormSubmit();
  }

  protected readonly Math = Math;
}
