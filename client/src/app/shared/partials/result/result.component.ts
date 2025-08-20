import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { EmptyResultComponent } from '../empty-result/empty-result.component';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { LoadingFormComponent } from '../loading-form/loading-form.component';
import { fadeInDashboardItem } from '../../animations/dashboard.item.animation';
import { SidebarService } from '../../services/sidebar.service';
import { FiltersComponent } from '../filters/filters.component';
import { FilterCategory, FilterModel } from '../../model/filter/filter.model';
import { SortType } from '../../constants/shared-enums';
import { SuggestionComponent } from '../suggestion/suggestion.component';
import { EmptyQueryComponent } from '../empty-query/empty-query.component';
import { Suggestion } from '../../model/results/shared/common-result';
import { query } from '@angular/animations';
import { Category } from "../../constants/pages";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScrollTopComponent } from '../scroll-top/scroll-top.component';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { AppService } from '../../../services/core/app/app.service';
import { SearchFiltersComponent } from "../../../pages/homepage/search-filters/search-filters.component";
import { searchFilterAnimation } from '../../animations/search.filter.animation';
import { SelectedFilterBarComponent } from '../../../pages/homepage/selected-filter-bar/selected-filter-bar.component';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { HelperService } from '../../services/helper.service';

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
  @Input() isTool: boolean = true;
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

  isFilterOpen$: Observable<boolean>;
  result_triggered = true
  SortType = SortType;
  selectedSortBy: SortType = SortType.DEFAULT;
  selectedSearchBy = 'Match any term';
  local_query = ""
  showScans = false;
  scandomains: string[] = [];

  protected readonly query = query;
  protected readonly Category = Category;

  showFiltersOverlay: boolean = false;
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;

  constructor(private router: Router, public helperService: HelperService, public app_service: AppService, protected dashboardService: DashboardService, public sidebarService: SidebarService, private route: ActivatedRoute) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.local_query) {
      this.local_query = this.searchQuery
        ?.replace(/"/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
    }
    this.init_domains()
  }

  onSetMatchType(type: string) {
    this.dashboardService.selectedFilters.set({
      ...this.dashboardService.selectedFilters(),
      matchtype: type
    });
    this.app_service.set('matchType', type);
  }

  // getMatchType() {
  //   const matchtype = this.dashboardService.selectedFilters()["matchtype"];
  //   if (matchtype === "full") {
  //     return "Match full query";
  //   } else if (matchtype === "and") {
  //     return "Match individual terms";
  //   } else {
  //     return "Match any term";
  //   }
  // }
  getMatchType() {
    const matchtype = this.dashboardService.selectedFilters()["matchtype"];
    if (matchtype === "full") {
      return "Match full query";
    } else if (matchtype === "or") {
      return "Match any term";
    } else if (matchtype === "semantic") {
      return "Match semantic query";
    } else {
      return "Match individual terms";
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
            newFilters[key] = { ...base, selected: value };
            updatedSelectedFilters[key] = value;
          } else {
            newFilters[key] = { ...base };
          }
        });

      this.filterModel = {
        ...this.filterModel,
        filters: newFilters
      };
    });
    if (this.local_query) {
      this.result_triggered = true
    }
    const cfg = this.app_service.configData();
    const matchtype = cfg.localSettings.matchType || 'and';
    this.onSetMatchType(matchtype)
  }

  onFormSubmit() {
    this.dashboardService.consolidatedParamModel.page = 1
    let query = this.local_query;
    this.searchInputRef?.nativeElement.blur();
    this.updateQuery.emit(query);
    this.searchQuery = query;
    this.reloadData.emit();
    this.result_triggered = true;
    this.init_domains()
    this.showScans = false;
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

  sidebarFilterCount(): number {
    return Object.keys(this.dashboardService.selectedFilters()).length;
  }

  entityFiltersCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
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
    const clickedInsideFilter = this.filtersWrapperRef?.nativeElement.contains(target);
    const clickedInput = this.searchInputRef?.nativeElement.contains(target);
    const clickedInsideScan = target.closest('.dashboard-general-scan');

    if (!clickedInsideFilter && !clickedInput) this.setFilterOverlay(false);

    this.showScans = !!(clickedInsideScan && this.showScans);
  }

  setFilterOverlay(newValue: boolean) {
    this.showFiltersOverlay = newValue;
  }

  reloadFilter() {
    this.reloadFilters.emit()
  }

  init_domains() {
    let domain = this.helperService.extractLinks(this.searchQuery)
    if (domain) {
      this.scandomains = domain
    } else {
      this.scandomains = []
    }
  }

  toggleScan() {
    this.showScans = !this.showScans;
  }

  onScanSelected(domain: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dashboard/scan'], {
        queryParams: { domain }
      })
    );
    window.open(url, '_blank');
  }

}
