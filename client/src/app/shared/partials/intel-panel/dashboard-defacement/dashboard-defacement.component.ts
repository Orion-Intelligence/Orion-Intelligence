import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AsyncPipe, NgIf} from '@angular/common';
import {DefacementParamModel} from '../../../model/results/defacement/defacement.callback.model';
import {DefacementCallbackModel} from '../../../model/results/defacement/defacement.param.model';
import {combineLatest, distinctUntilChanged, map, switchMap, timer} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {ResultComponent} from '../../result/result.component';
import {GeneralCallbackModel} from '../../../model/results/general/general.callback.model';
import {LeakCallbackModel} from '../../../model/results/leak/leak.callback.model';
import {Category} from '../../../enums/pages';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {PaginationComponent} from '../../pagination/pagination.component';
import {DashboardResultsGridComponent} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import {DashboardResultListComponent} from '../dashboard-results/dashboard-result-list/dashboard-result-list.component';

@Component({
  selector: 'app-dashboard-defacement',
  imports: [ResultComponent, NgIf, PaginationComponent, DashboardResultListComponent],
  templateUrl: './dashboard-defacement.component.html'
})
export class DashboardDefacementComponent implements OnInit {
  defacementParamModel: DefacementParamModel = new DefacementParamModel()
  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
  result_count = 0

  query = ""
  isLoading = false;
  firstTrigger = false

  constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef, public dashboardService: DashboardService) {
  }

  ngOnInit(): void {
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, _]) => {
        this.query = params['q'];
        this.defacementParamModel.q = params['q'] || '';

        if (this.defacementCallbackModel.Result.length > 0) {
          this.isLoading = false;
          this.query = this.defacementParamModel.q
        } else if (this.firstTrigger) {
          this.cdr.detectChanges();
          this.firstTrigger = true
        }
      });
  }

  onUpdateQuery(query: string) {
    this.defacementParamModel.q = query
  }

  fetchSearchResults() {
    this.isLoading = true
    this.dashboardService.fetchSearchResults<DefacementCallbackModel>("search/defacement", this.defacementParamModel)
      .pipe(switchMap(response => timer(1000).pipe(map(() => response)))) // Delay UI update
      .subscribe(response => {
        if (response.success && response.data) {
          this.defacementCallbackModel = response.data as DefacementCallbackModel;
        } else {
          this.defacementCallbackModel = new DefacementCallbackModel();
        }
        this.isLoading = false;
        this.result_count = this.defacementCallbackModel.Result.length
        this.cdr.detectChanges();
      });
  }

  onPageChange(step: number) {
    this.defacementParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  protected readonly Math = Math;
}
