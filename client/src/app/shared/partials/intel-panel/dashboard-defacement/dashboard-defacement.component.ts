import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {ResultComponent} from '../../result/result.component';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {PaginationComponent} from '../../pagination/pagination.component';
import {DashboardResultListComponent} from '../dashboard-results/dashboard-result-list/dashboard-result-list.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {DefacementParamModel} from '../../../model/results/defacement/defacement.callback.model';
import {DefacementCallbackModel} from '../../../model/results/defacement/defacement.param.model';
import {AppService} from '../../../../services/core/app.service';

@Component({
  selector: 'app-dashboard-defacement',
  standalone: true, imports: [ResultComponent, NgIf, PaginationComponent, DashboardResultListComponent],
  templateUrl: './dashboard-defacement.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardDefacementComponent implements OnInit, AfterViewInit {
  defacementParamModel: DefacementParamModel = new DefacementParamModel();
  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
  result_count = 0;

  query = '';
  isLoading = false;
  firstTrigger = true;

  constructor(public appService: AppService, private route: ActivatedRoute, private cdr: ChangeDetectorRef, public dashboardService: DashboardService, private router: Router) {
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.defacementParamModel.mSearchParamPage)
  }

  ngOnInit(): void {
    this.defacementCallbackModel = {...this.dashboardService.defacementCallbackModel} as DefacementCallbackModel;
    this.result_count = this.defacementCallbackModel.Result.length

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'] || '';
        this.defacementParamModel.q = params['q'] || '';
        this.defacementParamModel.mSearchParamPage = params['mSearchParamPage'] ? +params['mSearchParamPage'] : 1;

        if (this.firstTrigger && ((this.defacementCallbackModel.Result.length > 0))) {
          this.isLoading = false;
          this.query = this.defacementParamModel.q
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults()
        }
        this.firstTrigger = false
      });
  }

  onUpdateQuery(query: string) {
    this.defacementParamModel.q = query;
    this.defacementParamModel.mSearchParamPage = 1;
    this.fetchSearchResults();
  }

  fetchSearchResults() {
    if (!this.defacementParamModel.q) {
      this.isLoading = false;
      this.defacementParamModel.q=""

      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: ''
      }).then();

    }

    this.isLoading = true;
    this.router.navigate([], {
      relativeTo: this.route, queryParams: {
        q: this.defacementParamModel.q, mSearchParamPage: this.defacementParamModel.mSearchParamPage,
      }, queryParamsHandling: 'merge', replaceUrl: true,
    }).then();

    this.dashboardService
      .fetchSearchResults<DefacementCallbackModel>('search/defacement', this.defacementParamModel)
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
    this.defacementParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  protected readonly Math = Math;
}
