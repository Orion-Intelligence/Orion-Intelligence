import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppService} from '../../../../services/core/app.service';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ChatParamModel} from '../../../model/results/chat/chat.param.model';
import {ChatCallbackModel} from '../../../model/results/chat/chat.callback.model';
import {NgIf} from '@angular/common';
import {PaginationComponent} from '../../pagination/pagination.component';
import {ResultComponent} from '../../result/result.component';
import {DashboardResultChatComponent} from '../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {chat_filters} from '../../../constants/filters';
import {ChannelTypeKeys, SortType} from '../../../constants/enums';
import {HelperService} from '../../../services/helper.service';

@Component({
  selector: 'app-dashboard-chats',
  imports: [
    NgIf,
    PaginationComponent,
    ResultComponent,
    DashboardResultChatComponent
  ],
  templateUrl: './dashboard-chats.component.html',
  animations: [fadeInDashboardItem]
})
export class DashboardChatsComponent implements OnInit, AfterViewInit {
  public chatParamModel: ChatParamModel = new ChatParamModel();
  public chatCallbackModel: ChatCallbackModel = new ChatCallbackModel();

  query = ""
  isLoading = false;
  firstTrigger = true
  result_count = 0;
  protected readonly Math = Math;
  protected readonly chat_filters = chat_filters;

  constructor(protected helperService: HelperService, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  get currentResultCount(): number {
    return this.chatCallbackModel.Page_Count ?? 0;
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.chatParamModel.mSearchParamPage)
  }

  ngOnInit(): void {
    this.chatCallbackModel = {...this.dashboardService.chatCallbackModel} as ChatCallbackModel;
    this.result_count = this.chatCallbackModel.Result.length
    const category = this.route.snapshot.routeConfig?.path;
    let isDiscussion = false
    if (category && ChannelTypeKeys.includes(category.toUpperCase())) {
      this.chatParamModel.ctype = category
      isDiscussion = true
    } else {
      this.chatParamModel.ctype = "all"
    }

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.chatParamModel.q = params['q'] || '';
        this.chatParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';

        if (!isDiscussion && this.firstTrigger && ((this.chatCallbackModel.Result.length > 0))) {
          this.isLoading = false;
          this.query = this.chatParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  fetchSearchResults(reset = false): void {
    if (reset)
      this.chatParamModel.mSearchParamPage = 1;

    if (!this.chatParamModel.q) {
      this.isLoading = false;
      this.chatParamModel.q = "";

      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading = true;

    const cleanedParams: any = {};

    Object.entries(this.chatParamModel).forEach(([key, value]) => {
      const isDefault =
        (key === 'mContentType' && value === 'all') ||
        (key === 'mDateRange' && value === '') ||
        (key === 'mEntity' && value === '') ||
        (key === 'mMitreTtp' && value === '') ||
        (value == null || value === '');

      if (!reset || !isDefault) {
        if (!isDefault) cleanedParams[key] = value;
      }
    });
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
      .fetchSearchResults<ChatCallbackModel>('chat/telegram', this.chatParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.chatCallbackModel = response.data as ChatCallbackModel;
          this.dashboardService.chatCallbackModel = response.data as ChatCallbackModel;
        } else {
          this.chatCallbackModel = new ChatCallbackModel();
        }
        this.isLoading = false;
        this.result_count = this.chatCallbackModel.Result.length;
      });
  }

  onPageChange(step: number) {
    this.chatParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.chatParamModel.q = query
  }

  resetFilters(_: void) {
    this.chatParamModel.mSearchParamPage = 1;
    this.chatParamModel.mContentType = "all";
    this.chatParamModel.mDateRange = "";
    this.chatParamModel.mEntity = "";
    this.chatParamModel.mMitreTtp = "";
    this.fetchSearchResults(true);
  }

  reloadFilters(event: Record<string, string | null>) {
    if (event['mContentType'] != null) {
      this.chatParamModel.mContentType = event['mContentType'];
    }
    if (event['mDateRange'] != null) {
      this.chatParamModel.mDateRange = event['mDateRange'];
    }
    if (event['mEntity'] != null) {
      this.chatParamModel.mEntity = event['mEntity'];
    }
    if (event['mMitreTtp'] != null) {
      this.chatParamModel.mMitreTtp = event['mMitreTtp'];
    }
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

    this.chatCallbackModel.Result = this.helperService.sortByKey<any>(
      this.chatCallbackModel.Result,
      key,
      order
    );
    this.cdr.detectChanges();
  }
}
