import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppService } from '../../../../services/core/app.service';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { SocialParamModel } from '../../../model/results/social/social.param.model';
import { SocialCallbackModel } from '../../../model/results/social/social.callback.model';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import {PaginationComponent} from '../../pagination/pagination.component';
import {NgIf} from '@angular/common';
import {ResultComponent} from '../../result/result.component';
import {
  DashboardResultSocialComponent
} from '../dashboard-results/dashboard-result-social/dashboard-result-social.component';

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
  public socialParamModel: SocialParamModel = new SocialParamModel();
  public socialCallbackModel: SocialCallbackModel = new SocialCallbackModel();

  query = "";
  isLoading = false;
  firstTrigger = true;
  result_count = 0;
  m_platform = ""
  protected readonly Math = Math;

  constructor(
    public appService: AppService,
    public dashboardService: DashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  get currentResultCount(): number {
    return this.socialCallbackModel.Page_Count ?? 0;
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.socialParamModel.mSearchParamPage);
  }

  ngOnInit(): void {
    this.socialCallbackModel = { ...this.dashboardService.socialCallbackModel } as SocialCallbackModel;
    this.result_count = this.socialCallbackModel.Result.length;

    const lastSegment = this.route.snapshot.url.at(-1)?.path;
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.socialParamModel.q = params['q'] || '';
        this.socialParamModel.mSearchParamPage = params['mSearchParamPage'] || '1'
        if (lastSegment)
          this.socialParamModel.mPlatform = lastSegment
          this.m_platform = this.socialParamModel.mPlatform
          if (this.dashboardService.socialParamModel.mPlatform != lastSegment){
            this.dashboardService.socialCallbackModel.Result = []
            this.firstTrigger = false
          }

        if (this.firstTrigger && this.socialCallbackModel.Result.length > 0) {
          this.isLoading = false;
          this.query = this.socialParamModel.q;
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }
        this.firstTrigger = false;
      });
  }

  fetchSearchResults(reset = false): void {
    if (reset) this.socialParamModel.mSearchParamPage = 1;

    if (!this.socialParamModel.q) {
      this.isLoading = false;
      this.socialParamModel.q = "";
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading = true;

    const cleanedParams: any = {
      q: this.socialParamModel.q,
      mSearchParamPage: this.socialParamModel.mSearchParamPage
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

    this.dashboardService.socialParamModel = this.socialParamModel
    this.dashboardService
      .fetchSearchResults<SocialCallbackModel>('social', this.socialParamModel)
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
    this.socialParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.socialParamModel.q = query;
  }
}
