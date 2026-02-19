import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { AppService } from '../../../../../services/core/app/app.service';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ChatCallbackModel } from '../../../../model/results/chat/chat.callback.model';
import { NgIf } from '@angular/common';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { ResultComponent } from '../../../result/result.component';
import { DashboardResultChatComponent } from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { chat_filters } from '../../../../constants/filters';
import { ChannelTypeKeys, SortType } from '../../../../constants/shared-enums';
import { HelperService } from '../../../../services/helper.service';
import { applyQueryAndPageFromParams, isRouteChanged, resetPageAndFetch, resolveSortOrder, setPageAndFetch, updateQuery } from '../dashboard-manager.utils';
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
    public isResponseLoading = signal(false);
    public chatCallbackModel: ChatCallbackModel = new ChatCallbackModel();
    query = "";
    firstTrigger = true;
    result_count = 0;
    protected readonly Math = Math;
    protected readonly chat_filters = chat_filters;
    constructor(protected helperService: HelperService, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    }
    get currentResultCount(): number {
        return this.chatCallbackModel.Page_Count ?? 0;
    }
    ngAfterViewInit(): void {
        this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
        if (isRouteChanged(this.router.url, this.dashboardService.m_current_route)) {
            this.fetchSearchResults();
        }
    }
    ngOnInit(): void {
        this.chatCallbackModel = { ...this.dashboardService.chatCallbackModel } as ChatCallbackModel;
        this.result_count = this.chatCallbackModel.Result.length;
        const category = this.route.snapshot.routeConfig?.path;
        let isDiscussion = false;
        if (category && ChannelTypeKeys.includes(category.toUpperCase())) {
            this.dashboardService.consolidatedParamModel.category = category;
            isDiscussion = true;
        }
        else {
            this.dashboardService.consolidatedParamModel.category = "all";
        }
        combineLatest([this.route.queryParams, this.route.url])
            .pipe(distinctUntilChanged())
            .subscribe(([params, _]) => {
            this.query = applyQueryAndPageFromParams(params, this.dashboardService.consolidatedParamModel);
            if (!isDiscussion && this.firstTrigger && ((this.chatCallbackModel.Result.length > 0))) {
                this.isResponseLoading.set(false);
                this.query = this.dashboardService.consolidatedParamModel.q;
            }
            else if (this.dashboardService.chatCallbackModel.Result.length == 0) {
                this.cdr.detectChanges();
                this.fetchSearchResults();
            }
            this.firstTrigger = false;
        });
    }
    fetchSearchResults(): void {
        if (!this.dashboardService.consolidatedParamModel.q) {
            this.isResponseLoading.set(false);
            this.dashboardService.consolidatedParamModel.q = "";
            this.router.navigate([], {
                queryParams: {},
                queryParamsHandling: ''
            }).then();
        }
        this.isResponseLoading.set(true);
        this.dashboardService
            .fetchSearchResults<ChatCallbackModel>('chat/telegram', this.dashboardService.consolidatedParamModel)
            .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
            .subscribe(response => {
            if (response.success && response.data) {
                this.chatCallbackModel = response.data as ChatCallbackModel;
                this.dashboardService.chatCallbackModel = response.data as ChatCallbackModel;
            }
            else {
                this.chatCallbackModel = new ChatCallbackModel();
            }
            this.isResponseLoading.set(false);
            this.result_count = this.chatCallbackModel.Result.length;
        });
    }
    onPageChange(step: number) {
        setPageAndFetch(this.dashboardService.consolidatedParamModel, step, () => this.fetchSearchResults());
    }
    onUpdateQuery(query: string) {
        updateQuery(this.dashboardService.consolidatedParamModel, query);
    }
    resetFilters(_: void) {
        resetPageAndFetch(this.dashboardService.consolidatedParamModel, () => this.fetchSearchResults());
    }
    reloadFilters(_: Record<string, string | null>) {
        this.fetchSearchResults();
    }
    onToggleSort(sort: SortType) {
        const order = resolveSortOrder(sort);
        if (!order) {
            this.fetchSearchResults();
            return;
        }
        this.chatCallbackModel.Result = this.helperService.sortByKey<any>(this.chatCallbackModel.Result, 'm_message_date', order);
        this.cdr.detectChanges();
    }
}
