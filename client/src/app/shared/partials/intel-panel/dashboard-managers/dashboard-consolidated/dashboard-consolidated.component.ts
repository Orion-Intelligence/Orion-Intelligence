import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { AppService } from '../../../../../services/core/app/app.service';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, TitleCasePipe } from '@angular/common';
import { ResultComponent } from '../../../result/result.component';
import { DashboardResultsGeneralGridComponent } from '../../dashboard-results/dashboard-results-general-grid/dashboard-results-general-grid.component';
import { ConsolidatedCallbackModel } from '../../../../model/results/consolidated/consolidated.callback.model';
import { DashboardResultExploitComponent } from '../../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import { DashboardResultChatComponent } from '../../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { SortGroupedResultsPipe } from '../../../../pipes/sort-grouped-results.pipe';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, FeedSubCategory, GeneralSubCategory, SocialSubCategory } from '../../../../constants/pages';
import { SelectionStoreService } from '../../../../../services/dashboard/selection.service';
import { TooltipDirective } from '../../../../directive/tooltip-directive.directive';
import { DashboardResultSocialComponent } from '../../dashboard-results/dashboard-result-social/dashboard-result-social.component';
import { ResultInsightsComponent } from "../result-insights/result-insights.component";
import { consolidated_filters } from '../../../../constants/filters';
import { ALLOWED_CONSOLIDATED_RANKED_SINGLETON } from '../../../../constants/shared-enums';
import { ThreatResultsComponent } from "./defacement-results/threat-results.component";
import { RankedCallbackModel } from '../../../../model/results/consolidated/ranked.callback.model';
import { ApiService } from '../../../../services/api.service';
import { HelperService } from '../../../../services/helper.service';
import { HttpClient } from '@angular/common/http';
import { ConsolidatedLiveApis } from '../../../../model/results/consolidated/consolidated.callback.model';
import { ConsolidatedLiveApiResults } from '../../../../model/results/consolidated/consolidated.callback.model';
import { ConsolidatedApiService } from '../../../../services/consolidated.api.service';
import { ConsolidatedScanResults } from '../../../../model/results/consolidated/consolidated.callback.model';


@Component({
  selector: 'app-dashboard-consolidated',
  standalone: true,
  imports: [NgClass, NgIf, NgSwitch, NgSwitchCase, ResultComponent, DashboardResultsGeneralGridComponent, NgForOf, TitleCasePipe, DashboardResultExploitComponent, DashboardResultChatComponent, SortGroupedResultsPipe, TooltipDirective, DashboardResultSocialComponent, ResultInsightsComponent, ThreatResultsComponent],
  templateUrl: './dashboard-consolidated.component.html',
  styleUrl: './dashboard-consolidated.component.css',
  animations: [fadeInDashboardItem]
})
export class DashboardConsolidatedComponent implements OnInit, AfterViewInit {

  protected readonly Math = Math;
  protected readonly fadeInDashboardItem = fadeInDashboardItem;
  protected readonly consolidated_filters = consolidated_filters;


  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  public groupedResults: { [index: string]: any[] } = {};
  public response: any;
  public pageCounts: { [key: string]: number } = {};

  isGrouped = true
  query = '';
  isLoading = signal(false);
  firstTrigger = true;
  result_count = 0;
  apiCategories = Object.values(ApiSubCategory);
  dumpCategories = Object.values(DumpSubCategory);
  newsCategories = Object.values(FeedSubCategory);
  socialCategories = Object.values(SocialSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  rankedResult: RankedCallbackModel = new RankedCallbackModel();

  scandomains: string[] = [];
  scanEmails: string[] = [];
  scanUsers: string[] = [];
  scanPlaystoreUrls: string[] = [];

  scanResults: ConsolidatedScanResults[] = [];
  isScanLoading = false;
  private scanTriggered = false;

  liveApiEntities: ConsolidatedLiveApis[] = [];

  liveApiResults: ConsolidatedLiveApiResults[] = [];
  isProcessing = false;


  private scannedEmails = new Set<string>();
  private scannedUsers = new Set<string>();
  private scannedPlaystore = new Set<string>();
  private scannedDomains = new Set<string>();

  constructor(public http: HttpClient, public appService: AppService, public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected selectionStore: SelectionStoreService, private apiService: ApiService, private helperService: HelperService, private liveApiService: ConsolidatedApiService) {
    this.pageCounts = {};
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.dashboardService.consolidatedParamModel.page);
    if (this.router.url.split('?')[0] != this.dashboardService.m_current_route) {
      this.ngOnInit()
    }
  }

