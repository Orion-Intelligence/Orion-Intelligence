import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, timer, map, distinctUntilChanged, combineLatest } from 'rxjs';
import { ResultComponent } from '../../shared/partials/result/result.component';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { NgClass } from '@angular/common';
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
import { ExportChoiceModalComponent } from '../../shared/partials/export-choice-modal/export-choice-modal.component';
import { REPORT_EXPORT_OPTIONS } from '../../shared/model/report/export-choice.model';
import { ReportExportService } from '../../shared/services/report-export.service';
import { GraphReportPayload, GraphReportTableRow } from '../../shared/model/report/report-export.model';
@Component({
  selector: 'app-credential',
  standalone: true,
  imports: [
    ResultComponent,
    CredentialListComponent,
    FormsModule,
    EmptyQueryComponent,
    NgClass,
    PaginationComponent,
    CredentialsSearchBarComponent,
    PasswordSchemaComponent,
    ScanHelperMethods,
    ExportChoiceModalComponent
  ],
  templateUrl: './credential.component.html',
  animations: [fadeInDashboardItem],
})
export class CredentialComponent implements OnInit {
  private pendingRequests = 0;
  private isSearchLoading = false;
  private isRankedLoading = false;
  private readonly exportCsvColumns = [ 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;

  protected readonly Math = Math;
  protected readonly filters = stealer_filters;
  protected readonly length = length;

  readonly reportExportOptions = REPORT_EXPORT_OPTIONS;
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
  isExportChoiceOpen = false;
  subdomainList: string[] = [];
  isStandaloneStealerlogsRoute = false;

  private setLoading(delta: 1 | -1) {
    this.pendingRequests += delta;
    if (this.pendingRequests < 0) {
      this.pendingRequests = 0;
    }
    this.isLoading = this.pendingRequests > 0;
  }

  constructor(protected helperService: HelperService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected dashboardService: DashboardService, private reportExportService: ReportExportService) {
    this.type = this.route.snapshot.data['type'];
  }

  get currentResultCount(): number {
    return (this.stealerlogCallbackModel?.Result?.length ?? 0) + (this.rankedResult?.result?.length ?? 0);
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

  resetFilters(_: undefined) {
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
    this.isExportChoiceOpen = true;
  }

  closeExportChoice() {
    this.isExportChoiceOpen = false;
  }

  selectExport(type: string) {
    if (type === 'csv') {
      this.downloadCombinedResultsCsv();
    }
    else {
      this.exportCombinedResultsPdf();
    }
    this.closeExportChoice();
  }

  private downloadCombinedResultsCsv(): void {
    const rows = this.buildCombinedExportRows();
    const csvLines = [
      this.exportCsvColumns.join(','),
      ...rows.map(row => this.exportCsvColumns.map(column => this.escapeCsvValue(row[column] ?? '-')).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'credentials_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private exportCombinedResultsPdf(): void {
    const stealerResults = this.stealerlogCallbackModel?.Result ?? [];
    const rankedResults = this.rankedResult?.result ?? [];
    const tables: GraphReportTableRow[] = [];

    if (stealerResults.length) {
      tables.push(this.buildPdfSection('Stealer Records', this.buildStealerExportRows()));
    }

    if (rankedResults.length) {
      tables.push(this.buildPdfSection('Ranked Records', this.buildRankedExportRows()));
    }

    const payload: GraphReportPayload = {
      graphKind: 'cti',
      title: 'Credentials Export',
      sessionName: this.searchQuery || 'Stealerlogs Search',
      generatedAtIso: new Date().toISOString(),
      nodes: [],
      edges: [],
      summary: {
        search_query: this.searchQuery || '-',
        total_records: stealerResults.length + rankedResults.length,
        stealer_records: stealerResults.length,
        ranked_records: rankedResults.length,
        stealer_pages: this.stealerlogCallbackModel?.Page_Count ?? 0,
        ranked_pages: this.rankedResult?.pageCount ?? 0
      },
      tables
    };

    this.reportExportService.exportByType(payload, 'doc_pdf');
  }

  private buildCombinedExportRows(): Record<string, string>[] {
    const searchQuery = this.searchQuery || '-';
    return [
      ...this.buildStealerExportRows(searchQuery),
      ...this.buildRankedExportRows(searchQuery)
    ];
  }

  private buildStealerExportRows(searchQuery = this.searchQuery || '-'): Record<string, string>[] {
    return (this.stealerlogCallbackModel?.Result ?? []).map((item, index) => ({
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery,
      email: this.toExportValue(item?.['email']),
      username: this.toExportValue(item?.['username']),
      domain: this.toExportValue(item?.['domain']),
      source: this.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file']),
      hash: this.toExportValue(item?.['m_hash']),
      title: '-',
      url: '-',
      rank: '-',
      date: '-',
      team: '-',
      summary: '-'
    }));
  }

  private buildRankedExportRows(searchQuery = this.searchQuery || '-'): Record<string, string>[] {
    return (this.rankedResult?.result ?? []).map((item, index) => ({
      recordType: 'ranked',
      recordIndex: String(index + 1),
      searchQuery,
      email: '-',
      username: '-',
      domain: '-',
      source: '-',
      hash: this.toExportValue(item?.['m_hash']),
      title: this.toExportValue(item?.['m_title'], 160),
      url: this.toExportValue(item?.['m_url'], 160),
      rank: this.toExportValue(item?.['rank_index']),
      date: this.toExportValue(item?.['m_leak_date'] || item?.['m_update_date']),
      team: this.toExportValue(item?.['m_team']),
      summary: this.toExportValue(item?.['m_important_content'] || item?.['m_content'], 240)
    }));
  }

  private buildPdfSection(title: string, rows: Record<string, string>[]): GraphReportTableRow {
    return {
      title,
      values: Object.fromEntries(rows.map((row) => [
        `Record ${row['recordIndex']}`,
        Object.entries(row)
          .filter(([key]) => key !== 'recordType' && key !== 'recordIndex' && key !== 'searchQuery')
          .filter(([_, value]) => value && value !== '-')
          .map(([key, value]) => `${this.toTitleCase(key)}: ${value}`)
          .join(' | ')
      ]))
    };
  }

  private toExportValue(value: unknown, maxLength = 120): string {
    if (Array.isArray(value)) {
      return this.toExportValue(value.join(', '), maxLength);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) {
      return '-';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  private escapeCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private toTitleCase(value: string): string {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, match => match.toUpperCase()).trim();
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
    if (this.isStandaloneStealerlogsRoute) {
      return Math.max(Number(this.stealerlogCallbackModel.Page_Count || 0), 1);
    }
    return Math.max(Number(this.stealerlogCallbackModel.Page_Count || 0),
      Number(this.rankedResult.pageCount || 0),
      1);
  }
}
