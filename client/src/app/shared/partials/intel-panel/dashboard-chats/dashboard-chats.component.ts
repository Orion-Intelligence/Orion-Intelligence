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
export class DashboardChatsComponent implements OnInit , AfterViewInit{
  public chatParamModel: ChatParamModel = new ChatParamModel();
  public chatCallbackModel: ChatCallbackModel = new ChatCallbackModel();

  query = ""
  isLoading = false;
  firstTrigger = true

  constructor(public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(1)
  }

  ngOnInit(): void {
    this.chatCallbackModel = {...this.dashboardService.chatCallbackModel} as ChatCallbackModel;

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.chatParamModel.q = params['q'] || '';
        this.chatParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';

        if (this.firstTrigger && ((this.chatCallbackModel.Result.length > 0))) {
          this.isLoading = false;
          this.query = this.chatParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  fetchSearchResults() {
    if (this.isLoading) return;

    this.isLoading = true;
    const apiEndpoint = 'chat/telegram';
    const queryParams = Object.fromEntries(Object.entries(this.chatParamModel).filter(([_, v]) => v != null && v !== ""));

    this.router.navigate([], {
      queryParams: queryParams, queryParamsHandling: 'merge'
    }).then();

    this.dashboardService.fetchSearchResults<ChatCallbackModel>(apiEndpoint, this.chatParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.chatCallbackModel = response.data as ChatCallbackModel;
          this.dashboardService.chatCallbackModel = response.data as ChatCallbackModel;
        }

        this.isLoading = false;
      });
  }
  onPageChange(step: number) {
    this.chatParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.chatParamModel.q = query
  }

  get currentResultCount(): number {
    return this.chatCallbackModel?.Result?.length ?? 0;
  }

  protected readonly Math = Math;

}
