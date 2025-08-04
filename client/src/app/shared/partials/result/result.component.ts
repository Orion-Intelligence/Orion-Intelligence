import {Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {EmptyResultComponent} from '../empty-result/empty-result.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
import {SidebarService} from '../../services/sidebar.service';
import {FiltersComponent} from '../filters/filters.component';
import {FilterCategory, FilterModel} from '../../model/filter/filter.model';
import {SortType} from '../../constants/shared-enums';
import {SuggestionComponent} from '../suggestion/suggestion.component';
import {EmptyQueryComponent} from '../empty-query/empty-query.component';
import {Suggestion} from '../../model/results/shared/common-result';
import {query} from '@angular/animations';
import {Category} from "../../constants/pages";
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ScrollTopComponent} from '../scroll-top/scroll-top.component';
import {TooltipDirective} from '../../directive/tooltip-directive.directive';
import {AppService} from '../../../services/core/app/app.service';
import {SearchFiltersComponent} from "../../../pages/homepage/search-filters/search-filters.component";
import {searchFilterAnimation} from '../../animations/search.filter.animation';
import {SelectedFilterBarComponent} from '../../../pages/homepage/selected-filter-bar/selected-filter-bar.component';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem, searchFilterAnimation],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, SuggestionComponent, EmptyQueryComponent, RouterLink, ScrollTopComponent, TooltipDirective, SearchFiltersComponent, SelectedFilterBarComponent],
})
export class ResultComponent implements OnInit, OnChanges {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery = '';
  @Input() analyticsToggle = false;
  @Input() shrinkmenu = false;
  @Input() disableScroll = false;
  @Input() type!: Category;
  @Input() discussion = false;
  @Input() consolidated = false;
  @Input() domain = false;
  @Input() showTabs = true;
  @Input() filterModel!: FilterModel
  @Input() showSorting: boolean = true

  @Output() reloadSearchFilters = new EventEmitter<FilterCategory[]>();
  @Output() reloadFilters = new EventEmitter<Record<string, string | null>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();
  @Output() onToggleSwitch = new EventEmitter<string>();
  @Output() onToggleSort = new EventEmitter<SortType>();

  selectedFilters: Record<string, string | null> = {};
  isFilterOpen$: Observable<boolean>;
  result_triggered = false
  SortType = SortType;
  selectedSortBy: SortType = SortType.DEFAULT;

  local_query = ""
  selectedSearchBy = 'Match any term';

  protected readonly query = query;
  protected readonly Category = Category;

  showFiltersOverlay: boolean = false;
  @ViewChild('filtersWrapper', {static: false}) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', {static: false}) searchInputRef!: ElementRef;

  constructor(public app_service: AppService, public sidebarService: SidebarService, private route: ActivatedRoute) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.local_query) {
      this.local_query = this.searchQuery
        ?.replace(/"/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const newFilters: any = {};
      const updatedSelectedFilters: Record<string, string> = {};

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
    });
    if (this.local_query) {
      this.result_triggered = true
    }
  }

  searchFiltersChanged() {
    this.applyFilters(this.selectedFilters)
  }

  applyFilters(filters: Record<string, string | null>) {
    this.selectedFilters = filters;
    this.reloadFilters.emit(this.selectedFilters);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.resetFilter.emit()
    this.result_triggered = true
  }

  onFormSubmit() {
    let query = "";
    this.searchInputRef?.nativeElement.blur();
    let quoteCount = (this.local_query.match(/"/g) || []).length;

    if (this.local_query && quoteCount < 2) {
      query = this.local_query.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();

      if (this.selectedSearchBy === 'Match full query') {
        if (query) {
          query = `"${query}"`;
        }
      } else if (this.selectedSearchBy === 'Match indivisual terms') {
        if (query) {
          query = query.split(' ').map(t => `"${t}"`).join(' ');
        }
      }
    } else if (this.local_query) {
      query = this.local_query.replace(/^\s+|\s+$/g, '');
    }
    this.updateQuery.emit(query);
    this.searchQuery = query;
    this.reloadData.emit();
    this.result_triggered = true;
  }


  onGetSuggestion() {
    if (this.searchQuery && this.suggestion && this.suggestion.options.length > 0 && this.suggestion.options.length < 15) {
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

  onTabClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('nav-link') || target.classList.contains('active')) return;

    const parent = target.closest('.nav-tabs');
    if (!parent) return;

    parent.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    this.onToggleAnalytics(target.textContent?.trim() || '');
  }

  onToggleAnalytics(tab: string) {
    this.onToggleSwitch.emit(tab);
  }

  onToolToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const cfg = this.app_service.configData();
    cfg.localSettings.enable_advanced_tools = !cfg.localSettings.enable_advanced_tools;
    this.app_service.set('enable_advanced_tools', this.app_service.configData().localSettings.enable_advanced_tools);
    this.app_service.configData.set(cfg);
  }

  onAdvanceSettingToggle() {
    this.app_service.set('advance_setting_toggle', !this.app_service.configData().localSettings.advance_setting_toggle);
    this.showFiltersOverlay = true;
  }

  onSortChange(type: SortType): void {
    this.selectedSortBy = type;
    this.onToggleSort.emit(type);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsideFilter =
      this.filtersWrapperRef?.nativeElement.contains(target);

    const clickedInput =
      this.searchInputRef?.nativeElement.contains(target);

    if (!clickedInsideFilter && !clickedInput) {
      this.setFilterOverlay(false);
    }
  }

  setFilterOverlay(newValue: boolean) {
    this.showFiltersOverlay = newValue;
  }

  onClearAllFromBar(): void {
    this.resetFilters();
  }
}
