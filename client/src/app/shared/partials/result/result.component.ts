import { Component, computed, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
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
import { ScrollService } from '../../services/scroll.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { HomeSearchService } from '../../../services/home_search/home.search.service';
import { normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../utils/intel-report.util';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem, searchFilterAnimation],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, EmptyQueryComponent, RouterLink, ScrollTopComponent, TooltipDirective, SearchFiltersComponent, SelectedFilterBarComponent],
})
export class ResultComponent implements OnInit, OnChanges {
  protected readonly SortType = SortType;
  protected readonly Category = Category;
  protected readonly query = query;

  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;
  @ViewChild('sortMenuRef', { static: false }) sortMenuRef?: ElementRef;
  @ViewChild('searchMenuRef', { static: false }) searchMenuRef?: ElementRef;
  isFilterOpen$: Observable<boolean>;
  result_triggered = true;
  selectedSortBy: SortType = SortType.DEFAULT;
  selectedSearchBy = 'Match any term';
  local_query = '';
  showScans = false;
  sortMenuOpen = false;
  searchMenuOpen = false;
  scandomains: string[] = [];
  matchTypeLabel = computed(() => {
    const matchtype = this.dashboardService.selectedFilters()["matchtype"];
    if (matchtype === "full") {
      return "Match full query";
    }
    if (matchtype === "and") {
      return "Match individual terms";
    }
    if (matchtype === "semantic") {
      return "Match semantic query";
    }
    return "Match any term";
  });

  @Input() result_count_enabled: boolean = true;
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() showNoResult: boolean = true;
  @Input() isList!: boolean;
  @Input() isTool: boolean = true;
  @Input() showEmptyQuery = false;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery = '';
  @Input() analyticsToggle = false;
  @Input() list_grid = false;
  @Input() shrinkmenu = false;
  @Input() disableScroll = false;
  @Input() type!: Category;
  @Input() discussion = false;
  @Input() consolidated = false;
  @Input() domain = false;
  @Input() showTabs = true;
  @Input() filterModel!: FilterModel;
  @Input() showSorting: boolean = true;
  @Input() showSelectedFilters: boolean = true;
  @Input() activeTab: string = 'IOCs';

  @Output() reloadSearchFilters = new EventEmitter<FilterCategory[]>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() onToggleSwitch = new EventEmitter<string>();
  @Output() reloadFilters = new EventEmitter<Record<string, string | null>>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();
  @Output() onToggleSort = new EventEmitter<SortType>();

