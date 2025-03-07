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
import {Analytics} from '../../dashboard-insights/analytics.model';
import {DashboardInsightsComponent} from '../../dashboard-insights/dashboard-insights.component';

@Component({
  selector: 'app-dashboard-breach',
  imports: [DashboardExpandedResultComponent, DashboardLeakResultGridComponent, DashboardPaginationComponent, NgIf, DashboardInsightsComponent],
  templateUrl: './dashboard-breach.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardBreachComponent implements OnInit {
  isLoading = false;
  analyticsData = {} as Analytics;
  onToggleAnalytics = false;

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

  initAnalytics() {
    console.log("FUUCK1:")
    console.log("FUUCK1:")
    const searchModel = this.dashboardService.searchLeakCallbackModel;
    if (!searchModel || !searchModel.Result) {
      console.warn("No data available in searchGeneralCallbackModel.Result");
      return;
    }

    this.analyticsData = {
      unique_urls: searchModel.Result.map(item => ({
        m_title: item.m_title, m_url: item.m_url || ""
      })),
      total_p_document_list_length: searchModel.Result.length.toString(),
      m_documents_length: searchModel.Result.length.toString(),
      m_clearnet_links_count: searchModel.Result.reduce((sum, item) => sum + (item.m_weblink?.length || 0), 0).toString(),
      active_links: searchModel.Result.reduce((sum, item) => sum + (item.m_weblink?.length || 0), 0).toString(),
      inactive_links: searchModel.Result.reduce((sum, item) => sum + (item.m_dumplink?.length || 0), 0).toString(),
      seldom_active_links: searchModel.Result.reduce((sum, item) => sum + (item.m_contact_link ? 1 : 0), 0).toString(),
      m_urls: searchModel.Result.map(item => item.m_url || ""),
      m_emails: searchModel.Result.flatMap(item => item.m_email_addresses || []),
      mPhoneNumber: searchModel.Result.flatMap(item => item.m_phone_numbers || []),
      mArchiveUrl: searchModel.Result.flatMap(item => item.m_dumplink || []),
      mName: searchModel.Result.flatMap(item => item.m_company_name || []),
      m_pages: searchModel.Page_Count,
      m_document: searchModel.Result.flatMap(item => item.m_weblink || [])
    };
    console.log("FUUCK2:")
    console.log(this.dashboardService.searchLeakCallbackModel.Result)
    console.log("FUUCK2:")
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
          this.initAnalytics()
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
  onToggleAnalyticsTrigger() {
    this.onToggleAnalytics = !this.onToggleAnalytics
  }
  protected readonly Math = Math;

}
