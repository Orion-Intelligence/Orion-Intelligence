import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, timer, map, distinctUntilChanged, combineLatest } from 'rxjs';
import { ResultComponent } from '../../shared/partials/result/result.component';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { NgClass, NgIf } from '@angular/common';
import { CredentialListComponent } from './credential-list/credential-list.component';
import { StealerLogCallbackModel } from '../../shared/model/results/credentials/credential.callback.model';
import { SortType } from '../../shared/constants/shared-enums';
import { HelperService } from '../../shared/services/helper.service';
import { stealer_filters } from '../../shared/constants/filters';
import { FormsModule } from '@angular/forms';
import { EmptyQueryComponent } from '../../shared/partials/empty-query/empty-query.component';
import { PaginationComponent } from "../../shared/partials/pagination/pagination.component";
import { RankedCallbackModel } from '../../shared/model/results/consolidated/ranked.callback.model';
import { CredentialsSearchBarComponent } from "./credentials-search-bar/credentials-search-bar.component";
import { finalize } from 'rxjs/operators';
import { PasswordSchemaComponent } from './password-schema/password-schema.component';
import { PasswordSchemaFilter } from '../../shared/model/stealerlogs-filter/stealerlogs-filters';
import { ScanHelperMethods } from '../../shared/partials/scan-helper-methods/scan-helper-methods.component';
@Component({
  selector: 'app-credential',
  standalone: true,
  imports: [
    ResultComponent,
    CredentialListComponent,
    FormsModule,
    EmptyQueryComponent,
    NgIf,
    NgClass,
    PaginationComponent,
    CredentialsSearchBarComponent,
    PasswordSchemaComponent,
    ScanHelperMethods,
  ],
  templateUrl: './credential.component.html',
  animations: [fadeInDashboardItem],
})
export class CredentialComponent implements OnInit, AfterViewInit {
  private pendingRequests = 0;
  private isSearchLoading = false;
  private isRankedLoading = false;

  protected readonly Math = Math;
  protected readonly filters = stealer_filters;
  protected readonly length = length;

  searchQuery: string = '';
  isLoading: boolean = false;
  firstTrigger: boolean = true;
  user: any;
  url: string = '';
  ioc: any;
  type: string;
  stealerlogCallbackModel: StealerLogCallbackModel = new StealerLogCallbackModel();
  rankedResult: RankedCallbackModel = new RankedCallbackModel();
  breachesApiTime: any = 0;
  allSearchApiTime: any = 0;
  showPasswordscheme = false;
  showSubdomains = false;
  subdomainList: string[] = [];
  isStandaloneStealerlogsRoute = false;

  private setLoading(delta: 1 | -1) {
    this.pendingRequests += delta;
    if (this.pendingRequests < 0) {
      this.pendingRequests = 0;
    }
    this.isLoading = this.pendingRequests > 0;
  }

  constructor(protected helperService: HelperService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected dashboardService: DashboardService) {
    this.type = this.route.snapshot.data['type'];
  }

  get currentResultCount(): number {
    return this.stealerlogCallbackModel?.Page_Count ?? 0;
  }

