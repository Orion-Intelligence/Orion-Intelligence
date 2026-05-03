import { Component, computed, effect, ElementRef, HostListener, OnChanges, OnInit, SimpleChanges, ViewChild, inject, input, output } from '@angular/core';
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
import { ProxyController } from '../../services/proxy-controller';
import { CrossSearchCardComponent } from '../onion-search-engine/cross-search-card.component';
import { ChatWidgetComponent } from '../../../pages/intel-panel/ai-workspace/chat-widget/chat-widget.component';
import { AiToolRoutingService } from '../../services/ai-tool-routing.service';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem, searchFilterAnimation],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, EmptyQueryComponent, RouterLink, ScrollTopComponent, TooltipDirective, SearchFiltersComponent, SelectedFilterBarComponent, CrossSearchCardComponent, ChatWidgetComponent],
})
export class ResultComponent implements OnInit, OnChanges {
  private readonly proxied_resource = inject(ProxyController);

  protected readonly SortType = SortType;
  protected readonly Category = Category;
  protected readonly query = query;

  readonly resultCountInput = input<number | undefined>(undefined, { alias: 'result_count' });
  readonly searchQueryInput = input('', { alias: 'searchQuery' });
  readonly consolidatedInput = input(false, { alias: 'consolidated' });
  readonly filterModelInput = input<FilterModel | undefined>(undefined, { alias: 'filterModel' });
  readonly activeTabInput = input('IOCs', { alias: 'activeTab' });
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
  readonly result_count_enabled = input<boolean>(true);
  result_count!: number;
  readonly isLoading = input(false);
  readonly showNoResult = input<boolean>(true);
  readonly isList = input(false);
  readonly isTool = input<boolean>(true);
  readonly showEmptyQuery = input(false);
  searchQuery = '';
  readonly analyticsToggle = input(false);
  readonly list_grid = input(false);
  readonly shrinkmenu = input(false);
  readonly disableScroll = input(false);
  readonly type = input<Category | undefined>(undefined);
  readonly discussion = input(false);
  consolidated = false;
  readonly domain = input(false);
  readonly showTabs = input(true);
  filterModel!: FilterModel;
  readonly showSorting = input<boolean>(true);
  readonly showSelectedFilters = input<boolean>(true);
  activeTab: string = 'IOCs';
  readonly reloadSearchFilters = output<FilterCategory[]>();
  readonly resetFilter = output<undefined>();
  readonly onToggleSwitch = output<string>();
  readonly reloadFilters = output<Record<string, string | null>>();
  readonly reloadData = output<undefined>();
  readonly updateQuery = output<string>();
  readonly onToggleSort = output<SortType>();

  get shouldShowCrossSearchOnEmptyState(): boolean {
    return !this.consolidated
      && !this.app_service.isMobileMode()
      && this.type() !== Category.DUMP
      && this.type() !== Category.DEFACEMENT
      && !this.router.url.toLowerCase().includes('/defacement')
      && !!this.searchQuery.trim();
  }

  constructor( protected scrollService: ScrollService, private router: Router, public helperService: HelperService, public app_service: AppService, protected dashboardService: DashboardService, public sidebarService: SidebarService, private route: ActivatedRoute, public authService: AuthService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService, protected aiToolRoutingService: AiToolRoutingService ) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
    effect(() => {
      const resultCount = this.resultCountInput();
      if (resultCount !== undefined) {
        this.result_count = resultCount;
      }
      this.searchQuery = this.searchQueryInput();
      this.consolidated = this.consolidatedInput();
      const filterModel = this.filterModelInput();
      if (filterModel !== undefined) {
        this.filterModel = filterModel;
      }
      this.activeTab = this.activeTabInput();
    });
  }

  ngOnChanges(_: SimpleChanges): void {
    this.searchQuery = this.searchQuery
      ?.replace(/"/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || '';
    this.local_query = this.searchQuery;
    this.init_domains();
  }

  onSetMatchType(type: string) {
    this.homeSearchService.setMatchType(type);
  }

  onTabClick(event: Event): void {
    const eventTargetElement = event.target as HTMLElement | null;
    const tabElement = eventTargetElement?.closest('[data-tab]') as HTMLElement | null;
    if (!tabElement) {
      return;
    }
    const tab = tabElement.getAttribute('data-tab') || '';
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

  onFormSubmit(event?: Event) {
    event?.preventDefault();
    this.scrollService.resetOnReload();
    this.dashboardService.consolidatedParamModel.page = 1;
    this.dashboardService.consolidatedParamModel.tab = "";
    const query = (this.local_query || this.searchQuery || '').trim();
    this.searchInputRef?.nativeElement.blur();
    this.searchQuery = query;
    this.local_query = query;
    this.result_triggered = true;
    this.showScans = false;
    this.updateQuery.emit(query);
    // TODO: The 'emit' function requires a mandatory void argument
    this.reloadData.emit(undefined);
    this.init_domains();
  }

  onToolToggle(event: Event): void {
    this.closeMenus();
    this.homeSearchService.closeOverlay();
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
    this.reloadFilters.emit({ ...this.dashboardService.selectedFilters() });
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
    this.proxied_resource.open(url);
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
    const inputElement = event.target as HTMLInputElement | null;
    if (inputElement) {
      this.local_query = inputElement.value;
    }
    this.homeSearchService.handleSearchInput(event);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.homeSearchService.handleDocumentClick(event, this.filtersWrapperRef, this.searchInputRef);
    const eventTargetNode = event.target as Node | null;
    const isInsideSort = !!(eventTargetNode && this.sortMenuRef?.nativeElement?.contains(eventTargetNode));
    const isInsideSearch = !!(eventTargetNode && this.searchMenuRef?.nativeElement?.contains(eventTargetNode));
    if (!isInsideSort && !isInsideSearch) {
      this.closeMenus();
    }
  }

  clearSearchInput(): void {
    this.searchQuery = '';
    this.local_query = '';
    const inputElement = this.searchInputRef?.nativeElement as HTMLInputElement | undefined;
    if (inputElement) {
      inputElement.value = '';
      inputElement.focus();
    }
    this.updateQuery.emit('');
    this.init_domains();
  }
}
