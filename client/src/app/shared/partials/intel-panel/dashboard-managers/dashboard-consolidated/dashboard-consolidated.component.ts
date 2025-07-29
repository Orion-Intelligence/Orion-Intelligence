import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppService} from '../../../../../services/core/app.service';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {ResultComponent} from '../../../result/result.component';
import {DashboardResultsGeneralGridComponent} from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';
import {ConsolidatedCallbackModel} from '../../../../model/results/consolidated/consolidated.callback.model';
import {DashboardResultExploitComponent} from '../../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import {DashboardResultChatComponent} from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {SortGroupedResultsPipe} from '../../../../model/pipes/sort-grouped-results.pipe';
import {ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, FeedSubCategory, GeneralSubCategory, SocialSubCategory} from '../../../../constants/pages';
import {SelectionStoreService} from '../../../../../services/dashboard/selection.service';
import {TooltipDirective} from '../../../../directive/tooltip-directive.directive';
import {DashboardResultSocialComponent} from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import {ResultInsightsComponent} from "../result-insights/result-insights.component";
import {consolidated_filters} from '../../../../constants/filters';
import {ALLOWED_CONSOLIDATED_RANKED_SINGLETON} from '../../../../constants/shared-enums';

@Component({
  selector: 'app-dashboard-consolidated',
  standalone: true,
  imports: [NgIf, ResultComponent, DashboardResultsGeneralGridComponent, NgForOf, TitleCasePipe, DashboardResultExploitComponent, DashboardResultChatComponent, SortGroupedResultsPipe, TooltipDirective, DashboardResultSocialComponent, ResultInsightsComponent],
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
  public respons: any;
  public pageCounts: { [key: string]: number } = {};

  isGrouped = true
  query = '';
  isLoading = false;
  firstTrigger = true;
  result_count = 0;
  apiCategories = Object.values(ApiSubCategory);
  dumpCategories = Object.values(DumpSubCategory);
  newsCategories = Object.values(FeedSubCategory);
  socialCategories = Object.values(SocialSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  rankedResult: any[] = [];

  constructor(public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected selectionStore: SelectionStoreService) {
    this.pageCounts = {};
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
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
        this.isLoading = false;
        this.query = this.dashboardService.consolidatedParamModel.q;
      } else {
        this.cdr.detectChanges();
        this.fetchSearchResults();
      }

      this.firstTrigger = false;
    });
  }

  fetchSearchResults(_ = false): void {
    if (!this.isGrouped) {
      this.fetchRanked()
      return
    }

    if (this.isLoading) return;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading = false;
      this.dashboardService.consolidatedParamModel.q = '';
      this.router.navigate([], {queryParams: {}, queryParamsHandling: ''}).then();
    }

    this.isLoading = true;

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

    this.dashboardService.fetchConsolidatedGroupedResults('search/consolidated', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(500).pipe(map(() => response)))).subscribe(response => {
      if (response.success && response.data) {
        this.respons = response.data;
        this.consolidatedCallbackModel = response.data;
        this.dashboardService.consolidatedCallbackModel = this.consolidatedCallbackModel;
        this.populateGroupedResults();
      } else {
        this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
        this.groupedResults = {};
      }

      this.isLoading = false;
    });
  }

  resetFilters(_: void) {
    this.dashboardService.consolidatedParamModel.daterange = "";
    this.dashboardService.consolidatedParamModel.network = "";
    this.dashboardService.consolidatedParamModel.entity = "";
    this.dashboardService.consolidatedParamModel.content = "all";

    this.fetchSearchResults(true);
  }

  reloadFilters(event: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1
    if (event['network']) {
      this.dashboardService.consolidatedParamModel.network = event['network']
    }
    if (event['daterange']) {
      this.dashboardService.consolidatedParamModel.daterange = event['daterange']
    }
    if (event['entity'] != null) {
      this.dashboardService.consolidatedParamModel.entity = event['entity'];
    }
    if (event['content'] != null) {
      this.dashboardService.consolidatedParamModel.content = event['content'];
    }
    this.fetchSearchResults();
  }

  fetchRanked() {
    this.isLoading = true;
    this.rankedResult = []
    this.dashboardService.fetchConsolidatedRankededResults('search/consolidated/ranked', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(500).pipe(map(() => response)))).subscribe(response => {
      if (response.success && response.data) {
        this.rankedResult = response.data;
      }
      this.isLoading = false;
    });
  }

  populateGroupedResults(): void {
    this.groupedResults = {};
    this.pageCounts = {};

    if (this.consolidatedCallbackModel['leak_model']?.Result?.length) {
      this.groupedResults['leak_model'] = this.consolidatedCallbackModel['leak_model'].Result;
      this.pageCounts['leak_model'] = this.consolidatedCallbackModel['leak_model'].Page_Count ?? 0;
    }

    if (this.consolidatedCallbackModel['chat_model']?.Result?.length) {
      this.groupedResults['chat_model'] = this.consolidatedCallbackModel['chat_model'].Result;
      this.pageCounts['chat_model'] = this.consolidatedCallbackModel['chat_model'].Page_Count ?? 0;
    }

    if (this.consolidatedCallbackModel['defacement_model']?.Result?.length) {
      this.groupedResults['defacement_model'] = this.consolidatedCallbackModel['defacement_model'].Result;
      this.pageCounts['defacement_model'] = this.consolidatedCallbackModel['defacement_model'].Page_Count ?? 0;
    }

    if (this.consolidatedCallbackModel['generic_model']?.Result?.length) {
      this.groupedResults['generic_model'] = this.consolidatedCallbackModel['generic_model'].Result;
      this.pageCounts['generic_model'] = this.consolidatedCallbackModel['generic_model'].Page_Count ?? 0;
    }

    if (this.consolidatedCallbackModel['exploit_model']?.Result?.length) {
      this.groupedResults['exploit_model'] = this.consolidatedCallbackModel['exploit_model'].Result;
      this.pageCounts['exploit_model'] = this.consolidatedCallbackModel['exploit_model'].Page_Count ?? 0;
    }

    if (this.consolidatedCallbackModel['social_model']?.Result?.length) {
      this.groupedResults['social_model'] = this.consolidatedCallbackModel['social_model'].Result;
      this.pageCounts['social_model'] = this.consolidatedCallbackModel['social_model'].Page_Count ?? 0;
    }
    this.result_count = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  getTotalResultCount(): number {
    const groupedCount = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
    const rankedCount = this.rankedResult?.length || 0;
    return groupedCount + rankedCount;
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
        firstSubcategory = this.socialCategories[1];
        second_category = this.socialCategories[1].toLowerCase()
        break;
    }

    if (firstSubcategory) {
      this.selectionStore.setSelectedOption(firstSubcategory);
    }
    const routePrefix = '/dashboard/' + section.toLowerCase() + '/' + second_category;
    this.router.navigate([routePrefix], {
      queryParams: {page: 1}, queryParamsHandling: 'merge'
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
}