  constructor( protected scrollService: ScrollService, private router: Router, public helperService: HelperService, public app_service: AppService, protected dashboardService: DashboardService, public sidebarService: SidebarService, private route: ActivatedRoute, public authService: AuthService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService ) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.local_query) {
      this.local_query = this.searchQuery
        ?.replace(/"/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
    }
    this.init_domains();
  }

  onSetMatchType(type: string) {
    this.homeSearchService.setMatchType(type);
  }

  onTabClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    const tabEl = target?.closest('[data-tab]') as HTMLElement | null;
    if (!tabEl) {
      return;
    }
    const tab = tabEl.getAttribute('data-tab') || '';
    if (!tab || tab === this.activeTab) {
      return;
    }
    this.onToggleAnalytics(tab);
  }

  onToggleAnalytics(_tab: string) {
    this.activeTab = _tab;
    this.onToggleSwitch.emit(_tab);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const newFilters: any = {};
      if (this.filterModel) {
        Object.keys(this.filterModel.filters).forEach(key => {
          const base = this.filterModel.filters[key];
          let value = params[key];
          if (key === 'mSearchParamSafeSearch') {
            value = value === 'true' ? 'yes' : value === 'false' ? 'no' : value;
          }
          if (value && base.options.includes(value)) {
            newFilters[key] = { ...base, selected: value };
          }
          else {
            newFilters[key] = { ...base };
          }
        });
        this.filterModel = { ...this.filterModel, filters: newFilters };
      }
    });
    if (this.local_query) {
      this.result_triggered = true;
    }
    this.init_domains();
  }

  onFormSubmit() {
    this.scrollService.resetOnReload();
    this.dashboardService.consolidatedParamModel.page = 1;
    this.dashboardService.consolidatedParamModel.tab = "";
    const query = (this.searchQuery || this.local_query || '').trim();
    this.searchInputRef?.nativeElement.blur();
    this.searchQuery = query;
    this.local_query = query;
    this.result_triggered = true;
    this.showScans = false;
    this.updateQuery.emit(query);
    this.reloadData.emit();
    this.init_domains();
  }

  onGetSuggestion() {
    if (this.searchQuery && this.suggestion && this.suggestion.options.length > 0 && this.suggestion.options.length < 15) {
      return this.searchQuery.replace(this.suggestion?.text, this.suggestion?.options[0].text);
    }
    return '';
  }

  onUpdateSuggestion(suggestion: string) {
    if (this.suggestion && this.suggestion.options.length) {
      this.searchQuery = suggestion;
      this.local_query = suggestion;
      this.updateQuery.emit(suggestion);
    }
    this.reloadData.emit();
    this.result_triggered = true;
  }

  onToolToggle(event: Event): void {
    this.homeSearchService.toggleAdvancedTools(event);
  }

  sidebarFilterCount(): number {
    return Object.keys(this.dashboardService.selectedFilters()).length;
  }

  entityFiltersCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) {
        return count + val.length;
      }
      return count + 1;
    }, 0);
  }

  onAdvanceSettingToggle() {
    this.homeSearchService.toggleAdvanceSettings();
  }

  onSortChange(type: SortType): void {
    this.selectedSortBy = type;
    this.onToggleSort.emit(type);
  }

  toggleSortMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.sortMenuOpen = !this.sortMenuOpen;
    if (this.sortMenuOpen) {
      this.searchMenuOpen = false;
    }
  }

  toggleSearchMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.searchMenuOpen = !this.searchMenuOpen;
    if (this.searchMenuOpen) {
      this.sortMenuOpen = false;
    }
  }

  closeMenus(): void {
    this.sortMenuOpen = false;
    this.searchMenuOpen = false;
  }

  setFilterOverlay(newValue: boolean) {
    if (!this.authService.getIsMobileDemo()) {
      this.homeSearchService.showFiltersOverlay = newValue;
    }
  }

  reloadFilter() {
    this.reloadFilters.emit();
  }

  init_domains() {
    const filters = this.app_service.configData().localSettings.entityfilterCategories;
    const queryDomains = this.helperService.extractLinks(this.searchQuery) || [];
    const filterDomains = Array.isArray(filters['m_domain'])
      ? filters['m_domain'].map((domain: string) => `https://${domain}`)
      : [];
    this.scandomains = Array.from(new Set([...queryDomains, ...filterDomains]));
  }

  toggleScan() {
    this.showScans = !this.showScans;
  }

  onScanSelected(domain: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/dashboard/scan'], {
      queryParams: { domain }
    }));
    window.open(url, '_blank');
  }

  normalizeDisplayUrl(url?: string | null): string {
    return normalizeDisplayUrlUtil(url, '');
  }

  checkMember(): boolean {
    return this.app_service.userSessionData().user.role === 'member';
  }

  hasIOCs(): boolean {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return Object.values(categories).some((arr: any) => Array.isArray(arr) && arr.length > 0);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      this.local_query = target.value;
    }
    this.homeSearchService.handleSearchInput(event);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.homeSearchService.handleDocumentClick(event, this.filtersWrapperRef, this.searchInputRef);
    const target = event.target as Node | null;
    const isInsideSort = !!(target && this.sortMenuRef?.nativeElement?.contains(target));
    const isInsideSearch = !!(target && this.searchMenuRef?.nativeElement?.contains(target));
    if (!isInsideSort && !isInsideSearch) {
      this.closeMenus();
    }
  }

  clearSearchInput(): void {
    this.searchQuery = '';
    this.local_query = '';
    const input = this.searchInputRef?.nativeElement as HTMLInputElement | undefined;
    if (input) {
      input.value = '';
      input.focus();
    }
    this.updateQuery.emit('');
    this.init_domains();
  }
}
