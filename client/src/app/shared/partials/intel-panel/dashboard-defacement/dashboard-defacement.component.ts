import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {ResultComponent} from '../../result/result.component';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {PaginationComponent} from '../../pagination/pagination.component';
import {DashboardResultListComponent} from '../dashboard-results/dashboard-result-list/dashboard-result-list.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {DefacementCallbackModel} from '../../../model/results/defacement/defacement.callback.model';
import {AppService} from '../../../../services/core/app.service';
import {defacement_filters} from '../../../constants/filters';
import {Category} from '../../../constants/pages';
import {SortType} from '../../../constants/shared-enums';
import {HelperService} from '../../../services/helper.service';

@Component({
  selector: 'app-dashboard-defacement',
  standalone: true, imports: [ResultComponent, NgIf, PaginationComponent, DashboardResultListComponent],
  templateUrl: './dashboard-defacement.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardDefacementComponent implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  protected readonly defacement_filters = defacement_filters;

  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
  result_count = 0;
  type = Category.DEFACEMENT
  query = '';
  isLoading = false;
  firstTrigger = true;

  constructor(protected helperService: HelperService, public appService: AppService, private route: ActivatedRoute, private cdr: ChangeDetectorRef, public dashboardService: DashboardService, private router: Router) {
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.mSearchParamPage)
  }

  ngOnInit(): void {
    this.defacementCallbackModel = {...this.dashboardService.defacementCallbackModel} as DefacementCallbackModel;
    this.result_count = this.defacementCallbackModel.Result.length

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'] || '';
        this.dashboardService.consolidatedParamModel.q = params['q'] || '';
        this.dashboardService.consolidatedParamModel.mSearchParamPage = params['mSearchParamPage'] ? +params['mSearchParamPage'] : 1;
        this.dashboardService.consolidatedParamModel.mDateRange = params['mDateRange'] || '';

        if (this.firstTrigger && ((this.defacementCallbackModel.Result.length > 0))) {
          this.isLoading = false;
          this.query = this.dashboardService.consolidatedParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
    this.dashboardService.consolidatedParamModel.mSearchParamPage = 1;
    this.fetchSearchResults();
  }

  fetchSearchResults(reset = false) {
    let segment = this.route.snapshot.url.at(-1)?.path
    if (segment)
      this.dashboardService.consolidatedParamModel.mContentType = segment

    if (reset)
      this.dashboardService.consolidatedParamModel.mSearchParamPage = 1
    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading = false;
      this.dashboardService.consolidatedParamModel.q = ""

      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();

    }

    this.isLoading = true;

    const cleanedParams: any = {};

    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      const isDefault =
        (key === 'mSearchParamSafeSearch' && value === false) ||
        (key === 'mNetwork' && value === 'all') ||
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
    }).then();

    if (reset) {
      this.isLoading = false;
      return;
    }

    this.dashboardService
      .fetchSearchResults<DefacementCallbackModel>('search/defacement', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.defacementCallbackModel = response.data as DefacementCallbackModel;
          this.dashboardService.defacementCallbackModel = response.data as DefacementCallbackModel;
        } else {
          this.defacementCallbackModel = new DefacementCallbackModel();
        }
        this.isLoading = false;
        this.result_count = this.defacementCallbackModel.Result.length;
        this.cdr.detectChanges();
      });
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  resetFilters(_: void) {
    this.dashboardService.consolidatedParamModel.mDateRange = "";
    this.dashboardService.consolidatedParamModel.mTeam = "";
    this.dashboardService.consolidatedParamModel.mAttacker = "";

    this.fetchSearchResults(true);
  }

  reloadFilters(event: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.mSearchParamPage = 1
    if (event['mDateRange']) {
      this.dashboardService.consolidatedParamModel.mDateRange = event['mDateRange']
    }
    if (event['mTeam'] != null) {
      this.dashboardService.consolidatedParamModel.mTeam = event['mTeam'];
    }
    if (event['mAttacker'] != null) {
      this.dashboardService.consolidatedParamModel.mAttacker = event['mAttacker'];
    }
    this.fetchSearchResults();
  }

  onToggleSort(sort: SortType) {
    let key;
    let order: 'asc' | 'desc' = 'asc';

    key = 'm_date_of_leak';

    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    } else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    } else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults(true);
      return;
    }

    this.defacementCallbackModel.Result = this.helperService.sortByKey<any>(
      this.defacementCallbackModel.Result,
      key,
      order
    );
    this.cdr.detectChanges();
  }
}
