import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppService} from '../../../../../services/core/app.service';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {SocialCallbackModel} from '../../../../model/results/social/social.callback.model';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {PaginationComponent} from '../../../pagination/pagination.component';
import {NgIf} from '@angular/common';
import {ResultComponent} from '../../../result/result.component';
import {
  DashboardResultSocialComponent
} from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import {SortType} from '../../../../constants/shared-enums';
import {HelperService} from '../../../../services/helper.service';

@Component({
  selector: 'app-dashboard-socials',
  standalone: true,
  imports: [
    PaginationComponent,
    NgIf,
    ResultComponent,
    DashboardResultSocialComponent
  ],
  templateUrl: './dashboard-social.component.html',
  animations: [fadeInDashboardItem]
})
export class DashboardSocialsComponent implements OnInit, AfterViewInit {
  public socialCallbackModel: SocialCallbackModel = new SocialCallbackModel();
  protected readonly Math = Math;

  query = "";
  isLoading = false;
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
    return this.socialCallbackModel.Page_Count ?? 0;
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
  }

  ngOnInit(): void {
    this.socialCallbackModel = {...this.dashboardService.socialCallbackModel} as SocialCallbackModel;
    this.result_count = this.socialCallbackModel.Result.length;

    const lastSegment = this.route.snapshot.url.at(-1)?.path;
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1'
        if (lastSegment)
          this.dashboardService.consolidatedParamModel.platform = lastSegment
        this.m_platform = this.dashboardService.consolidatedParamModel.platform
        if (this.dashboardService.consolidatedParamModel.platform != lastSegment) {
          this.dashboardService.socialCallbackModel.Result = []
          this.firstTrigger = false
        }

        if (this.firstTrigger && this.socialCallbackModel.Result.length > 0) {
          this.isLoading = false;
          this.query = this.dashboardService.consolidatedParamModel.q;
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }
        this.firstTrigger = false;
      });
  }

  fetchSearchResults(reset = false): void {
    if (reset) this.dashboardService.consolidatedParamModel.page = 1;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading = false;
      this.dashboardService.consolidatedParamModel.q = "";
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading = true;

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
      this.isLoading = false;
      return;
    }

    this.dashboardService
      .fetchSearchResults<SocialCallbackModel>('social', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.socialCallbackModel = response.data as SocialCallbackModel;
          this.dashboardService.socialCallbackModel = response.data as SocialCallbackModel;
        } else {
          this.socialCallbackModel = new SocialCallbackModel();
        }
        this.isLoading = false;
        this.result_count = this.socialCallbackModel.Result.length;
      });
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
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

    this.socialCallbackModel.Result = this.helperService.sortByKey<any>(
      this.socialCallbackModel.Result,
      key,
      order
    );
    this.cdr.detectChanges();
  }
}
