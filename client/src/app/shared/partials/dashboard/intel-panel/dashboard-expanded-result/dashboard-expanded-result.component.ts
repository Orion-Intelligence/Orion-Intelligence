import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {Observable, Subject} from 'rxjs';
import {DashboardSearchNoSuggestionComponent} from '../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../../../pages/app/animations/dashboard-item.animations-in';
import {SidebarService} from '../../../../../services/shared/sidebar.service';
import {FiltersComponent} from '../../../filters/filters.component';
import {general_filters} from '../../../../../pages/directory/constants/directory.filter';
import {Category} from '../../../../../pages/dashboard/enums/pages';
import {FilterModel} from '../../../../model/filter/filter';
import {DashboardLeakResultGridComponent} from '../dashboard-results/dashboard-leak-result-grid/dashboard-leak-result-grid.component';
import {DashboardGeneralResultsGridComponent} from '../dashboard-results/dashboard-results-grid/dashboard-general-results-grid.component';

@Component({
  selector: 'app-dashboard-expanded-result', standalone: true, templateUrl: './dashboard-expanded-result.html', styleUrls: ['./dashboard-expanded-result.css'], animations: [fadeInDashboardItem], imports: [CommonModule, DashboardGeneralResultsGridComponent, DashboardSearchNoSuggestionComponent, DashboardPaginationComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, DashboardLeakResultGridComponent,],
})
export class DashboardExpandedResultComponent implements OnInit {
  private searchSubject = new Subject<string>();
  private latestRequestTimestamp: number = 0;

  data_type = Category.STRATEGIC_INTELLIGENCE;
  filterModel: FilterModel = general_filters;
  selectedFilters: { [key: string]: string | null } = {};
  searchQuery: string = '';
  loading = false;
  isFilterOpen$: Observable<boolean>;

  isSearchSuccessful: boolean = false;
  isResultEmpty: boolean = true;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private cdr: ChangeDetectorRef, public sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value;
    this.fetchSearchResults();

    this.route.data.subscribe((data) => {
      this.isSearchSuccessful = false;
      this.data_type = Object.values(Category).find((value) => value === data['type']) || Category.STRATEGIC_INTELLIGENCE;

      if (this.data_type === Category.STRATEGIC_INTELLIGENCE) {
        this.dashboardService.searchGeneralParamModel.pSearchParamType = this.route.snapshot.paramMap.get('category') || 'all';
      } else {
        this.dashboardService.searchLeakParamModel.pSearchParamType = this.route.snapshot.paramMap.get('category') || 'all';
      }

      this.onFormSubmit();
      this.cdr.detectChanges();
    });
  }

  fetchSearchResults() {
    this.isResultEmpty = false;
    this.loading = true;

    const requestStart = Date.now();
    this.latestRequestTimestamp = requestStart;
    if (this.data_type == Category.STRATEGIC_INTELLIGENCE) {
      this.dashboardService.fetchGeneralSearchResults().subscribe(response => {
        this.handleLoadingDelay(requestStart, response.isEmpty);
      });
    } else {
      this.dashboardService.fetchLeakSearchResults().subscribe(response => {
        this.handleLoadingDelay(requestStart, response.isEmpty);
      });
    }
  }

  private handleLoadingDelay(requestStart: number, isEmpty: boolean) {
    const elapsedTime = Date.now() - requestStart;
    const minLoadingTime = 1000;
    const remainingTime = minLoadingTime - elapsedTime;

    setTimeout(() => {
      if (this.latestRequestTimestamp === requestStart) {
        this.loading = false;
        this.isResultEmpty = isEmpty;
        this.cdr.detectChanges();
      }
    }, Math.max(remainingTime, 0));
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFormSubmit(): void {
    if (this.data_type === Category.STRATEGIC_INTELLIGENCE) {
      this.dashboardService.searchGeneralParamModel.q = this.searchQuery;
    } else {
      this.dashboardService.searchLeakParamModel.q = this.searchQuery;
    }

    this.dashboardService.searchQuery$.next(this.searchQuery);
    this.fetchSearchResults();
  }

  onPageChange(step: number) {
    if (this.data_type === Category.STRATEGIC_INTELLIGENCE) {
      this.dashboardService.searchGeneralParamModel.mSearchParamPage = step;
    } else {
      this.dashboardService.searchLeakParamModel.mSearchParamPage = step;
    }

    this.onFormSubmit();
  }

  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reload();
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reload();
  }

  reload() {
    if (this.data_type === Category.STRATEGIC_INTELLIGENCE) {
      if (this.selectedFilters['mNetwork'] != null) {
        this.dashboardService.searchGeneralParamModel.mNetwork = this.selectedFilters['mNetwork'];
      }
      this.dashboardService.searchGeneralParamModel.mSearchParamSafeSearch = this.selectedFilters['mSearchParamSafeSearch'] != 'yes';
    } else {
      if (this.selectedFilters['mNetwork'] != null) {
        this.dashboardService.searchLeakParamModel.mNetwork = this.selectedFilters['mNetwork'];
      }
      this.dashboardService.searchLeakParamModel.mSearchParamSafeSearch = this.selectedFilters['mSearchParamSafeSearch'] != 'yes';
    }

    this.fetchSearchResults();
  }

  protected readonly Math = Math;
  protected readonly Category = Category;
}
