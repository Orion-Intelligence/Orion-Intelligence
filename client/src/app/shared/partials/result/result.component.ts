import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable} from 'rxjs';
import {EmptyResultComponent} from '../empty-result/empty-result.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
import {SidebarService} from '../../services/sidebar.service';
import {FiltersComponent} from '../filters/filters.component';
import {FilterModel} from '../../model/filter/filter.model';
import {SuggestionComponent} from '../suggestion/suggestion.component';
import {EmptyQueryComponent} from '../empty-query/empty-query.component';
import {Suggestion} from '../../model/results/shared/common-result';
import {query} from '@angular/animations';
import {Category} from "../../enums/pages";
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ScrollTopComponent} from '../scroll-top/scroll-top.component';
import {TooltipDirective} from '../../directive/tooltip-directive.directive';
import {HelperService} from '../../services/helper.service';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, SuggestionComponent, EmptyQueryComponent, RouterLink, ScrollTopComponent, TooltipDirective],
})
export class ResultComponent implements OnInit, OnChanges {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery: string = '';
  @Input() analyticsToggle: boolean = false;
  @Input() shrinkmenu: boolean = false;
  @Input() type!: Category;

  @Output() reloadFilters = new EventEmitter<[string | null, string | null]>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();
  @Output() onToggleSwitch = new EventEmitter<void>();
  @Input() filterModel!: FilterModel

  selectedFilters: { [key: string]: string | null } = {};
  isFilterOpen$: Observable<boolean>;
  result_triggered = false
  local_query = ""

  constructor(public sidebarService: SidebarService, private helper_service: HelperService, private route: ActivatedRoute) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnChanges(_: SimpleChanges): void {
    this.local_query = this.searchQuery
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const newFilters: any = {};
      const updatedSelectedFilters: { [key: string]: string } = {};

      if (this.filterModel)
        Object.keys(this.filterModel.filters).forEach(key => {
          const base = this.filterModel.filters[key];
          let value = params[key];

          if (key === 'mSearchParamSafeSearch') {
            if (value === 'true') value = 'yes';
            if (value === 'false') value = 'no';
          }

          if (value && base.options.includes(value)) {
            newFilters[key] = {...base, selected: value};
            updatedSelectedFilters[key] = value;
          } else {
            newFilters[key] = {...base};
          }
        });

      this.filterModel = {
        ...this.filterModel,
        filters: newFilters
      };

      this.selectedFilters = updatedSelectedFilters;
      this.reloadFilters.emit([
        this.selectedFilters['mNetwork'] || null,
        this.selectedFilters['mSearchParamSafeSearch'] || null
      ]);
    });
    if(this.local_query){
      this.result_triggered = true
    }
  }

  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reloadFilters.emit([this.selectedFilters['mNetwork'], this.selectedFilters['mSearchParamSafeSearch']]);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.resetFilter.emit()
    this.result_triggered = true
  }


  onFormSubmit() {
    this.updateQuery.emit(this.local_query)
    this.searchQuery = this.local_query
    this.reloadData.emit()
    this.result_triggered = true
  }

  onGetSuggestion() {
    if (this.suggestion && this.suggestion.options.length > 0 && this.suggestion.options.length < 15) {
      return this.searchQuery.replace(this.suggestion?.text, this.suggestion?.options[0].text)
    } else {
      return ""
    }
  }

  onUpdateSuggestion(suggestion: string) {
    if (this.suggestion && this.suggestion.options.length) {
      this.searchQuery = suggestion
      this.updateQuery.emit(suggestion)
    }
    this.reloadData.emit()
    this.result_triggered = true
  }

  onToggleAnalytics() {
    this.onToggleSwitch.emit()
  }

  protected readonly query = query;
  protected readonly Category = Category;

}
