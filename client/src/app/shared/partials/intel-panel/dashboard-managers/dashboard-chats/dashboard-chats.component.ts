import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppService} from '../../../../../services/core/app.service';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ChatCallbackModel} from '../../../../model/results/chat/chat.callback.model';
import {NgIf} from '@angular/common';
import {PaginationComponent} from '../../../pagination/pagination.component';
import {ResultComponent} from '../../../result/result.component';
import {DashboardResultChatComponent} from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {chat_filters} from '../../../../constants/filters';
import {ChannelTypeKeys, SortType} from '../../../../constants/shared-enums';
import {HelperService} from '../../../../services/helper.service';

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
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page)
  }

  ngOnInit(): void {
    this.chatCallbackModel = {...this.dashboardService.chatCallbackModel} as ChatCallbackModel;
    this.result_count = this.chatCallbackModel.Result.length
    const category = this.route.snapshot.routeConfig?.path;
    let isDiscussion = false
    if (category && ChannelTypeKeys.includes(category.toUpperCase())) {
      this.dashboardService.consolidatedParamModel.cat_type = category
      isDiscussion = true
    } else {
      this.dashboardService.consolidatedParamModel.cat_type = "all"
    }

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1';

        if (!isDiscussion && this.firstTrigger && ((this.chatCallbackModel.Result.length > 0))) {
          this.isLoading = false;
          this.query = this.dashboardService.consolidatedParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  fetchSearchResults(reset = false): void {
    if (reset)
      this.dashboardService.consolidatedParamModel.page = 1;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading = false;
      this.dashboardService.consolidatedParamModel.q = "";

      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();
    }

    this.isLoading = true;

    const cleanedParams: any = {};

    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
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
      .fetchSearchResults<ChatCallbackModel>('chat/telegram', this.dashboardService.consolidatedParamModel)
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
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query
  }

  resetFilters(_: void) {
    this.dashboardService.consolidatedParamModel.page = 1;
    this.dashboardService.consolidatedParamModel.content = "all";
    this.dashboardService.consolidatedParamModel.daterange = "";
    this.dashboardService.consolidatedParamModel.entity = "";
    this.dashboardService.consolidatedParamModel.mitre = "";
    this.fetchSearchResults(true);
  }

  reloadFilters(event: Record<string, string | null>) {
    if (event['content'] != null) {
      this.dashboardService.consolidatedParamModel.content = event['content'];
    }
    if (event['daterange'] != null) {
      this.dashboardService.consolidatedParamModel.daterange = event['daterange'];
    }
    if (event['entity'] != null) {
      this.dashboardService.consolidatedParamModel.entity = event['entity'];
    }
    if (event['mitre'] != null) {
      this.dashboardService.consolidatedParamModel.mitre = event['mitre'];
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
