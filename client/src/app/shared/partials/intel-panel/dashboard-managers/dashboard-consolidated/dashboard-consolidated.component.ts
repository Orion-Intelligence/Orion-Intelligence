import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal, ViewChild } from '@angular/core';
import { AppService } from '../../../../../services/core/app/app.service';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { ResultComponent } from '../../../result/result.component';
import { DashboardResultsGeneralGridComponent } from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';
import { ConsolidatedCallbackModel } from '../../../../model/results/consolidated/consolidated.callback.model';
import { DashboardResultExploitComponent } from '../../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import { DashboardResultChatComponent } from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { SortGroupedResultsPipe } from '../../../../pipes/sort-grouped-results.pipe';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, FeedSubCategory, GeneralSubCategory, SocialSubCategory } from '../../../../constants/pages';
import { SelectionStoreService } from '../../../../../services/dashboard/selection.service';
import { TooltipDirective } from '../../../../directive/tooltip-directive.directive';
import { DashboardResultSocialComponent } from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import { ResultInsightsComponent } from "../result-insights/result-insights.component";
import { consolidated_filters } from '../../../../constants/filters';
import { ALLOWED_CONSOLIDATED_RANKED_SINGLETON } from '../../../../constants/shared-enums';
import { ThreatResultsComponent } from "./defacement-results/threat-results.component";
import { RankedCallbackModel } from '../../../../model/results/consolidated/ranked.callback.model';
import { ApiService } from '../../../../services/api.service';
import { HelperService } from '../../../../services/helper.service';
import { HttpClient } from '@angular/common/http';
import { ConsolidatedApisComponent } from './consolidated-apis/consolidated-apis.component';
import { ConsolidatedScanComponent } from './consolidated-scan/consolidated-scan.component';


@Component({
  selector: 'app-dashboard-consolidated',
  standalone: true,
  imports: [NgIf, ResultComponent, DashboardResultsGeneralGridComponent, NgForOf, TitleCasePipe, DashboardResultExploitComponent, DashboardResultChatComponent, SortGroupedResultsPipe, TooltipDirective, DashboardResultSocialComponent, ResultInsightsComponent, ThreatResultsComponent, ConsolidatedScanComponent, ConsolidatedApisComponent],
  templateUrl: './dashboard-consolidated.component.html',
  styleUrl: './dashboard-consolidated.component.css',
  animations: [fadeInDashboardItem]
})
export class DashboardConsolidatedComponent implements OnInit, AfterViewInit {

  protected readonly Math = Math;
  protected readonly fadeInDashboardItem = fadeInDashboardItem;
  protected readonly consolidated_filters = consolidated_filters;


  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  public groupedResults: { [index: string]: any[] } = {};
  public response: any;
  public pageCounts: { [key: string]: number } = {};

  isGrouped = true
  query: string = '';
  isLoading = signal(false);
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

  @ViewChild('liveApiSearch') liveApiSearchComponent!: ConsolidatedApisComponent;
  @ViewChild('domainScan') domainScanComponent!: ConsolidatedScanComponent;



  constructor(public http: HttpClient, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected selectionStore: SelectionStoreService, private apiService: ApiService, private helperService: HelperService) {
    this.pageCounts = {};
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
    if (this.router.url.split('?')[0] != this.dashboardService.m_current_route) {
      this.ngOnInit()
    }
  }

  ngOnInit(): void {
    this.consolidatedCallbackModel = {
      ...this.dashboardService.consolidatedCallbackModel
    } as ConsolidatedCallbackModel;

    this.populateGroupedResults();

    combineLatest([this.route.queryParams, this.route.url]).pipe(distinctUntilChanged()).subscribe(([params, urlSegments]) => {
      this.query = params['q'];
      this.dashboardService.consolidatedParamModel.q = params['q'] || '';
      this.dashboardService.consolidatedParamModel.page = params['page'] || '1';

      this.dashboardService.consolidatedParamModel.category = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';

      if (this.firstTrigger && Object.keys(this.groupedResults).length > 0) {
        this.isLoading.set(false);
        this.query = this.dashboardService.consolidatedParamModel.q;
      } else {
        this.cdr.detectChanges();
        this.fetchSearchResults();
      }

      this.firstTrigger = false;
    });
  }

  fetchSearchResults(_ = false): void {
    if (this.checkProfile() && !this.hasIOCs()) {
      return
    }
    this.liveApiSearchComponent.runSearch(this.dashboardService.consolidatedParamModel.q)
    this.domainScanComponent.runScan(this.dashboardService.consolidatedParamModel.q);
    if (!this.isGrouped) {
      this.fetchRanked()
      return
    }

    if (this.isLoading()) return;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = '';
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' }).then();
    }

    this.isLoading.set(true);

    const cleanedParams: any = {};

    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      if (value != null && value !== '') cleanedParams[key] = value;
    });
    this.router.navigate([], {
      queryParams: cleanedParams, queryParamsHandling: 'merge', replaceUrl: true, relativeTo: this.route
    }).then(() => {
      this.cdr.detectChanges();
    });

    const category = this.route.snapshot.routeConfig?.path;
    if (category && ALLOWED_CONSOLIDATED_RANKED_SINGLETON.has(category)) {
      this.isGrouped = true
      this.dashboardService.consolidatedParamModel.category = category
    }

    if (this.checkProfile()) {
      this.dashboardService.consolidatedParamModel.profile = true
    }

    this.dashboardService.fetchConsolidatedGroupedResults('search/consolidated', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(500).pipe(map(() => response)))).subscribe(response => {
      if (response.success && response.data) {
        this.response = response.data
        this.consolidatedCallbackModel = this.response;
        this.dashboardService.consolidatedCallbackModel = this.consolidatedCallbackModel;
        this.populateGroupedResults();
      } else {
        this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
        this.groupedResults = {};
      }

      this.isLoading.set(false);
    });
  }

  resetFilters(_: void) {
    this.fetchSearchResults(true);
  }

  reloadFilters(_: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1
    this.fetchSearchResults();
  }

  fetchRanked() {
    if (this.checkProfile() && !this.hasIOCs()) {
      return;
    }
    this.isLoading.set(true);
    this.rankedResult = new RankedCallbackModel();
    this.dashboardService
      .fetchConsolidatedRankededResults('search/consolidated/ranked', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(500).pipe(map(() => response))))
      .subscribe(response => {
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


    this.result_count = Object.values(this.groupedResults).reduce(
      (sum, list) => sum + list.length,
      0
    );
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  getTotalResultCount(): number {
    const groupedCount = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
    const rankedCount = this.rankedResult.pageCount;
    if (this.isGrouped) {
      return groupedCount
    } else {
      return rankedCount
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
    let second_category = "all"
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
        second_category = this.socialCategories[0].toLowerCase()
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
    if (tab == "Group") {
      this.isGrouped = true
      this.fetchSearchResults();
    } else if (tab == "Ranked") {
      this.isGrouped = false
      this.fetchRanked()
    }
  }

  checkProfile(): boolean {
    const url = this.router.url;
    const parts = url.split('/');
    return parts.includes('profile');
  }

  hasIOCs(): boolean {
    const categories = this.appService.configData().localSettings.entityfilterCategories;
    return Object.values(categories).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0
    );
  }

  shouldShowSection(): boolean {
    const totalResults = this.getTotalResultCount();
    const hasAnyData = totalResults > 0;
    if (!this.checkProfile()) {
      return hasAnyData;
    }
    return hasAnyData && this.hasIOCs();
  }
}
