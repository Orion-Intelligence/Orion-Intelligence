import { AfterViewInit, ChangeDetectorRef, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { AppService } from '../../../services/core/app/app.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, switchMap, take, timer } from 'rxjs';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { TitleCasePipe } from '@angular/common';
import { ResultComponent } from '../../../shared/partials/result/result.component';
import { DashboardResultsGeneralComponent } from '../dashboard-results/dashboard-results-general-grid/dashboard-results-general.component';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { DashboardResultExploitComponent } from '../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import { DashboardResultChatComponent } from '../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { SortGroupedResultsPipe } from '../../../shared/pipes/sort-grouped-results.pipe';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, FeedSubCategory, GeneralSubCategory, SocialSubCategory } from '../../../shared/constants/pages';
import { SelectionStoreService } from '../../../services/dashboard/selection.service';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { DashboardResultSocialComponent } from '../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import { ResultInsightsComponent } from "../result-insights/result-insights.component";
import { consolidated_filters } from '../../../shared/constants/filters';
import { ALLOWED_CONSOLIDATED_RANKED_SINGLETON } from '../../../shared/constants/shared-enums';
import { ThreatResultsComponent } from "./defacement-results/threat-results.component";
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import { HttpClient } from '@angular/common/http';
import { ConsolidatedScanComponent } from './consolidated-scan/consolidated-scan.component';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { ConsolidatedIocComponent } from "./consolidated-ioc/consolidated-ioc.component";
import { scanAnimation } from '../../../shared/animations/scan.animations';
import { DefacementCallbackModel } from '../../../shared/model/results/defacement/defacement.callback.model';
import { applyQueryAndPageFromParams, isRouteChanged } from '../dashboard-manager.utils';
import { NetworkIntel } from '../../network-intel/network-intel';
@Component({
  selector: 'app-dashboard-consolidated',
  standalone: true,
  imports: [ResultComponent, DashboardResultsGeneralComponent, TitleCasePipe, DashboardResultExploitComponent, DashboardResultChatComponent, SortGroupedResultsPipe, TooltipDirective, DashboardResultSocialComponent, ResultInsightsComponent, ThreatResultsComponent, ConsolidatedScanComponent, ConsolidatedIocComponent, NetworkIntel],
  templateUrl: './dashboard-consolidated.component.html',
  animations: [scanAnimation, fadeInDashboardItem],
})
export class DashboardConsolidatedComponent implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  protected readonly fadeInDashboardItem = fadeInDashboardItem;
  protected readonly consolidated_filters = consolidated_filters;

  @ViewChild('domainScan') domainScanComponent!: ConsolidatedScanComponent;
  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  public stealerlogCallbackModel: StealerLogCallbackModel = new StealerLogCallbackModel();
  public groupedResults: { [index: string]: any[]; } = {};
  public response: any;
  public pageCounts: { [key: string]: number; } = {};
  isGrouped = false;
  isIOC = true;
  isNetworkIntel = false;
  query: string = '';
  isLoading = signal(false);
  isStealerLogLoading = signal(false);
  firstTrigger = true;
  result_count = 0;
  apiCategories = Object.values(ApiSubCategory);
  dumpCategories = Object.values(DumpSubCategory);
  newsCategories = Object.values(FeedSubCategory);
  socialCategories = Object.values(SocialSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  rankedResult: RankedCallbackModel = new RankedCallbackModel();
  rankedApiTime: any;
  showScanCard = computed(() => {
    const isLoading = this.isLoading();
    const isStealerLogLoading = this.isStealerLogLoading();
    const defacementData = this.consolidatedCallbackModel?.defacement_model?.Result ?? [];
    const hasDefacementData = defacementData.length > 0;
    const hasDefacementModel = !!this.consolidatedCallbackModel?.defacement_model;
    const hasStealerLogModel = !!this.stealerlogCallbackModel;
    if (isLoading && isStealerLogLoading) {
      return true;
    }
    if (!isLoading && defacementData.length === 0 && isStealerLogLoading) {
      return true;
    }
    if (isLoading && hasDefacementData && isStealerLogLoading) {
      return true;
    }
    if (!isLoading && !isStealerLogLoading && !hasDefacementModel && !hasStealerLogModel) {
      return false;
    }
    return false;
  });

  constructor(public http: HttpClient, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected selectionStore: SelectionStoreService, protected licenseService: LicenseService, protected authService: AuthService) {
    this.pageCounts = {};
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
    if (isRouteChanged(this.router.url, this.dashboardService.m_current_route)) {
      this.ngOnInit();
    }
  }

  ngOnInit(): void {
    this.consolidatedCallbackModel = {
      ...this.dashboardService.consolidatedCallbackModel
    } as ConsolidatedCallbackModel;
    this.populateGroupedResults();
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(take(1))
      .subscribe(([params, urlSegments]) => {
        this.query = applyQueryAndPageFromParams(params, this.dashboardService.consolidatedParamModel);
        this.dashboardService.consolidatedParamModel.category = urlSegments.length
          ? urlSegments[urlSegments.length - 1].path
          : 'all';
        if (this.firstTrigger && Object.keys(this.groupedResults).length > 0) {
          this.query = this.dashboardService.consolidatedParamModel.q;
        }
        else {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }
        this.firstTrigger = false;
      });
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.onToggleMenu(tab);
      }
    });
  }

  fetchSearchResults(_ = false): void {
    if (this.domainScanComponent) {
      this.domainScanComponent.clearResults();
    }
    if (!this.isGrouped) {
      return;
    }
    if (this.licenseService.canUseScanning() && this.domainScanComponent) {
      this.domainScanComponent.runScan(this.dashboardService.consolidatedParamModel.q);
    }
    if (this.isLoading()) {
      return;
    }
    this.isLoading.set(true);
    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isStealerLogLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = '';
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' }).then();
    }
    const cleanedParams: any = {};
    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      if (value != null && value !== '') {
        cleanedParams[key] = value;
      }
    });
    this.router.navigate([], {
      queryParams: cleanedParams, queryParamsHandling: 'merge', replaceUrl: true, relativeTo: this.route
    }).then(() => {
      this.cdr.detectChanges();
    });
    const category = this.route.snapshot.routeConfig?.path;
    if (category && ALLOWED_CONSOLIDATED_RANKED_SINGLETON.has(category)) {
      this.isGrouped = true;
      this.dashboardService.consolidatedParamModel.category = category;
    }
    if (this.checkMember()) {
      this.dashboardService.consolidatedParamModel.profile = true;
    }
    this.isLoading.set(true);
    this.consolidatedCallbackModel.defacement_model = new DefacementCallbackModel();
    this.stealerlogCallbackModel = new StealerLogCallbackModel();
    this.dashboardService.fetchConsolidatedGroupedResults('search/consolidated', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(0).pipe(map(() => response)))).subscribe(response => {
      if (response.success && response.data) {
        this.response = response.data;
        this.consolidatedCallbackModel = this.response;
        this.dashboardService.consolidatedCallbackModel = this.consolidatedCallbackModel;
        this.populateGroupedResults();
      }
      else {
        this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
        this.groupedResults = {};
      }
      this.isLoading.set(false);
    });
    if (this.isEmailOrUrl(this.dashboardService.consolidatedParamModel.q)) {
      this.isStealerLogLoading.set(true);
      this.dashboardService.consolidatedParamModel.url = this.dashboardService.consolidatedParamModel.q;
      this.dashboardService.consolidatedParamModel.category = "credential";
      this.dashboardService.fetchSearchResults<StealerLogCallbackModel>('search/stealerlogs', this.dashboardService.consolidatedParamModel)
        .pipe(switchMap(response => timer(300).pipe(map(() => response))))
        .subscribe(response => {
          if (response.success && response.data) {
            const seen = new Set<string>();
            response.data.Result = response.data.Result.filter((item: any) => {
              const raw = item?.raw;
              if (!raw) {
                return true;
              }
              if (seen.has(raw)) {
                return false;
              }
              seen.add(raw);
              return true;
            });
            this.stealerlogCallbackModel = response.data;
            this.dashboardService.stealerlogCallbackModel = response.data;
          }
          this.isStealerLogLoading.set(false);
        });
    }
  }

  resetFilters(_: undefined) {
    this.fetchSearchResults(true);
  }

  reloadFilters(_: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1;
    this.fetchSearchResults();
  }

  fetchRanked() {
    if (this.checkMember() && !this.hasIOCs()) {
      return;
    }
    this.isLoading.set(true);
    this.rankedResult = new RankedCallbackModel();
    const startTime = performance.now();
    this.defacementCategories = Object.values(DefacementSubCategory);
    this.consolidatedCallbackModel.defacement_model = new DefacementCallbackModel();
    this.stealerlogCallbackModel = new StealerLogCallbackModel();
    this.dashboardService
      .fetchConsolidatedRankededResults('search/consolidated/ranked', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(500).pipe(map(() => response))))
      .subscribe(response => {
        const endTime = performance.now();
        this.rankedApiTime = Math.round(endTime - startTime);
        if (response.success && response.data) {
          this.rankedResult = response.data;
        }
        this.isLoading.set(false);
      });
  }

  populateGroupedResults(): void {
    this.groupedResults = {};
    this.pageCounts = {};
    const models: (keyof ConsolidatedCallbackModel)[] = [
      'leak_model',
      'chat_model',
      'defacement_model',
      'generic_model',
      'exploit_model',
      'social_model',
      'stealer_model',
      'tracking_model',
      'news_model',
    ];
    models.forEach(model => {
      this.groupedResults[model] = this.consolidatedCallbackModel[model]?.Result ?? [];
      this.pageCounts[model] = this.consolidatedCallbackModel[model]?.Page_Count ?? 0;
    });
    this.result_count = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  getTotalResultCount(): number {
    const groupedCount = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
    const rankedCount = this.rankedResult.pageCount;
    if (this.isGrouped) {
      return groupedCount;
    }
    else {
      return rankedCount;
    }
  }

  isIpReportExpandable(): boolean {
    const totalWithoutDefacement = Object.entries(this.groupedResults)
      .filter(([key]) => key !== 'defacement_model')
      .reduce((sum, [_, list]) => sum + list.length, 0);
    return totalWithoutDefacement == 0;
  }

  onSectionSelected(section: Category) {
    this.selectionStore.setSelectedSection(section);
    let firstSubcategory: string | undefined;
    let second_category = "all";
    switch (section) {
      case Category.STRATEGIC:
        firstSubcategory = this.generalCategories[0];
        break;
      case Category.BREACH:
        firstSubcategory = this.leakCategories[0];
        break;
      case Category.API:
        firstSubcategory = this.apiCategories[0];
        break;
      case Category.DEFACEMENT:
        firstSubcategory = this.defacementCategories[0];
        break;
      case Category.DUMP:
        firstSubcategory = this.dumpCategories[0];
        break;
      case Category.FEED:
        firstSubcategory = this.newsCategories[0];
        break;
      case Category.SOCIAL:
        firstSubcategory = this.socialCategories[0];
        second_category = this.socialCategories[0].toLowerCase();
        break;
    }
    if (firstSubcategory) {
      this.selectionStore.setSelectedOption(firstSubcategory);
    }
    const routePrefix = '/dashboard/' + section.toLowerCase() + '/' + second_category;
    this.router.navigate([routePrefix], {
      queryParams: { page: 1 }, queryParamsHandling: 'merge'
    }).then();
  }

  getCategoryFromKey(key: string): Category {
    switch (key) {
      case 'leak_model':
        return Category.BREACH;
      case 'exploit_model':
        return Category.EXPLOIT;
      case 'defacement_model':
        return Category.DEFACEMENT;
      case 'chat_model':
        return Category.SOCIAL;
      case 'generic_model':
        return Category.STRATEGIC;
      case 'social_model':
        return Category.SOCIAL;
      default:
        return Category.BREACH;
    }
  }

  onToggleMenu(tab: string): void {
    this.dashboardService.consolidatedParamModel.tab = tab;
    this.query='';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).then();
    const skipConsolidatedBackFetchOnce = sessionStorage.getItem('skipConsolidatedBackFetchOnce') === '1';
    if (tab == "Deep Search") {
      this.isNetworkIntel = false;
      this.isGrouped = true;
      this.isIOC = false;
      if (skipConsolidatedBackFetchOnce) {
        sessionStorage.removeItem('skipConsolidatedBackFetchOnce');
        return;
      }
      this.fetchSearchResults();
    }
    else if (tab == "Ranked") {
      this.isNetworkIntel = false;
      this.isGrouped = false;
      this.isIOC = false;
      this.fetchRanked();
    }
    else if (tab == "IOCs") {
      this.isNetworkIntel = false;
      this.isIOC = true;
      this.isGrouped = false;
    }
    else if (tab == "Network Intelligence") {
      this.isNetworkIntel = true;
      this.isIOC = false;
      this.isGrouped = false;
    }
  }

  checkMember(): boolean {
    return this.appService.userSessionData().user.role === 'member';
  }

  hasIOCs(): boolean {
    const categories = this.appService.configData().localSettings.entityfilterCategories;
    return Object.values(categories).some((arr: any) => Array.isArray(arr) && arr.length > 0);
  }

  shouldShowSection(): boolean {
    const totalResults = this.getTotalResultCount();
    const hasAnyData = totalResults > 0;
    if (!this.checkMember()) {
      return hasAnyData;
    }
    return hasAnyData && this.hasIOCs();
  }

  isEmailOrUrl(query: string): boolean {
    if (!query) {
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const urlRegex = /^(https?:\/\/|www\.|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:[/?#][^\s]*)?$/i;
    if (emailRegex.test(query)) {
      return true;
    }
    if (urlRegex.test(query)) {
      return true;
    }
    return false;
  }
}
