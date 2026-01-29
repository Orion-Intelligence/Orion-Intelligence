import {AfterViewInit, ChangeDetectorRef, Component, OnInit, signal} from '@angular/core';
import {AppService} from '../../../../../services/core/app/app.service';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {SocialCallbackModel} from '../../../../model/results/social/social.callback.model';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {PaginationComponent} from '../../../pagination/pagination.component';
import {NgForOf, NgIf} from '@angular/common';
import {ResultComponent} from '../../../result/result.component';
import {DashboardResultSocialComponent} from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import {SortType} from '../../../../constants/shared-enums';
import {HelperService} from '../../../../services/helper.service';
import {social_filters} from '../../../../constants/filters';
import {DashboardResultChatComponent} from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {DashboardResultExploitComponent} from '../../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import {DashboardResultsGeneralGridComponent} from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';

@Component({
  selector: 'app-dashboard-socials',
  standalone: true,
  imports: [
    PaginationComponent,
    NgIf,
    ResultComponent,
    DashboardResultSocialComponent,
    DashboardResultChatComponent,
    DashboardResultExploitComponent,
    DashboardResultsGeneralGridComponent,
    NgForOf
  ],
  templateUrl: './dashboard-social.component.html',
  animations: [fadeInDashboardItem]
})
export class DashboardSocialsComponent implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  protected readonly filter = social_filters;

  query = "";
  isLoading = signal(false);
  firstTrigger = true;
  result_count = 0;
  m_platform = ""

  constructor(
    protected helperService: HelperService,
    public appService: AppService,
    public dashboardService: DashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
  }

  get currentResultCount(): number {
    if (this.getRoute() == 'all') {
      return this.dashboardService.rankedResult.pageCount
    } else {
      return this.dashboardService.socialCallbackModel.Page_Count ?? 0;
    }
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
  }

  ngOnInit(): void {
    this.dashboardService.socialCallbackModel = {...this.dashboardService.socialCallbackModel} as SocialCallbackModel;
    this.result_count = this.dashboardService.socialCallbackModel.Result.length;
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1'

        const lastSegment = this.route.snapshot.url.at(-1)?.path;
        if (lastSegment)
          this.dashboardService.consolidatedParamModel.platform = lastSegment

        if (this.router.url.split('?')[0] != this.dashboardService.m_current_route) {
          this.fetchSearchResults()
        } else if (this.firstTrigger && this.currentResultCount > 0) {
          this.isLoading.set(false);
          this.query = this.dashboardService.consolidatedParamModel.q;
        } else if(this.dashboardService.rankedResult.pageCount==0){
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }
        this.firstTrigger = false;
      });
  }

  getRoute() {
    return this.router.url.split('?')[0].split('/')[3]
  }


  fetchSearchResults(reset = false): void {
    if (reset) this.dashboardService.consolidatedParamModel.page = 1;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = "";
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading.set(true);

    const cleanedParams: any = {
      q: this.dashboardService.consolidatedParamModel.q,
      page: this.dashboardService.consolidatedParamModel.page
    };

    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: reset ? '' : 'merge',
      replaceUrl: true,
      relativeTo: this.route
    }).then(() => {
      this.cdr.detectChanges();
    });

    if (reset) {
      this.isLoading.set(false);
      return;
    }

    const lastSegment = this.route.snapshot.url.at(-1)?.path;
    this.dashboardService.clearCallback()
    if (lastSegment == "all") {
      this.dashboardService
        .fetchConsolidatedRankededResults('social/all', this.dashboardService.consolidatedParamModel)
        .pipe(switchMap(response => timer(500).pipe(map(() => response))))
        .subscribe(response => {
          if (response.success && response.data) {
            this.dashboardService.rankedResult = response.data;
          }
          this.isLoading.set(false);
        });
    } else {
      this.dashboardService
        .fetchSearchResults<SocialCallbackModel>('social', this.dashboardService.consolidatedParamModel)
        .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
        .subscribe(response => {
          if (response.success && response.data) {
            this.dashboardService.socialCallbackModel = response.data as SocialCallbackModel;
            this.dashboardService.socialCallbackModel = response.data as SocialCallbackModel;
          } else {
            this.dashboardService.socialCallbackModel = new SocialCallbackModel();
          }
          this.isLoading.set(false);
          this.result_count = this.dashboardService.socialCallbackModel.Result.length;
        });
    }
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  resetFilters(_: void) {
    this.fetchSearchResults(true);
  }

  reloadFilters(_: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1
    this.fetchSearchResults();
  }

  onToggleSort(sort: SortType) {
    let key;
    let order: 'asc' | 'desc' = 'asc';

    key = 'm_message_date';

    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    } else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    } else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults(true);
      return;
    }

    this.dashboardService.socialCallbackModel.Result = this.helperService.sortByKey<any>(
      this.dashboardService.socialCallbackModel.Result,
      key,
      order
    );
    this.cdr.detectChanges();
  }
}
