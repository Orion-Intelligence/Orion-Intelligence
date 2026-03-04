import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { DashboardResultsGeneralComponent } from '../dashboard-results/dashboard-results-general-grid/dashboard-results-general.component';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { Category } from '../../../shared/constants/pages';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ResultComponent } from '../../../shared/partials/result/result.component';
import { general_filters } from '../../../shared/constants/filters';
import { AppService } from '../../../services/core/app/app.service';
import { DashboardResultExploitComponent } from '../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import { DashboardResultSocialComponent } from '../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import { DashboardResultChatComponent } from '../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { ConsolidatedParamModel } from '../../../shared/model/results/consolidated/consolidated.param.model';
import { SortType } from '../../../shared/constants/shared-enums';
import { HelperService } from '../../../shared/services/helper.service';
import { DashboardResultDefacementComponent } from '../dashboard-results/dashboard-result-defacement/dashboard-result-defacement.component';

@Component({
  selector: 'app-dashboard-result-container',
  imports: [
    NgIf,
    PaginationComponent,
    DashboardResultsGeneralComponent,
    ResultComponent,
    DashboardResultExploitComponent,
    DashboardResultSocialComponent,
    DashboardResultChatComponent,
    NgForOf,
    DashboardResultDefacementComponent
  ],
  templateUrl: './dashboard-result-container.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardResultContainer implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  protected readonly general_filters = general_filters;
  protected readonly Category = Category;
  protected readonly alert = alert;

  public currentResultModel: any = null;
  public isResponseLoading = signal(false);
  public animateBackResults = false;
  type: Category = Category.STRATEGIC;
  apiEndpoint: string = '';

  constructor(protected helperService: HelperService, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    this.type = this.route.snapshot.data['type'] as Category;
    this.apiEndpoint = this.type.toLowerCase() === Category.STRATEGIC.toLowerCase() ? 'search/strategic' : this.type.toLowerCase() === Category.SOCIAL.toLowerCase() ? 'search/social' : this.type.toLowerCase() === Category.EXPLOIT.toLowerCase() ? 'search/exploit' : this.type.toLowerCase() === Category.DEFACEMENT.toLowerCase() ? 'search/defacement' : 'search/breach';
  }

  get currentParamModel(): ConsolidatedParamModel {
    return this.dashboardService.consolidatedParamModel;
  }

  get currentQuery(): string {
    return this.currentParamModel?.q ?? '';
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
  }

  ngOnInit(): void {
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        const route = this.router.url.split('?')[0];
        if (String(route) !== this.dashboardService.m_current_route) {
          this.currentResultModel = null;
        }

        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.page = params['page'] || '1';
        this.dashboardService.consolidatedParamModel.category = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';
        const cacheKey = this.buildCacheKey();
        const cachedResult = sessionStorage.getItem(cacheKey);
        if (cachedResult && !this.hasResultData()) {
          try {
            this.currentResultModel = JSON.parse(cachedResult);
            this.animateBackResults = true;
            setTimeout(() => {
              this.animateBackResults = false;
            }, 700);
          }
          catch {
            sessionStorage.removeItem(cacheKey);
          }
        }

        if (!this.hasResultData()) {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }
      });
  }

  fetchSearchResults(): void {
    if (this.isResponseLoading()) {
      return;
    }

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.dashboardService.consolidatedParamModel.q = "";
    }

    this.isResponseLoading.set(true);
    this.currentResultModel = null;

    this.dashboardService.fetchSearchResults<any>(this.apiEndpoint,
      this.dashboardService.consolidatedParamModel).pipe(switchMap((response) => timer(1000).pipe(map(() => response))))
      .subscribe((response) => {
        if (response.success && response.data) {
          this.currentResultModel = response.data["Result"];
          sessionStorage.setItem(this.buildCacheKey(), JSON.stringify(this.currentResultModel));
        }
        this.isResponseLoading.set(false);
      });
  }

  onPageChange(step: number): void {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
  }

  reloadFilters(_: Record<string, string | null>): void {
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string): void {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  onToggleSort(sort: SortType): void {
    let key: string;
    let order: 'asc' | 'desc' = 'asc';

    if (this.type === Category.BREACH) {
      key = 'm_leak_date';
    }
    else {
      key = 'm_update_date';
    }

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

    const results = this.currentResultModel?.Result ?? [];
    if (results.length > 0) {
      this.currentResultModel.Result = this.helperService.sortByKey<any>(results, key, order);
      this.cdr.detectChanges();
    }
  }

  private hasResultData(): boolean {
    return Array.isArray(this.currentResultModel) && this.currentResultModel.length > 0;
  }

  private buildCacheKey(): string {
    return [
      'dashboard-results-cache',
      this.type,
      this.dashboardService.consolidatedParamModel.category || 'all',
      this.dashboardService.consolidatedParamModel.page || '1',
      this.dashboardService.consolidatedParamModel.q || ''
    ].join('|');
  }
}
