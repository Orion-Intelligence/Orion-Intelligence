import {AfterViewInit, ChangeDetectorRef, Component, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';
import {DashboardResultsGeneralGridComponent} from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';
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
import {AppService} from '../../../../../services/core/app/app.service';
import {DashboardResultChatComponent} from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {ChatCallbackModel} from '../../../../model/results/chat/chat.callback.model';
import {DiscussionService} from '../../../../services/discussion.service';
import {HelperService} from '../../../../services/helper.service';
import {SortType} from '../../../../constants/shared-enums';
import {ConsolidatedParamModel} from '../../../../model/results/consolidated/consolidated.param.model';
import {DashboardResultExploitComponent} from '../../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import {DashboardResultSocialComponent} from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';

@Component({
  selector: 'app-dashboard-general',
  imports: [NgIf, PaginationComponent, DashboardResultsGeneralGridComponent, ResultComponent, DashboardResultChatComponent, DashboardResultExploitComponent, DashboardResultSocialComponent, NgForOf],
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
  public isResponseLoading = signal(false);

  query = ""
  analyticsData = {} as Analytics;
  rankedResult: any[] = [];
  type = Category.STRATEGIC
  discussionLoaded = false

  onToggleAnalytics = false;
  onToggleDiscussion = false;
  firstTrigger = true

  constructor(protected helperService: HelperService, protected discussionService: DiscussionService, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  get currentCallbackModel(): GeneralCallbackModel | LeakCallbackModel {
    return this.type === Category.STRATEGIC ? this.generalCallbackModel : this.leakCallbackModel;
  }

  get currentParamModel(): ConsolidatedParamModel {
    return this.dashboardService.consolidatedParamModel;
  }

  get currentResultCount(): number {
    if (this.getRoute() == 'all') {
      return this.discussionCallbackModel.Result.length
    } else {
      return this.dashboardService.socialCallbackModel.Page_Count ?? 0;
    }
  }

  getRoute() {
    return this.router.url.split('?')[0].split('/')[3]
  }

  get currentSearchResults(): (GeneralResultItem | LeakResultItem)[] {
    return this.currentCallbackModel?.Result ?? [];
  }

  get currentQuery(): string {
    return this.currentParamModel?.q ?? '';
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page)
    const route: string = this.router.url.split('?')[0];
    if (String(route) != this.dashboardService.m_current_route) {
      this.fetchSearchResults()
    }
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

        this.dashboardService.consolidatedParamModel.category = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';
        if (this.firstTrigger && ((this.generalCallbackModel.Result.length > 0 && this.type == Category.STRATEGIC) || (this.leakCallbackModel.Result.length > 0 && (this.type == Category.BREACH || this.type == Category.FEED)))) {

          this.isResponseLoading.set(false);
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

  isConsolidatedResult(){
    const lastSegment = this.route.snapshot.url.at(-1)?.path;
    return !!(lastSegment && ["all", "email", "logs", "warfare", "cloud"].includes(lastSegment));
  }

  fetchSearchResults() {
    if (this.isResponseLoading()) return;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isResponseLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = ""
    }
    this.isResponseLoading.set(true);

    this.dashboardService.generalCallbackModel = new GeneralCallbackModel()
    this.rankedResult = []
    if (this.isConsolidatedResult()) {
      const lastSegment = this.route.snapshot.url.at(-1)?.path;
      if(lastSegment){
        this.dashboardService.consolidatedParamModel.category = lastSegment
      }
      this.dashboardService.fetchConsolidatedRankededResults('search/breach', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(500).pipe(map(() => response)))).subscribe(response => {
        if (response.success && response.data) {
          this.rankedResult = response.data;
        }
        this.isResponseLoading.set(false);
      });
    } else {
      const apiEndpoint = this.type === Category.STRATEGIC ? 'search/strategic' : 'search/breach';
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

          this.isResponseLoading.set(false)
          this.initAnalytics();
        });
    }
  }

  fetchSuggestion() {
    if (this.discussionCallbackModel.Result.length > 0) {
      return;
    }
    this.isResponseLoading.set(true)
    this.discussionService.fetchSuggestions(this.query, "breach")
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.discussionCallbackModel = response.data as ChatCallbackModel;
        }

        this.isResponseLoading.set(false)
        this.discussionLoaded = true;
      });
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  reloadFilters(_: Record<string, string | null>) {
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query
  }

  onToggleSubMenu(tab: string): void {
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

      this.fetchSearchResults();
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
