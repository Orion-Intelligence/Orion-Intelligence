import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { DashboardResultsGridComponent } from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import { PaginationComponent } from '../../pagination/pagination.component';
import { InsightsComponent } from '../../insights/insights.component';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { Analytics } from '../../../model/analytics/analytics.model';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { GeneralCallbackModel, GeneralResultItem } from '../../../model/results/general/general.callback.model';
import { LeakCallbackModel, LeakResultItem } from '../../../model/results/leak/leak.callback.model';
import { GeneralParamModel } from '../../../model/results/shared/general.param.model';
import { Category } from '../../../enums/pages';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ResultComponent } from '../../result/result.component';
import { general_filters } from '../../../constants/filters';
import { AppService } from '../../../../services/core/app.service';

@Component({
  selector: 'app-dashboard-general', imports: [NgIf, PaginationComponent, InsightsComponent, DashboardResultsGridComponent, ResultComponent], templateUrl: './dashboard-general.component.html', animations: [fadeInDashboardItem],
})
export class DashboardGeneralComponent implements OnInit, AfterViewInit {

  public generalParamModel: GeneralParamModel = new GeneralParamModel();
  public generalCallbackModel: GeneralCallbackModel = new GeneralCallbackModel();
  public leakCallbackModel: LeakCallbackModel = new LeakCallbackModel();

  query: string = ""
  analyticsData = {} as Analytics;
  type = Category.STRATEGIC

  onToggleAnalytics = false;
  isLoading = false;
  firstTrigger = true

  constructor(public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.generalParamModel.mSearchParamPage)
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.data['type'];
    this.generalParamModel = { ...this.dashboardService.generalParamModel } as GeneralParamModel;
    this.generalCallbackModel = { ...this.dashboardService.generalCallbackModel } as GeneralCallbackModel;
    this.leakCallbackModel = { ...this.dashboardService.leakCallbackModel } as LeakCallbackModel;

    this.initAnalytics()
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        this.query = params['q'];
        this.generalParamModel.q = params['q'] || '';
        this.generalParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';
        this.generalParamModel.mSearchParamSafeSearch = params['mSearchParamSafeSearch'] === 'true';
        this.generalParamModel.mDateRange = params['mDateRange'] || '';
        this.generalParamModel.mNetwork = params['mNetwork'] || 'all';

        this.generalParamModel.mSearchParamType = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';
        if (this.firstTrigger && ((this.generalCallbackModel.Result.length > 0 && this.type == Category.STRATEGIC) || (this.leakCallbackModel.Result.length > 0 && this.type == Category.BREACH))) {
          this.isLoading = false;
          if (this.generalParamModel.q)
            this.query = this.generalParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  initAnalytics() {
    if (this.type === Category.STRATEGIC) {
      this.analyticsData = this.dashboardService.generateAnalytics(this.generalCallbackModel?.Result || []);
    } else if (this.type === Category.BREACH) {
      this.analyticsData = this.dashboardService.generateAnalytics(this.leakCallbackModel?.Result || []);
    }
  }

  fetchSearchResults(reset: boolean = false) {
    if (this.isLoading) return;
    if (reset)
      this.generalParamModel.mSearchParamPage = 1

    if (!this.generalParamModel.q) {
      this.isLoading = false;
      this.generalParamModel.q = ""
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading = true;

    const apiEndpoint = this.type === Category.STRATEGIC ? 'search/strategic' : 'search/breach';

    const cleanedParams: any = {};

    Object.entries(this.generalParamModel).forEach(([key, value]) => {
      const isDefault =
        (key === 'mSearchParamSafeSearch' && value === false) ||
        (key === 'mNetwork' && value === 'all') ||
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

    this.dashboardService.fetchSearchResults<GeneralCallbackModel | LeakCallbackModel>(apiEndpoint, this.generalParamModel)
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


  onPageChange(step: number) {
    this.generalParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  resetFilters(_: void) {
    this.generalParamModel.mSearchParamType = "all";
    this.generalParamModel.mSearchParamPage = 1;
    this.generalParamModel.mSearchParamSafeSearch = false;
    this.generalParamModel.mNetwork = "all";
    this.generalParamModel.mDateRange = "";
    this.generalParamModel.mContentType = "all";
    this.generalParamModel.mEntity = "";

    this.fetchSearchResults(true);
  }

  reloadFilters(event: { [key: string]: string | null }) {
    this.generalParamModel.mSearchParamPage = 1
    if (event['mNetwork'] != null) {
      this.generalParamModel.mNetwork = event['mNetwork'];
    }
    if (event['mDateRange']) {
      this.generalParamModel.mDateRange = event['mDateRange']
    }
    if (event['mContentType'] != null) {
      this.generalParamModel.mContentType = event['mContentType'];
    }
    if (event['mEntity'] != null) {
      this.generalParamModel.mEntity = event['mEntity'];
    }
    this.generalParamModel.mSearchParamSafeSearch = event['mSearchParamSafeSearch'] === 'yes';
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.generalParamModel.q = query
  }

  onToggleAnalyticsTrigger() {
    this.onToggleAnalytics = !this.onToggleAnalytics
  }

  get currentCallbackModel(): GeneralCallbackModel | LeakCallbackModel {
    return this.type === Category.STRATEGIC ? this.generalCallbackModel : this.leakCallbackModel;
  }

  get currentParamModel(): GeneralParamModel {
    return this.type === Category.STRATEGIC ? this.generalParamModel : this.generalParamModel;
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


  protected readonly Math = Math;
  protected readonly general_filters = general_filters;
}