  ngOnInit(): void {
    this.isStandaloneStealerlogsRoute = this.router.url.includes('/stealerlogs/');
    this.stealerlogCallbackModel = { ...this.dashboardService.stealerlogCallbackModel };
    this.dashboardService.consolidatedParamModel.fullsearch = false;
    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params]) => {
        this.url = params['url'];
        this.user = params['user'];
        this.dashboardService.consolidatedParamModel.url = params['url'] || '';
        this.dashboardService.consolidatedParamModel.user = params['user'] || '';
        if (this.firstTrigger) {
          this.firstTrigger = false;
          if(params['q']){
            this.searchQuery="m_search_all:"+params['q'];
          }
          this.fetchSearchResults(false);
          this.fetchRanked();
        }
      });
    this.dashboardService.consolidatedParamModel.q='';
    this.dashboardService.consolidatedParamModel.url='';
  }

  ngAfterViewInit(): void { }

  triggerSearch(searchQuery: string): void {
    this.searchQuery = searchQuery;
    this.dashboardService.consolidatedParamModel.page = 1;
    this.fetchSearchResults();
    this.fetchRanked();
  }

  fetchSearchResults(reset = true): void {
    this.firstTrigger = false;
    if (this.isSearchLoading) {
      return;
    }
    const cleanedParams: any = {};
    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      cleanedParams[key] = value;
    });
    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: reset ? '' : 'merge'
    }).then();
    this.dashboardService.consolidatedParamModel.ioc = this.searchQuery;
    this.dashboardService.consolidatedParamModel.url ??= '';
    const startTime = performance.now();
    this.setLoading(1);
    this.isSearchLoading = true;
    this.dashboardService
      .fetchSearchResults<StealerLogCallbackModel>('search/stealer/ioc', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(300).pipe(map(() => response))), finalize(() => {
        this.setLoading(-1), this.isSearchLoading = false; 
      }))
      .subscribe(response => {
        const endTime = performance.now();
        this.breachesApiTime = Math.round(endTime - startTime);
        if (response?.success && response?.data && Array.isArray(response.data.Result)) {
          const seen = new Set<string>();
          response.data.Result = response.data.Result.filter(item => {
            if (!item?.raw) {
              return true;
            }
            if (seen.has(item.raw)) {
              return false;
            }
            seen.add(item.raw);
            return true;
          });
          this.stealerlogCallbackModel = response.data;
          this.dashboardService.stealerlogCallbackModel = response.data;
        }
        else if (response?.success && response?.data) {
          response.data.Result = [];
          this.stealerlogCallbackModel = response.data;
          this.dashboardService.stealerlogCallbackModel = response.data;
        }
      });
  }

  onToggleSort(sort: SortType) {
    let key;
    let order: 'asc' | 'desc' = 'asc';
    key = 'm_message_date';
    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    }
    else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    }
    else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults();
      this.fetchRanked();
      return;
    }
    this.stealerlogCallbackModel.Result = this.helperService.sortByKey<any>(this.stealerlogCallbackModel.Result, key, order);
    this.cdr.detectChanges();
  }

  reloadFilters(_: Record<string, string | null>) {
    this.fetchSearchResults();
    this.fetchRanked();
  }

  resetFilters(_: void) {
    this.fetchSearchResults(true);
    this.fetchRanked();
  }

  fetchRanked() {
    this.rankedResult = new RankedCallbackModel();
    if (this.isRankedLoading) {
      return;
    }
    const startTime = performance.now();
    this.dashboardService.consolidatedParamModel.category = "";
    this.dashboardService.consolidatedParamModel.ioc = this.searchQuery;
    this.dashboardService.consolidatedParamModel.url ??= '';
    this.setLoading(1);
    this.isRankedLoading = true;
    this.dashboardService
      .fetchConsolidatedRankededResults('search/consolidated/ioc', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(500).pipe(map(() => response))), finalize(() => {
        this.setLoading(-1), this.isRankedLoading = false, this.dashboardService.consolidatedParamModel.ioc = ''; 
      }))
      .subscribe(response => {
        const endTime = performance.now();
        this.allSearchApiTime = Math.round(endTime - startTime);
        if (response.success && response.data) {
          this.rankedResult = response.data;
        }
      });
  }

  getTotalResultCount(): number {
    const breachCount = this.stealerlogCallbackModel?.Result?.length ?? 0;
    const allSearchCount = this.rankedResult.pageCount;
    return breachCount + allSearchCount;
  }

  getApiTime(): number {
    return (this.breachesApiTime || 0) + (this.allSearchApiTime || 0);
  }

  getAssetSearched(): any {
    const a = this.stealerlogCallbackModel.Total_Hits ?? 0;
    const b = this.rankedResult.totalHits ?? 0;
    return a + b;
  }

  onPageChange(step: number) {
    this.dashboardService.consolidatedParamModel.page = step;
    this.fetchSearchResults();
    this.fetchRanked();
  }

  getAggregatedDataWells(): any {
    const stealer = new Set((this.stealerlogCallbackModel?.Result ?? []).map(item => item['m_index'])).size;
    const ranked = new Set((this.rankedResult?.result ?? []).map(item => item.rank_index)).size;
    return stealer + ranked;
  }

  onDownload() {
    const combinedData = {
      stealerLog: this.stealerlogCallbackModel,
      rankedResult: this.rankedResult
    };
    const json = JSON.stringify(combinedData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stealerLog.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  openScheme() {
    this.showPasswordscheme = true;
  }

  openSubdomains() {
    this.showSubdomains = true;
  }

  onSubdomainSearch(domains: string[]) {
    this.subdomainList = domains;
  }

  closeScheme() {
    this.showPasswordscheme = false;
  }

  onPasswordSearch(filter: PasswordSchemaFilter) {
    const isEmpty = !filter.minLength &&
            !filter.maxLength &&
            !filter.hasAlphabets &&
            !filter.hasNumbers &&
            !filter.hasSpecialChars;
    if (isEmpty) {
      this.dashboardService.passwordSchemeFilter = filter;
    }
    else {
      this.dashboardService.passwordSchemeFilter = filter;
    }
    this.fetchSearchResults(true);
  }

  get maxPages(): number {
    const stealerPages = this.stealerlogCallbackModel.Result.length || 0;
    const rankedPages = this.rankedResult.result.length || 0;
    return Math.max(stealerPages, rankedPages);
  }
}
