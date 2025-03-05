import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {Observable} from 'rxjs';
import {DashboardSearchNoSuggestionComponent} from '../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../../pages/app/animations/dashboard-item.animations-in';
import {SidebarService} from '../../../../services/shared/sidebar.service';
import {FiltersComponent} from '../../filters/filters.component';
import {general_filters} from '../../../../pages/directory/constants/directory.filter';
import {FilterModel} from '../../../model/filter/filter';

@Component({
  selector: 'app-dashboard-expanded-result',
  standalone: true,
  templateUrl: './dashboard-expanded-result.html',
  styleUrls: ['./dashboard-expanded-result.css'],
  animations: [fadeInDashboardItem],
  imports: [CommonModule, DashboardSearchNoSuggestionComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent,],
})
export class DashboardExpandedResultComponent implements OnInit {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;

  @Output() updatePageNumber = new EventEmitter<number>();
  @Output() reloadFilters = new EventEmitter<[string|null, string|null]>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();

  filterModel: FilterModel = general_filters;
  selectedFilters: { [key: string]: string | null } = {};
  searchQuery: string = '';
  isFilterOpen$: Observable<boolean>;

  constructor(public dashboardService: DashboardService, public sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnInit(): void {
    this.searchQuery = this.dashboardService.searchQuery$.value;
  }


  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reloadFilters.emit([this.selectedFilters['mNetwork'], this.selectedFilters['mSearchParamSafeSearch']]);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reloadData.emit()
  }

  onFormSubmit() {
    this.reloadData.emit()
  }

  onSearchChange($event: any) {
    this.updateQuery.emit($event)
  }
}
