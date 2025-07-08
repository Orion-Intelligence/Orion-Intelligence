import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { AppService } from '../../../../services/core/app.service';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
  timer
} from 'rxjs';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { ConsolidatedParamModel } from '../../../model/results/consolidated/consolidated.param.model';
import {
  NgForOf,
  NgIf,
  TitleCasePipe
} from '@angular/common';
import { ResultComponent } from '../../result/result.component';
import {
  DashboardResultsGridComponent
} from '../dashboard-results/dashboard-results-grid/dashboard-results-grid.component';
import { ConsolidatedCallbackModel } from '../../../model/results/consolidated/consolidated.callback.model';
import {
  DashboardResultExploitComponent
} from '../dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component';
import { DashboardResultListComponent } from '../dashboard-results/dashboard-result-list/dashboard-result-list.component';
import { DashboardResultChatComponent } from '../dashboard-results/dashboard-result-chat/dashboard-result-chat.component';
import { SortGroupedResultsPipe } from '../../../model/pipes/sort-grouped-results.pipe';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, ExploitSubCategory, FeedSubCategory, GeneralSubCategory, SocialSubCategory } from '../../../enums/pages';
import { SelectionStoreService } from '../../../../services/dashboard/selection.service';

@Component({
  selector: 'app-dashboard-consolidated',
  standalone: true,
  imports: [
    NgIf,
    ResultComponent,
    DashboardResultsGridComponent,
    NgForOf,
    TitleCasePipe,
    DashboardResultExploitComponent,
    DashboardResultListComponent,
    DashboardResultChatComponent,
    SortGroupedResultsPipe
  ],
  templateUrl: './dashboard-consolidated.component.html',
  animations: [fadeInDashboardItem]
})
export class DashboardConsolidatedComponent implements OnInit, AfterViewInit {
  public consolidatedParamModel: ConsolidatedParamModel = new ConsolidatedParamModel();
  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  public groupedResults: { [index: string]: any[] } = {};
  query = '';
  isLoading = false;
  firstTrigger = true;
  result_count = 0;
  protected readonly Math = Math;
  apiCategories = Object.values(ApiSubCategory);
  exploitCategories = Object.values(ExploitSubCategory);
  dumpCategories = Object.values(DumpSubCategory);
  newsCategories = Object.values(FeedSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  socialCategories = Object.values(SocialSubCategory);

  constructor(
    public appService: AppService,
    public dashboardService: DashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    protected selectionStore: SelectionStoreService
  ) {
  }

  ngAfterViewInit(): void {
    this.appService.updatePage(this.consolidatedParamModel.mSearchParamPage);
  }

  ngOnInit(): void {
    this.consolidatedCallbackModel = {
      ...this.dashboardService.consolidatedCallbackModel
    } as ConsolidatedCallbackModel;

    this.populateGroupedResults();

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params, urlSegments]) => {
        this.query = params['q'];
        this.consolidatedParamModel.q = params['q'] || '';
        this.consolidatedParamModel.mSearchParamPage = params['mSearchParamPage'] || '1';
        this.consolidatedParamModel.mSearchParamType =
          urlSegments.length ? urlSegments[urlSegments.length - 1].path : 'all';

        if (this.firstTrigger && Object.keys(this.groupedResults).length > 0) {
          this.isLoading = false;
          this.query = this.consolidatedParamModel.q;
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }

        this.firstTrigger = false;
      });
  }

  fetchSearchResults(_ = false): void {
    if (!this.consolidatedParamModel.q) {
      this.isLoading = false;
      this.consolidatedParamModel.q = '';
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' }).then();
    }

    this.isLoading = true;

    const cleanedParams: any = {};
    Object.entries(this.consolidatedParamModel).forEach(([key, value]) => {
      if (value != null && value !== '') cleanedParams[key] = value;
    });

    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
      relativeTo: this.route
    }).then(() => {
      this.cdr.detectChanges();
    });

    this.dashboardService
      .fetchConsolidatedGroupedResults('search/consolidated', this.consolidatedParamModel)
      .pipe(switchMap(response => timer(500).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.consolidatedCallbackModel = response.data;
          this.dashboardService.consolidatedCallbackModel = this.consolidatedCallbackModel;
          this.populateGroupedResults();
        } else {
          this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
          this.groupedResults = {};
        }

        this.isLoading = false;
      });
  }

  populateGroupedResults(): void {
    this.groupedResults = {
      ...(this.consolidatedCallbackModel.leak_model?.Result?.length
        ? { leak_model: this.consolidatedCallbackModel.leak_model.Result }
        : {}),
      ...(this.consolidatedCallbackModel.chat_model?.Result?.length
        ? { chat_model: this.consolidatedCallbackModel.chat_model.Result }
        : {}),
      ...(this.consolidatedCallbackModel.defacement_model?.Result?.length
        ? { defacement_model: this.consolidatedCallbackModel.defacement_model.Result }
        : {}),
      ...(this.consolidatedCallbackModel.generic_model?.Result?.length
        ? { generic_model: this.consolidatedCallbackModel.generic_model.Result }
        : {}),
      ...(this.consolidatedCallbackModel.exploit_model?.Result?.length
        ? { exploit_model: this.consolidatedCallbackModel.exploit_model.Result }
        : {})
    };

    this.result_count = Object.values(this.groupedResults)
      .reduce((sum, list) => sum + list.length, 0);
  }

  onUpdateQuery(query: string) {
    this.consolidatedParamModel.q = query;
  }

  getTotalResultCount(): number {
    return Object.values(this.groupedResults)
      .reduce((sum, list) => sum + list.length, 0);
  }
  onSectionSelected(section: Category) {
    this.selectionStore.setSelectedSection(section);
    let firstSubcategory: string | undefined;
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
    }

    if (firstSubcategory) {
      this.selectionStore.setSelectedOption(firstSubcategory);
    }
    const routePrefix = '/dashboard/' + section.toLowerCase() + '/all';
    this.router.navigate([routePrefix], {
      queryParams: { mSearchParamPage: 1 },
      queryParamsHandling: 'merge'
    });
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
      default:
        return Category.BREACH;
    }
  }

}
