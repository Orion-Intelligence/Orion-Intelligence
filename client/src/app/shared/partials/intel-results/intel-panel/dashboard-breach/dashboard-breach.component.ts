import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DashboardExpandedResultComponent} from "../../dashboard-expanded-result/dashboard-expanded-result.component";
import {DashboardPaginationComponent} from "../../dashboard-pagination/dashboard-pagination.component";
import {NgIf} from "@angular/common";
import {DashboardService} from "../../../../../services/dashboard/dashboard.service";
import {ActivatedRoute} from "@angular/router";
import {switchMap, timer} from "rxjs";
import {
  DashboardLeakResultGridComponent
} from "../dashboard-results/dashboard-leak-result-grid/dashboard-leak-result-grid.component";
import {fadeInDashboardItem} from "../../../../animations/dashboard.item.animation";

@Component({
  selector: 'app-dashboard-breach',
  imports: [DashboardExpandedResultComponent, DashboardLeakResultGridComponent, DashboardPaginationComponent, NgIf],
  templateUrl: './dashboard-breach.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardBreachComponent implements OnInit {
  isLoading = false;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.dashboardService.searchLeakParamModel.q = params['q'] || '';
      this.dashboardService.searchLeakParamModel.pSearchParamType = params['category'] || 'all';
      this.dashboardService.searchLeakParamModel.mSearchParamPage = params['page'] ? +params['page'] : 1;
      this.dashboardService.searchLeakParamModel.mSearchParamSafeSearch = params['safeSearch'] === 'true';
      this.dashboardService.searchLeakParamModel.mNetwork = params['network'] || 'all';

      this.fetchSearchResults();
      this.cdr.detectChanges();
    });
  }

  fetchSearchResults() {
    if (this.isLoading) return;

    if (this.dashboardService.searchLeakParamModel.q == "") {
      this.isLoading = false;
      this.dashboardService.searchLeakCallbackModel.Result = []
    } else {
      this.isLoading = true;
      this.dashboardService.fetchLeakSearchResults()
        .pipe(switchMap(() => timer(1000)))
        .subscribe(() => {
          this.isLoading = false;
        });
    }
  }

  onPageChange(step: number) {
    this.dashboardService.searchLeakParamModel.mSearchParamPage = step;
    this.fetchSearchResults();
  }

  reloadFilters(event: [string | null, string | null]) {
    const [mNetwork, mSearchParamSafeSearch] = event;
    if (mNetwork != null) {
      this.dashboardService.searchLeakParamModel.mNetwork = mNetwork;
    }
    this.dashboardService.searchLeakParamModel.mSearchParamSafeSearch = mSearchParamSafeSearch != 'yes';
    this.fetchSearchResults();
  }

  onUpdateQuery(query: string) {
    this.dashboardService.searchLeakParamModel.q = query
  }

  protected readonly Math = Math;

}
