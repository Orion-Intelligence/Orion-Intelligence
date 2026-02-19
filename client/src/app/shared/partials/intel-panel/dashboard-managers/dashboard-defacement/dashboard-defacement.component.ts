import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ResultComponent } from '../../../result/result.component';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { DashboardResultGeneralListComponent } from '../../dashboard-results/dashboard-result-general-list/dashboard-result-general-list.component';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { DefacementCallbackModel } from '../../../../model/results/defacement/defacement.callback.model';
import { AppService } from '../../../../../services/core/app/app.service';
import { defacement_filters } from '../../../../constants/filters';
import { Category } from '../../../../constants/pages';
import { SortType } from '../../../../constants/shared-enums';
import { HelperService } from '../../../../services/helper.service';
@Component({
    selector: 'app-dashboard-defacement',
    standalone: true, imports: [ResultComponent, NgIf, PaginationComponent, DashboardResultGeneralListComponent],
    templateUrl: './dashboard-defacement.component.html',
    animations: [fadeInDashboardItem],
})
export class DashboardDefacementComponent implements OnInit, AfterViewInit {
    public isResponseLoading = signal(false);
    protected readonly Math = Math;
    protected readonly defacement_filters = defacement_filters;
    protected isList = true;
    defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
    result_count = 0;
    type = Category.DEFACEMENT;
    query = '';
    firstTrigger = true;
    constructor(private app_service: AppService, protected helperService: HelperService, public appService: AppService, private route: ActivatedRoute, private cdr: ChangeDetectorRef, public dashboardService: DashboardService, private router: Router) {
    }
    ngAfterViewInit(): void {
        this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
    }
    ngOnInit(): void {
        this.defacementCallbackModel = { ...this.dashboardService.defacementCallbackModel } as DefacementCallbackModel;
        this.result_count = this.defacementCallbackModel.Result.length;
        combineLatest([this.route.queryParams, this.route.url])
            .pipe(distinctUntilChanged())
            .subscribe(([params, _]) => {
            this.query = params['q'] || '';
            this.dashboardService.consolidatedParamModel.q = params['q'] || '';
            this.dashboardService.consolidatedParamModel.page = params['page'] ? +params['page'] : 1;
            const route: string = this.router.url.split('?')[0];
            if (String(route) != this.dashboardService.m_current_route) {
                this.isResponseLoading.set(false);
                this.dashboardService.defacementCallbackModel = new DefacementCallbackModel();
                this.fetchSearchResults();
                return;
            }
            if (this.dashboardService.defacementCallbackModel.Result.length > 0) {
                this.query = this.dashboardService.consolidatedParamModel.q;
            }
            else {
                this.cdr.detectChanges();
                this.fetchSearchResults();
            }
            this.firstTrigger = false;
        });
    }
    onUpdateQuery(query: string) {
        this.dashboardService.consolidatedParamModel.q = query;
        this.dashboardService.consolidatedParamModel.page = 1;
        this.fetchSearchResults();
    }
    fetchSearchResults() {
        if (!this.dashboardService.consolidatedParamModel.q) {
            this.dashboardService.consolidatedParamModel.q = "";
            this.router.navigate([], {
                queryParams: {},
                queryParamsHandling: ''
            }).then();
        }
        const lastSegment = this.route.snapshot.url.at(-1)?.path;
        if (lastSegment) {
            this.dashboardService.consolidatedParamModel.content = lastSegment;
        }
        let matchtype = "";
        if (this.isList && this.app_service.configData().localSettings.matchType == "or") {
            matchtype = "or";
        }
        this.isResponseLoading.set(true);
        this.dashboardService
            .fetchSearchResults<DefacementCallbackModel>('search/defacement', this.dashboardService.consolidatedParamModel, matchtype)
            .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
            .subscribe(response => {
            if (response.success && response.data) {
                this.defacementCallbackModel = response.data as DefacementCallbackModel;
                this.dashboardService.defacementCallbackModel = response.data as DefacementCallbackModel;
            }
            else {
                this.defacementCallbackModel = new DefacementCallbackModel();
            }
            this.isResponseLoading.set(false);
            this.result_count = this.defacementCallbackModel.Result.length;
            this.cdr.detectChanges();
        });
    }
    onPageChange(step: number) {
        this.dashboardService.consolidatedParamModel.page = step;
        this.fetchSearchResults();
    }
    resetFilters(_: void) {
        this.fetchSearchResults();
    }
    reloadFilters(_: Record<string, string | null>) {
        this.dashboardService.consolidatedParamModel.page = 1;
        this.fetchSearchResults();
    }
    onToggleSort(sort: SortType) {
        let key;
        let order: 'asc' | 'desc' = 'asc';
        key = 'm_leak_date';
        if (sort === SortType.NEWEST_FIRST) {
            order = 'desc';
        }
        else if (sort === SortType.OLDEST_FIRST) {
            order = 'asc';
        }
        else if (sort === SortType.DEFAULT) {
            this.fetchSearchResults();
            return;
        }
        this.defacementCallbackModel.Result = this.helperService.sortByKey<any>(this.defacementCallbackModel.Result, key, order);
        this.cdr.detectChanges();
    }
    list_switch(tab: string) {
        this.isList = tab == "List";
    }
}
