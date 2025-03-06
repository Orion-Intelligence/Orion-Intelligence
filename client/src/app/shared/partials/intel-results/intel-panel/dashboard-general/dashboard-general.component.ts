import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DashboardExpandedResultComponent} from '../../dashboard-expanded-result/dashboard-expanded-result.component';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute} from '@angular/router';
import {
  DashboardGeneralResultsGridComponent
} from '../dashboard-results/dashboard-results-grid/dashboard-general-results-grid.component';
import {NgIf} from '@angular/common';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {combineLatest, distinctUntilChanged, switchMap, timer} from 'rxjs';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';

@Component({
  selector: 'app-dashboard-general',
  imports: [DashboardExpandedResultComponent, DashboardGeneralResultsGridComponent, NgIf, DashboardPaginationComponent],
  templateUrl: './dashboard-general.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardGeneralComponent implements OnInit {
  isLoading = false;
  query = ""

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        this.query = params['q'];
        this.dashboardService.searchGeneralParamModel.q = params['q'] || '';
        this.dashboardService.searchGeneralParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';
        this.dashboardService.searchGeneralParamModel.mSearchParamSafeSearch = params['mSearchParamSafeSearch'] === 'true';
        this.dashboardService.searchGeneralParamModel.mNetwork = params['network'] || 'all';

        this.dashboardService.searchGeneralParamModel.pSearchParamType = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';

        this.fetchSearchResults();
        this.cdr.detectChanges();
      });
  }

  fetchSearchResults() {
    if (this.isLoading) return;

    if (this.dashboardService.searchGeneralParamModel.q == "") {
      this.isLoading = false;
      this.dashboardService.searchGeneralCallbackModel.Result = []
    } else {
      this.isLoading = true;
      this.dashboardService.fetchGeneralSearchResults()
        .pipe(switchMap(() => timer(1000)))
        .subscribe(() => {
          this.isLoading = false;
        });
    }
  }


  onPageChange(step: number) {
    this.dashboardService.searchGeneralParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  reloadFilters(event: [string | null, string | null]) {
    const [mNetwork, mSearchParamSafeSearch] = event;
    if (mNetwork != null) {
      this.dashboardService.searchGeneralParamModel.mNetwork = mNetwork;
    }
    this.dashboardService.searchGeneralParamModel.mSearchParamSafeSearch = mSearchParamSafeSearch != 'yes';
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.searchGeneralParamModel.q = query
  }

  protected readonly Math = Math;
}
