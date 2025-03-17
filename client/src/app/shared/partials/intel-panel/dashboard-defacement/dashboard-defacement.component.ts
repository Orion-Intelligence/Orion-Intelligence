import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ResultComponent } from '../../result/result.component';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { DashboardResultListComponent } from '../dashboard-results/dashboard-result-list/dashboard-result-list.component';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import {DefacementParamModel} from '../../../model/results/defacement/defacement.callback.model';
import {DefacementCallbackModel} from '../../../model/results/defacement/defacement.param.model';

@Component({
  selector: 'app-dashboard-defacement',
  standalone: true,
  imports: [ResultComponent, NgIf, PaginationComponent, DashboardResultListComponent],
  templateUrl: './dashboard-defacement.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardDefacementComponent implements OnInit {
  defacementParamModel: DefacementParamModel = new DefacementParamModel();
  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
  result_count = 0;

  query = '';
  isLoading = false;
  firstTrigger = true;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'] || '';
        this.defacementParamModel.q = params['q'] || '';
        this.defacementParamModel.mSearchParamPage = params['mSearchParamPage'] ? +params['mSearchParamPage'] : 1; // Default to 1 if not present

        if (this.firstTrigger && this.defacementCallbackModel.Result.length > 0) {
          this.isLoading = false;
          this.query = this.defacementParamModel.q;
        } else if (this.firstTrigger) {
          this.defacementParamModel.q = '*';
          this.query = '';
          this.defacementParamModel.mSearchParamPage = 1; // Explicitly set initial page
          this.fetchSearchResults();
          this.cdr.detectChanges();
        }
        this.firstTrigger = false;
      });
  }

  onUpdateQuery(query: string) {
    this.defacementParamModel.q = query;
    this.defacementParamModel.mSearchParamPage = 1; // Reset to page 1 on new query
    this.fetchSearchResults();
  }

  fetchSearchResults() {
    this.isLoading = true;

    // Update browser URL with all relevant defacementParamModel properties
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.defacementParamModel.q,
        mSearchParamPage: this.defacementParamModel.mSearchParamPage,
      },
      queryParamsHandling: 'merge', // Merge with any existing params
      replaceUrl: true, // Update URL without adding to history
    });

    this.dashboardService
      .fetchSearchResults<DefacementCallbackModel>('search/defacement', this.defacementParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.defacementCallbackModel = response.data as DefacementCallbackModel;
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
