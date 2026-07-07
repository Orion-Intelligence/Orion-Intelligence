import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, timer, map, distinctUntilChanged, combineLatest } from 'rxjs';
import { ResultComponent } from '../../../shared/partials/result/result.component';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { NgClass } from '@angular/common';
import { CredentialListComponent } from './credential-list/credential-list.component';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { SortType } from '../../../shared/constants/shared-enums';
import { HelperService } from '../../../shared/services/helper.service';
import { stealer_filters } from '../../../shared/constants/filters';
import { FormsModule } from '@angular/forms';
import { EmptyQueryComponent } from '../../../shared/partials/empty-query/empty-query.component';
import { PaginationComponent } from "../../../shared/partials/pagination/pagination.component";
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import { IocSearchComponent } from "../../../shared/partials/ioc-search/ioc-search.component";
import { finalize } from 'rxjs/operators';
import { PasswordSchemaComponent } from './password-schema/password-schema.component';
import { PasswordSchemaFilter } from '../../../shared/model/stealerlogs-filter/stealerlogs-filters';
import { ScanHelperMethods } from '../../../shared/partials/scan-helper-methods/scan-helper-methods.component';
import { ExportChoiceModalComponent } from '../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { REPORT_EXPORT_OPTIONS } from '../../../shared/model/report/export-choice.model';
import { ReportExportService } from '../../../shared/services/report-export.service';
import { GraphReportPayload, GraphReportRecordBlock, GraphReportTableRow } from '../../../shared/model/report/report-export.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DomainIndexSidebarComponent } from './domain-index-sidebar/domain-index-sidebar.component';

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
    IocSearchComponent,
    PasswordSchemaComponent,
    ScanHelperMethods,
    ExportChoiceModalComponent,
    DomainIndexSidebarComponent,
    TranslatePipe],
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
    this.isStandaloneStealerlogsRoute = this.router.url.includes('/stealerlogs');
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
          else if(params['url']){
            this.searchQuery="m_search_all:"+params['url'];
          }
          else if(params['user']){
            this.searchQuery="m_search_all:"+params['user'];
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
    key = 'm_date';
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
    if (this.isStandaloneStealerlogsRoute) {
      return;
    }
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
      tables.push(this.buildStealerPdfBlocks(stealerResults));
    }

    if (rankedResults.length) {
      tables.push(this.buildRankedPdfBlocks(rankedResults));
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
      date: this.toExportValue(item?.['m_date'] || item?.['m_update_date']),
      team: this.toExportValue(item?.['m_team']),
      summary: this.toExportValue(item?.['m_important_content'] || item?.['m_content'], 240)
    }));
  }

  private buildStealerPdfBlocks(records: any[]): GraphReportTableRow {
    const recordBlocks = records.map((item, index): GraphReportRecordBlock => {
      const identity = this.firstAvailableExportValue(item?.['email'], item?.['username'], item?.['user']);
      const domain = this.firstAvailableExportValue(item?.['domain'], item?.['source_domain'], item?.['ip']);
      const values: Record<string, string> = {};
      this.addExportField(values, 'Email', item?.['email'], 180);
      this.addExportField(values, 'Username', item?.['username'], 180);
      this.addExportField(values, 'Password', item?.['password'], 220);
      this.addExportField(values, 'Domain', item?.['domain'], 240);
      this.addExportField(values, 'Source Domain', item?.['source_domain'], 240);
      this.addExportField(values, 'IP Address', item?.['ip'], 180);
      this.addExportField(values, 'Channel', this.firstAvailableExportValue(item?.['channel'], item?.['m_channel'], item?.['source_channel'], item?.['m_source_channel']), 240);
      this.addExportField(values, 'Date / Year', this.firstAvailableExportValue(item?.['date'], item?.['timestamp'], item?.['m_date'], item?.['m_update_date']), 160);
      this.addExportField(values, 'File Type', this.firstAvailableExportValue(item?.['file_type'], item?.['fileType'], item?.['type']), 140);
      this.addExportField(values, 'Source File', this.firstAvailableExportValue(item?.['filename'], item?.['file'], item?.['m_file']), 220);
      this.addExportField(values, 'Hash', this.firstAvailableExportValue(item?.['m_hash'], item?.['hash']), 220);
      this.addExportField(values, 'Raw Trace', item?.['raw'], 900);
      this.appendAdditionalExportFields(values, item, new Set([
        '_id',
        'email',
        'username',
        'user',
        'password',
        'domain',
        'source_domain',
        'ip',
        'channel',
        'm_channel',
        'source_channel',
        'm_source_channel',
        'date',
        'timestamp',
        'm_date',
        'm_update_date',
        'file_type',
        'fileType',
        'type',
        'filename',
        'file',
        'm_file',
        'm_hash',
        'hash',
        'raw',
        'index',
        'm_index',
        'mapping'
      ]));
      return {
        title: this.buildRecordBlockTitle(index, identity, domain),
        values
      };
    });
    return {
      title: `Stealer Records (${recordBlocks.length})`,
      values: { records: String(recordBlocks.length) },
      recordBlocks
    };
  }

  private buildRankedPdfBlocks(records: any[]): GraphReportTableRow {
    const recordBlocks = records.map((item, index): GraphReportRecordBlock => {
      const title = this.firstAvailableExportValue(item?.['m_title'], item?.['m_important_content'], item?.['m_url']);
      const primaryUrl = this.firstAvailableExportValue(item?.['m_url'], item?.['m_base_url'], item?.['m_domain'], item?.['m_weblink']);
      const values: Record<string, string> = {};
      this.addExportField(values, 'Title', item?.['m_title'], 260);
      this.addExportField(values, 'URL', primaryUrl, 320);
      this.addExportField(values, 'Domain', this.firstAvailableExportValue(item?.['m_domain'], item?.['m_root_domain']), 240);
      this.addExportField(values, 'Email', item?.['m_email'], 180);
      this.addExportField(values, 'Username', this.firstAvailableExportValue(item?.['m_username'], item?.['m_user']), 180);
      this.addExportField(values, 'Password', item?.['m_password'], 220);
      this.addExportField(values, 'IP Address', item?.['m_ip'], 180);
      this.addExportField(values, 'Channel', this.firstAvailableExportValue(item?.['m_channel'], item?.['m_source_channel']), 240);
      this.addExportField(values, 'Rank', this.firstAvailableExportValue(item?.['rank_index'], item?.['m_rank_index']), 160);
      this.addExportField(values, 'Team', item?.['m_team'], 180);
      this.addExportField(values, 'Date / Year', this.firstAvailableExportValue(item?.['m_date'], item?.['m_update_date'], item?.['m_year']), 160);
      this.addExportField(values, 'Content Type', item?.['m_content_type'], 200);
      this.addExportField(values, 'Source', this.firstAvailableExportValue(item?.['m_source'], item?.['m_file']), 220);
      this.addExportField(values, 'Hash', this.firstAvailableExportValue(item?.['m_hash'], item?.['hash']), 220);
      this.addExportField(values, 'Important Content', item?.['m_important_content'], 900);
      this.addExportField(values, 'Content', item?.['m_content'], 900);
      this.appendAdditionalExportFields(values, item, new Set([
        '_id',
        'm_title',
        'm_url',
        'm_base_url',
        'm_weblink',
        'm_domain',
        'm_root_domain',
        'm_email',
        'm_username',
        'm_user',
        'm_password',
        'm_ip',
        'm_channel',
        'm_source_channel',
        'rank_index',
        'm_rank_index',
        'm_team',
        'm_date',
        'm_update_date',
        'm_year',
        'm_content_type',
        'm_source',
        'm_file',
        'm_hash',
        'hash',
        'm_important_content',
        'm_content',
        'm_index'
      ]));
      return {
        title: this.buildRecordBlockTitle(index, title, primaryUrl),
        values
      };
    });
    return {
      title: `Ranked Records (${recordBlocks.length})`,
      values: { records: String(recordBlocks.length) },
      recordBlocks
    };
  }

  private buildRecordBlockTitle(index: number, ...parts: string[]): string {
    const detail = parts.filter(part => part && part !== '-').slice(0, 2).join(' | ');
    return detail ? `Record ${index + 1} | ${detail}` : `Record ${index + 1}`;
  }

  private firstAvailableExportValue(...values: unknown[]): string {
    for (const value of values) {
      const text = this.toExportValue(value, 240);
      if (text !== '-') {
        return text;
      }
    }
    return '-';
  }

  private addExportField(fields: Record<string, string>, label: string, value: unknown, maxLength = 240): void {
    const text = this.toExportValue(value, maxLength);
    if (!text || text === '-') {
      return;
    }
    let key = label;
    let suffix = 2;
    while (fields[key]) {
      key = `${label} ${suffix}`;
      suffix += 1;
    }
    fields[key] = text;
  }

  private appendAdditionalExportFields(fields: Record<string, string>, record: Record<string, unknown>, excludedKeys: Set<string>): void {
    Object.keys(record ?? {})
      .filter(key => !excludedKeys.has(key))
      .filter(key => this.isSimpleExportValue(record[key]))
      .sort((a, b) => this.toExportLabel(a).localeCompare(this.toExportLabel(b)))
      .forEach(key => this.addExportField(fields, this.toExportLabel(key), record[key], 320));
  }

  private isSimpleExportValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.every(item => item === null || item === undefined || ['string', 'number', 'boolean'].includes(typeof item));
    }
    return ['string', 'number', 'boolean'].includes(typeof value);
  }

  private toExportLabel(key: string): string {
    const cleaned = String(key || '')
      .replace(/^m[_\s-]+/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned ? cleaned.replace(/\b\w/g, c => c.toUpperCase()) : 'Field';
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
