import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { AppService } from '../../../../../services/core/app/app.service';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ChatCallbackModel } from '../../../../model/results/chat/chat.callback.model';
import { NgForOf, NgIf } from '@angular/common';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { ResultComponent } from '../../../result/result.component';
import { DashboardResultChatComponent } from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { chat_filters } from '../../../../constants/filters';
import { SortType } from '../../../../constants/shared-enums';
import { HelperService } from '../../../../services/helper.service';
import { RankedCallbackModel } from '../../../../model/results/consolidated/ranked.callback.model';
import { DashboardResultSocialComponent } from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import {SocialCallbackModel} from '../../../../model/results/social/social.callback.model';

@Component({
  selector: 'app-dashboard-discussion',
  imports: [
    NgIf,
    PaginationComponent,
    ResultComponent,
    DashboardResultChatComponent,
    DashboardResultSocialComponent,
    NgForOf
  ],
  templateUrl: './dashboard-discussion.component.html',
  animations: [fadeInDashboardItem],
  standalone: true
})
export class DashboardDiscussionComponent implements OnInit, AfterViewInit {
  public isResponseLoading = signal(false);
  public discussionCallbackModel: RankedCallbackModel = new RankedCallbackModel();

  query = '';
  firstTrigger = true;
  result_count = 0;

  protected readonly Math = Math;
  protected readonly chat_filters = chat_filters;

  constructor(
    protected helperService: HelperService,
    public appService: AppService,
    public dashboardService: DashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  get currentResultCount(): number {
    return this.discussionCallbackModel.pageCount ?? 0;
  }

  ngAfterViewInit(): void {
    if (this.router.url.split('?')[0] !== this.dashboardService.m_current_route) {
      this.fetchSearchResults();
    }
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
  }

  ngOnInit(): void {
    this.discussionCallbackModel = this.toRankedModel(this.dashboardService.chatCallbackModel as unknown as ChatCallbackModel);
    this.result_count = this.discussionCallbackModel.result.length;

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, url]) => {
        this.setCategoryFromUrl(url as UrlSegment[]);
        this.query = params['q'];
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1';

        const route: string = this.router.url.split('?')[0];
        if (String(route) != this.dashboardService.m_current_route) {
          this.dashboardService.rankedResult = new RankedCallbackModel()
          this.dashboardService.socialCallbackModel = new SocialCallbackModel();
        }

        if (this.firstTrigger && this.discussionCallbackModel.result.length > 0) {
          this.isResponseLoading.set(false);
          this.query = this.dashboardService.consolidatedParamModel.q;
        } else if (!this.hasResultsInService()) {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        } else if(this.dashboardService.rankedResult.result.length==0 && this.dashboardService.socialCallbackModel.Result.length==0){
          this.fetchSearchResults();
        }

        this.firstTrigger = false;
      });
  }

  private setCategoryFromUrl(url: UrlSegment[] | readonly UrlSegment[]): void {
    const segs = Array.isArray(url) ? url : [];
    const last = segs.length ? segs[segs.length - 1].path : '';
    this.dashboardService.consolidatedParamModel.category = last || 'all';
  }

  private toRankedModel(chat?: ChatCallbackModel | null): RankedCallbackModel {
    if (!chat) return new RankedCallbackModel();
    return new RankedCallbackModel({
      result: (chat as any)?.Result ?? [],
      pageCount: (chat as any)?.Page_Count ?? 0
    });
  }

  private hasResultsInService(): boolean {
    const svcChat = this.dashboardService.chatCallbackModel as unknown as ChatCallbackModel | null | undefined;
    const len = (svcChat as any)?.Result?.length ?? 0;
    return len > 0;
  }

  fetchSearchResults(): void {
    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isResponseLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = '';
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' }).then();
    }

    this.isResponseLoading.set(true);

    this.dashboardService
      .fetchSearchResults<ChatCallbackModel>('search/discussion', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.discussionCallbackModel = this.toRankedModel(response.data as ChatCallbackModel);
          this.dashboardService.rankedResult = this.toRankedModel(response.data as ChatCallbackModel)
          this.dashboardService.chatCallbackModel = response.data as ChatCallbackModel;
        } else {
          this.discussionCallbackModel = new RankedCallbackModel();
        }

        this.isResponseLoading.set(false);
        this.result_count = this.discussionCallbackModel.result.length;
      });
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  resetFilters(_: void) {
    this.dashboardService.consolidatedParamModel.page = 1;
    this.fetchSearchResults();
  }

  reloadFilters(_: Record<string, string | null>) {
    this.fetchSearchResults();
  }

  onToggleSort(sort: SortType) {
    let key = 'm_message_date';
    let order: 'asc' | 'desc' = 'asc';

    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    } else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    } else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults();
      return;
    }

    this.discussionCallbackModel.result = this.helperService.sortByKey<any>(
      this.discussionCallbackModel.result,
      key,
      order
    );
    this.cdr.detectChanges();
  }
}