  ngOnInit(): void {
    this.consolidatedCallbackModel = {
      ...this.dashboardService.consolidatedCallbackModel
    } as ConsolidatedCallbackModel;

    this.populateGroupedResults();

    combineLatest([this.route.queryParams, this.route.url]).pipe(distinctUntilChanged()).subscribe(([params, urlSegments]) => {
      this.query = params['q'];
      this.dashboardService.consolidatedParamModel.q = params['q'] || '';
      this.dashboardService.consolidatedParamModel.page = params['page'] || '1';

      this.dashboardService.consolidatedParamModel.category = urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';

      if (this.firstTrigger && Object.keys(this.groupedResults).length > 0) {
        this.isLoading.set(false);
        this.query = this.dashboardService.consolidatedParamModel.q;
      } else {
        this.cdr.detectChanges();
        this.fetchSearchResults();
      }

      this.firstTrigger = false;
    });

    this.initEntities();
    if (this.liveApiEntities && this.liveApiEntities.length > 0) {
      this.LiveApisSearch();
    }

    if (this.scandomains.length === 0) {
      return;
    }
    if (this.scanTriggered) {
      return;
    }
    this.scanTriggered = true;
    this.runDomainScan();

  }

  fetchSearchResults(_ = false): void {
    if (this.checkProfile() && !this.hasIOCs()) {
      return
    }
    this.initEntities();
    if (!this.isGrouped) {
      this.fetchRanked()
      return
    }

    if (this.isLoading()) return;

    if (!this.dashboardService.consolidatedParamModel.q) {
      this.isLoading.set(false);
      this.dashboardService.consolidatedParamModel.q = '';
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' }).then();
    }

    this.isLoading.set(true);

    const cleanedParams: any = {};

    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      if (value != null && value !== '') cleanedParams[key] = value;
    });
    this.router.navigate([], {
      queryParams: cleanedParams, queryParamsHandling: 'merge', replaceUrl: true, relativeTo: this.route
    }).then(() => {
      this.cdr.detectChanges();
    });

    const category = this.route.snapshot.routeConfig?.path;
    if (category && ALLOWED_CONSOLIDATED_RANKED_SINGLETON.has(category)) {
      this.isGrouped = true
      this.dashboardService.consolidatedParamModel.category = category
    }

    if (this.checkProfile()) {
      this.dashboardService.consolidatedParamModel.profile = true
    }

    this.dashboardService.fetchConsolidatedGroupedResults('search/consolidated', this.dashboardService.consolidatedParamModel).pipe(switchMap(response => timer(500).pipe(map(() => response)))).subscribe(response => {
      if (response.success && response.data) {
        this.response = response.data
        this.consolidatedCallbackModel = this.response;
        this.dashboardService.consolidatedCallbackModel = this.consolidatedCallbackModel;
        this.populateGroupedResults();
      } else {
        this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
        this.groupedResults = {};
      }

      this.isLoading.set(false);
    });
  }

  resetFilters(_: void) {
    this.fetchSearchResults(true);
  }

  reloadFilters(_: Record<string, string | null>) {
    this.dashboardService.consolidatedParamModel.page = 1
    this.fetchSearchResults();
  }

  fetchRanked() {
    if (this.checkProfile() && !this.hasIOCs()) {
      return;
    }
    this.isLoading.set(true);
    this.rankedResult = new RankedCallbackModel();
    this.dashboardService
      .fetchConsolidatedRankededResults('search/consolidated/ranked', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(500).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.rankedResult = response.data;
        }
        this.isLoading.set(false);
      });
  }

  populateGroupedResults(): void {
    this.groupedResults = {};
    this.pageCounts = {};

    const models: (keyof ConsolidatedCallbackModel)[] = [
      'leak_model',
      'chat_model',
      'defacement_model',
      'generic_model',
      'exploit_model',
      'social_model',
      'stealer_model',
      'tracking_model',
      'news_model',
    ];

    models.forEach(model => {
      this.groupedResults[model] = this.consolidatedCallbackModel[model]?.Result ?? [];
      this.pageCounts[model] = this.consolidatedCallbackModel[model]?.Page_Count ?? 0;
    });


    this.result_count = Object.values(this.groupedResults).reduce(
      (sum, list) => sum + list.length,
      0
    );
  }

  onUpdateQuery(query: string) {
    this.dashboardService.consolidatedParamModel.q = query;
  }

  getTotalResultCount(): number {
    const groupedCount = Object.values(this.groupedResults).reduce((sum, list) => sum + list.length, 0);
    const rankedCount = this.rankedResult.pageCount;
    if (this.isGrouped) {
      return groupedCount
    } else {
      return rankedCount
    }
  }

  isIpReportExpandable(): boolean {
    const totalWithoutDefacement = Object.entries(this.groupedResults)
      .filter(([key]) => key !== 'defacement_model')
      .reduce((sum, [_, list]) => sum + list.length, 0);

    return totalWithoutDefacement == 0;
  }

  onSectionSelected(section: Category) {
    this.selectionStore.setSelectedSection(section);
    let firstSubcategory: string | undefined;
    let second_category = "all"
    switch (section) {
      case Category.STRATEGIC:
        firstSubcategory = this.generalCategories[0];
        break;
      case Category.BREACH:
        firstSubcategory = this.leakCategories[0];
        break;
      case Category.API:
        firstSubcategory = this.apiCategories[0];
        break;
      case Category.DEFACEMENT:
        firstSubcategory = this.defacementCategories[0];
        break;
      case Category.DUMP:
        firstSubcategory = this.dumpCategories[0];
        break;
      case Category.FEED:
        firstSubcategory = this.newsCategories[0];
        break;
      case Category.SOCIAL:
        firstSubcategory = this.socialCategories[0];
        second_category = this.socialCategories[0].toLowerCase()
        break;
    }

    if (firstSubcategory) {
      this.selectionStore.setSelectedOption(firstSubcategory);
    }
    const routePrefix = '/dashboard/' + section.toLowerCase() + '/' + second_category;
    this.router.navigate([routePrefix], {
      queryParams: { page: 1 }, queryParamsHandling: 'merge'
    }).then();
  }

  getCategoryFromKey(key: string): Category {
    switch (key) {
      case 'leak_model':
        return Category.BREACH;
      case 'exploit_model':
        return Category.EXPLOIT;
      case 'defacement_model':
        return Category.DEFACEMENT;
      case 'chat_model':
        return Category.SOCIAL;
      case 'generic_model':
        return Category.STRATEGIC;
      case 'social_model':
        return Category.SOCIAL;
      default:
        return Category.BREACH;
    }
  }

  onToggleMenu(tab: string): void {
    if (tab == "Group") {
      this.isGrouped = true
      this.fetchSearchResults();
    } else if (tab == "Ranked") {
      this.isGrouped = false
      this.fetchRanked()
    }
  }

  checkProfile(): boolean {
    const url = this.router.url;
    const parts = url.split('/');
    return parts.includes('profile');
  }

  hasIOCs(): boolean {
    const categories = this.appService.configData().localSettings.entityfilterCategories;
    return Object.values(categories).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0
    );
  }

  shouldShowSection(): boolean {
    const totalResults = this.getTotalResultCount();
    const hasAnyData = totalResults > 0;
    if (!this.checkProfile()) {
      return hasAnyData;
    }
    return hasAnyData && this.hasIOCs();
  }


  initEntities(): void {
    const filters = this.appService.configData().localSettings.entityfilterCategories;

    const unique = (key: string): string[] =>
      Array.isArray(filters[key]) ? Array.from(new Set(filters[key])) : [];

    const filterDomains = unique('m_domain');
    const filterEmails = unique('m_email');
    const filterUsers = unique('m_social_media_profiles');
    const filterUrls = unique('m_url');

    const searchAll = filters['m_search_all'] || '';
    const queryInput = (this.query || '').trim();
    const combinedText = [searchAll, queryInput].filter(Boolean).join(' ');
    const extractedDomains = this.helperService.extractLinks(combinedText);
    const extractedEmails = this.helperService.extractEmails(combinedText);
    const extractedPlaystoreUrls = extractedDomains.filter((d: string) =>
      d.includes('play.google.com/store/apps')
    );

    const extractedUsernamesFromEmails = extractedEmails.map(email => email.split('@')[0]);

    const possibleUsernames = combinedText
      .split(/[\s,;]+/)
      .filter(w => w.length >= 3 && !w.includes('@') && !w.includes('.') && !w.startsWith('http'))
      .map(w => w.trim());

    const currentDomains = Array.from(new Set([
      ...filterDomains,
      ...extractedDomains,
      ...extractedPlaystoreUrls.map(() => 'play.google.com')
    ]));

    const currentEmails = Array.from(new Set([
      ...filterEmails,
      ...extractedEmails
    ]));

    const currentUsers = Array.from(new Set([
      ...filterUsers,
      ...extractedUsernamesFromEmails,
      ...possibleUsernames
    ]));

    const currentPlaystore = Array.from(new Set([
      ...filterUrls.filter((url: string) => url.includes('play.google.com/store/apps')),
      ...extractedPlaystoreUrls
    ]));

    this.cleanScannedSetAndResults('email', this.scannedEmails, currentEmails);
    this.cleanScannedSetAndResults('user', this.scannedUsers, currentUsers);
    this.cleanScannedSetAndResults('playstore', this.scannedPlaystore, currentPlaystore);
    this.cleanScannedSetAndResults('domain', this.scannedDomains, currentDomains);

    const newEmails = currentEmails.filter(e => !this.scannedEmails.has(e));
    const newUsers = currentUsers.filter(u => !this.scannedUsers.has(u));
    const newPlaystore = currentPlaystore.filter(p => !this.scannedPlaystore.has(p));
    const newDomains = currentDomains.filter(d => !this.scannedDomains.has(d));

    newEmails.forEach(e => this.scannedEmails.add(e));
    newUsers.forEach(u => this.scannedUsers.add(u));
    newPlaystore.forEach(p => this.scannedPlaystore.add(p));
    newDomains.forEach(d => this.scannedDomains.add(d));
    this.liveApiEntities = [
      ...newEmails.map(email => ({
        type: 'user' as const,
        q1: '',
        q2: email
      })),
      ...newUsers.map(userHandle => ({
        type: 'social' as const,
        q1: userHandle
      })),
      ...newPlaystore.map(url => ({
        type: 'cracked' as const,
        q1: url
      }))
    ];

    this.scandomains = Array.from(new Set([...this.scandomains, ...newDomains]));

    if (this.liveApiEntities.length > 0) {
      this.LiveApisSearch();
    }
    if (newDomains.length > 0) {
      this.runDomainScan();
    }
  }

  private cleanScannedSetAndResults(
    type: 'email' | 'user' | 'playstore' | 'domain',
    set: Set<string>,
    currentItems: string[]
  ): void {
    for (const item of Array.from(set)) {
      if (!currentItems.includes(item)) {
        set.delete(item);
        if (type === 'domain') {
          this.scanResults = this.scanResults.filter(r => r.domain !== item);
        } else {
          this.liveApiResults = this.liveApiResults.filter(r => {
            const q = r.input.q1 || r.input.q2 || '';
            return !q.includes(item);
          });
        }
      }
    }
  }

  runDomainScan() {
    if (!this.scandomains || this.scandomains.length === 0) return;

    this.isScanLoading = true;
    this.liveApiService.runScanDomains(this.scandomains)
      .pipe(finalize(() => (this.isScanLoading = false)))
      .subscribe({
        next: (results: ConsolidatedScanResults[]) => {
          results.forEach(r => {
            const existing = this.scanResults.find(x => x.domain === r.domain);
            if (existing) Object.assign(existing, r);
            else this.scanResults.push(r);
          });
        },
        error: () => (this.isScanLoading = false)
      });
  }
  extractHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  getGradeClass(grade: string): string {
    if (['D', 'F'].includes(grade)) return 'scan_report-section-danger';
    if (grade === 'C') return 'scan_report-section-warning';
    return '';
  }
  getScanResult(domain: string) {
    return this.scanResults.find(r => r.domain === domain) || null;
  }


  LiveApisSearch(): void {
    if (!this.liveApiEntities || this.liveApiEntities.length === 0) return;

    this.isProcessing = true;
    this.liveApiService.runLiveApiSearch(this.liveApiEntities)
      .pipe(finalize(() => (this.isProcessing = false)))
      .subscribe({
        next: (results: ConsolidatedLiveApiResults[]) => {
          results.forEach(r => {
            const q1 = r.input.q1 || '';
            const q2 = r.input.q2 || '';
            const existing = this.liveApiResults.find(
              x => (x.input.q1 === q1 && x.input.q2 === q2)
            );
            if (existing) Object.assign(existing, r);
            else this.liveApiResults.push(r);
          });
        },
        error: () => (this.isProcessing = false)
      });
  }
}
