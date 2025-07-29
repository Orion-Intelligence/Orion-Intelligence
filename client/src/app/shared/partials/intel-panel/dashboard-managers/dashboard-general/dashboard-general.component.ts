import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgIf} from '@angular/common';
import {
  DashboardResultsGeneralGridComponent
} from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';
import {PaginationComponent} from '../../../pagination/pagination.component';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {Analytics} from '../../../../model/analytics/analytics.model';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {GeneralCallbackModel, GeneralResultItem} from '../../../../model/results/general/general.callback.model';
import {LeakCallbackModel, LeakResultItem} from '../../../../model/results/leak/leak.callback.model';
import {Category} from '../../../../constants/pages';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ResultComponent} from '../../../result/result.component';
import {general_filters} from '../../../../constants/filters';
import {AppService} from '../../../../../services/core/app.service';
import {DashboardResultChatComponent} from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {ChatCallbackModel} from '../../../../model/results/chat/chat.callback.model';
import {DiscussionService} from '../../../../services/discussion.service';
import {HelperService} from '../../../../services/helper.service';
import {SortType} from '../../../../constants/shared-enums';
import {ConsolidatedParamModel} from '../../../../model/results/consolidated/consolidated.param.model';

@Component({
  selector: 'app-dashboard-general',
  imports: [NgIf, PaginationComponent, DashboardResultsGeneralGridComponent, ResultComponent, DashboardResultChatComponent],
  templateUrl: './dashboard-general.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardGeneralComponent implements OnInit, AfterViewInit {

  protected readonly Math = Math;
  protected readonly general_filters = general_filters;
  protected readonly Category = Category;

  public generalCallbackModel: GeneralCallbackModel = new GeneralCallbackModel();
  public leakCallbackModel: LeakCallbackModel = new LeakCallbackModel();
  public discussionCallbackModel: ChatCallbackModel = new ChatCallbackModel();

  query = ""
  analyticsData = {} as Analytics;
  type = Category.STRATEGIC
  discussionLoaded = false

  onToggleAnalytics = false;
  onToggleDiscussion = false;
  isLoading = false;
  firstTrigger = true

  constructor(protected helperService: HelperService, protected discussionService: DiscussionService, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  get currentCallbackModel(): GeneralCallbackModel | LeakCallbackModel {
    return this.type === Category.STRATEGIC ? this.generalCallbackModel : this.leakCallbackModel;
  }

  get currentParamModel(): ConsolidatedParamModel {
    return this.type === Category.STRATEGIC ? this.dashboardService.consolidatedParamModel : this.dashboardService.consolidatedParamModel;
  }

  get currentResultCount(): number {
    return this.currentCallbackModel?.Result?.length ?? 0;
  }

  get currentSearchResults(): (GeneralResultItem | LeakResultItem)[] {
    return this.currentCallbackModel?.Result ?? [];
  }

  get currentQuery(): string {
    return this.currentParamModel?.q ?? '';
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page)
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.data['type'];

    this.generalCallbackModel = {...this.dashboardService.generalCallbackModel} as GeneralCallbackModel;
    this.leakCallbackModel = {...this.dashboardService.leakCallbackModel} as LeakCallbackModel;

    this.initAnalytics()
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        this.query = params['q'];
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1';
        this.dashboardService.consolidatedParamModel.safe = params['safe'] === 'true';
        this.dashboardService.consolidatedParamModel.daterange = params['daterange'] || '';
        this.dashboardService.consolidatedParamModel.network = params['network'] || 'all';

        this.dashboardService.consolidatedParamModel.category = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';
        if (this.firstTrigger && ((this.generalCallbackModel.Result.length > 0 && this.type == Category.STRATEGIC) || (this.leakCallbackModel.Result.length > 0 && (this.type == Category.BREACH || this.type == Category.FEED)))) {
          this.isLoading = false;
          if (this.dashboardService.consolidatedParamModel.q)
            this.query = this.dashboardService.consolidatedParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  initAnalytics() {
    if (this.type === Category.STRATEGIC) {
      this.analyticsData = this.dashboardService.generateAnalytics(this.generalCallbackModel?.Result ?? []);
    } else if (this.type === Category.BREACH) {
      this.analyticsData = this.dashboardService.generateAnalytics(this.leakCallbackModel?.Result ?? []);
    }
  }

  fetchSearchResults(reset = false, _ = false) {
    if (this.isLoading) return;
    if (reset)
      this.dashboardService.consolidatedParamModel.page = 1

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading = false;
      this.dashboardService.consolidatedParamModel.q = ""
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }
    this.isLoading = true;

    const apiEndpoint = this.type === Category.STRATEGIC ? 'search/strategic' : 'search/breach';

    const cleanedParams: any = {};

    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      const isDefault =
        (key === 'safe' && value === false) ||
        (key === 'network' && value === 'all') ||
        (value == null || value === "");

      if (!reset || !isDefault) {
        if (!isDefault) cleanedParams[key] = value;
      }
    });
    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: reset ? '' : 'merge'
    }).then();

    if (reset) {
      this.isLoading = false;
      return;
    }

    this.dashboardService.fetchSearchResults<GeneralCallbackModel | LeakCallbackModel>(apiEndpoint, this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          if (this.type === Category.STRATEGIC) {
            this.generalCallbackModel = response.data as GeneralCallbackModel;
            this.dashboardService.generalCallbackModel = response.data as GeneralCallbackModel;
          } else {
            this.leakCallbackModel = response.data as LeakCallbackModel;
            this.dashboardService.leakCallbackModel = response.data as LeakCallbackModel;
          }
        }

        this.isLoading = false;
        this.initAnalytics();
      });
  }

  fetchSuggestion() {
    if (this.discussionCallbackModel.Result.length > 0) {
      return;
    }
    this.isLoading = true;
    this.discussionService.fetchSuggestions(this.query, "breach")
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.discussionCallbackModel = response.data as ChatCallbackModel;
        }

        this.isLoading = false;
        this.discussionLoaded = true;
      });
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  resetFilters(_: void) {
    this.dashboardService.consolidatedParamModel.category = "all";
    this.dashboardService.consolidatedParamModel.page = 1;
    this.dashboardService.consolidatedParamModel.safe = false;
    this.dashboardService.consolidatedParamModel.network = "all";
    this.dashboardService.consolidatedParamModel.daterange = "";
    this.dashboardService.consolidatedParamModel.content = "all";
    this.dashboardService.consolidatedParamModel.entity = "";

    this.fetchSearchResults(true);
  }

  reloadFilters(filters: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1
    if (filters['network'] != null) {
      this.dashboardService.consolidatedParamModel.network = filters['network'];
    }
    if (filters['daterange']) {
      this.dashboardService.consolidatedParamModel.daterange = filters['daterange']
    }
    if (filters['content'] != null) {
      this.dashboardService.consolidatedParamModel.content = filters['content'];
    }
    this.dashboardService.consolidatedParamModel.safe = filters['safe'] === 'yes';
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query
  }

  onToggleAnalyticsTrigger(tab: string): void {
    if (tab == "Discussion") {
      this.onToggleAnalytics = false
      this.onToggleDiscussion = true
      this.fetchSuggestion()
    } else {
      this.onToggleAnalytics = false
      this.onToggleDiscussion = false
    }
  }

  onToggleSort(sort: SortType) {
    let key;
    let order: 'asc' | 'desc' = 'asc';

    if (this.type === Category.BREACH) {
      key = 'm_leak_date';
    } else {
      key = 'm_update_date';
    }

    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    } else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    } else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults(true);
      return;
    }

    this.currentCallbackModel.Result = this.helperService.sortByKey<any>(
      this.currentCallbackModel.Result,
      key,
      order
    );

    this.cdr.detectChanges();
  }
}
