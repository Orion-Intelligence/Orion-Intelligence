import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {Observable} from 'rxjs';
import {DashboardSearchNoSuggestionComponent} from '../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {SidebarService} from '../../../../services/shared/sidebar.service';
import {FiltersComponent} from '../../filters/filters.component';
import {general_filters} from '../../../constants/filters';
import {FilterModel} from '../../../model/filter/filter';
import {Suggestion} from '../../../model/intel-results/general/search_general_callback_model';
import {DashboardResultMainComponent} from '../intel-panel/dashboard-result-main/dashboard-result-main.component';
import {SuggestionComponent} from '../../suggestion/suggestion.component';

@Component({
  selector: 'app-dashboard-expanded-result',
  standalone: true,
  templateUrl: './dashboard-expanded-result.html',
  styleUrls: ['./dashboard-expanded-result.css'],
  animations: [fadeInDashboardItem],
  imports: [CommonModule, DashboardSearchNoSuggestionComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, SuggestionComponent,DashboardResultMainComponent],
})
export class DashboardExpandedResultComponent implements OnInit {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery: string = '';

  @Output() updatePageNumber = new EventEmitter<number>();
  @Output() reloadFilters = new EventEmitter<[string | null, string | null]>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();

  filterModel: FilterModel = general_filters;
  selectedFilters: { [key: string]: string | null } = {};
  isFilterOpen$: Observable<boolean>;

  constructor(public dashboardService: DashboardService, public sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnInit(): void {
  }


  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reloadFilters.emit([this.selectedFilters['mNetwork'], this.selectedFilters['mSearchParamSafeSearch']]);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reloadFilters.emit(["", ""]);
    this.reloadData.emit()
  }

  onFormSubmit() {
    this.reloadData.emit()
  }

  onGetSuggestion(){
    if (this.suggestion && this.suggestion.options.length) {
      return  this.searchQuery.replace(this.suggestion?.text, this.suggestion?.options[0].text)
    }else {
      return ""
    }
  }

  onUpdateSuggestion(suggestion:string) {
    if (this.suggestion && this.suggestion.options.length) {
      this.searchQuery = suggestion
      this.updateQuery.emit(suggestion)
    }
    this.reloadData.emit()
  }

  onSearchChange($event: any) {
    this.updateQuery.emit($event)
  }
}
