import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DashboardExpandedResultComponent} from '../../dashboard-expanded-result/dashboard-expanded-result.component';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute} from '@angular/router';
import {NgIf} from '@angular/common';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {combineLatest, distinctUntilChanged, switchMap, timer} from 'rxjs';
import {DashboardPaginationComponent} from '../../dashboard-pagination/dashboard-pagination.component';
import {DashboardInsightsComponent} from '../../dashboard-insights/dashboard-insights.component';
import {
  DashboardGeneralResultsGridComponent
} from '../dashboard-results/dashboard-general-results-grid/dashboard-general-results-grid.component';
import {Analytics} from '../../dashboard-insights/analytics.model';

@Component({
  selector: 'app-dashboard-general',
  imports: [DashboardExpandedResultComponent, NgIf, DashboardPaginationComponent, DashboardInsightsComponent, DashboardGeneralResultsGridComponent],
  templateUrl: './dashboard-general.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardGeneralComponent implements OnInit {
  isLoading = false;
  onToggleAnalytics = false;
  query = ""
  analyticsData = {} as Analytics;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    if(this.dashboardService.searchGeneralCallbackModel.Result.length>0){
      this.isLoading = false;
      this.query = this.dashboardService.searchGeneralParamModel.q
    }
    this.initAnalytics()
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        this.query = params['q'];
        this.dashboardService.searchGeneralParamModel.q = params['q'] || '';
        this.dashboardService.searchGeneralParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';
        this.dashboardService.searchGeneralParamModel.mSearchParamSafeSearch = params['mSearchParamSafeSearch'] === 'true';
        this.dashboardService.searchGeneralParamModel.mNetwork = params['network'] || 'all';

        this.dashboardService.searchGeneralParamModel.pSearchParamType = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';

        if(this.dashboardService.searchGeneralCallbackModel.Result.length==0){
          this.fetchSearchResults();
        }
        this.cdr.detectChanges();
      });
  }

  initAnalytics() {
    const searchModel = this.dashboardService.searchGeneralCallbackModel;

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
      m_clearnet_links_count: searchModel.Result.reduce((sum, item) => sum + (item.m_clearnet_links?.length || 0), 0).toString(),
      active_links: searchModel.Result.reduce((sum, item) => sum + (item.m_weblink?.length || 0), 0).toString(),
      inactive_links: searchModel.Result.reduce((sum, item) => sum + (item.m_dumplink?.length || 0), 0).toString(),
      seldom_active_links: searchModel.Result.reduce((sum, item) => sum + (item.m_contact_link ? 1 : 0), 0).toString(),
      m_urls: searchModel.Result.map(item => item.m_url || ""),
      m_emails: searchModel.Result.flatMap(item => item.m_emails || []),
      mPhoneNumber: searchModel.Result.flatMap(item => item.m_phone_numbers || []),
      mArchiveUrl: searchModel.Result.flatMap(item => item.m_archive_url || []),
      mName: searchModel.Result.flatMap(item => item.m_names || []),
      m_pages: searchModel.Page_Count,
      m_document: searchModel.Result.flatMap(item => item.m_document || [])
    };
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
          this.initAnalytics()
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

  onToggleAnalyticsTrigger() {
    this.onToggleAnalytics = !this.onToggleAnalytics
  }

  protected readonly Math = Math;
}
