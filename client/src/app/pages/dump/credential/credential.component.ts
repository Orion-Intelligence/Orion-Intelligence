import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {switchMap, timer, map, distinctUntilChanged, combineLatest} from 'rxjs';
import {ResultComponent} from '../../../shared/partials/result/result.component';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';
import {DashboardService} from '../../../services/dashboard/dashboard.service';
import {NgIf, NgOptimizedImage} from '@angular/common';
import {CredentialListComponent} from '../credential-list/credential-list.component';
import {StealerLogCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {SortType} from '../../../shared/constants/shared-enums';
import {HelperService} from '../../../shared/services/helper.service';
import {stealer_filters} from '../../../shared/constants/filters';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-credential',
  standalone: true,
  imports: [ResultComponent, NgIf, CredentialListComponent, FormsModule, NgOptimizedImage],
  templateUrl: './credential.component.html',
  animations: [fadeInDashboardItem],
})
export class CredentialComponent implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  protected readonly filters = stealer_filters;

  isLoading: boolean = false;
  firstTrigger: boolean = true;
  user: any;
  url: any;
  type: string;

  stealerlogCallbackModel: StealerLogCallbackModel = new StealerLogCallbackModel();

  constructor(protected helperService: HelperService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, protected dashboardService: DashboardService) {
    this.type = this.route.snapshot.data['type'];
  }

  get currentResultCount(): number {
    return this.stealerlogCallbackModel?.Result?.length ?? 0;
  }

  ngOnInit(): void {
    this.stealerlogCallbackModel = {...this.dashboardService.stealerlogCallbackModel};
    this.dashboardService.consolidatedParamModel.fullsearch = false;

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params]) => {
        this.url = params['url'];
        this.user = params['user'];

        this.dashboardService.consolidatedParamModel.url = params['url'] || '';
        this.dashboardService.consolidatedParamModel.user = params['user'] || '';

        if (this.dashboardService.consolidatedParamModel.category ==this.type && this.firstTrigger && this.stealerlogCallbackModel.Result.length > 0) {
          this.isLoading = false;
        } else if(this.dashboardService.consolidatedParamModel.category !=this.type){
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }

        this.firstTrigger = false;
      });
  }

  ngAfterViewInit(): void {
  }

  fetchSearchResults(reset = true): void {
    this.dashboardService.consolidatedParamModel.url = this.url
    this.dashboardService.consolidatedParamModel.user = this.user
    this.dashboardService.consolidatedParamModel.category = this.type

    if (this.isLoading) return;

    this.isLoading = true;

    const cleanedParams: any = {};
    Object.entries(this.dashboardService.consolidatedParamModel).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanedParams[key] = value;
      }
    });
    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: reset ? '' : 'merge'
    }).then();

    if (!this.dashboardService.consolidatedParamModel.user) {
      this.dashboardService.consolidatedParamModel.user = ""
    }
    if (!this.dashboardService.consolidatedParamModel.url) {
      this.dashboardService.consolidatedParamModel.url = ""
    }

    this.dashboardService.fetchSearchResults<StealerLogCallbackModel>('search/stealerlogs', this.dashboardService.consolidatedParamModel)
      .pipe(switchMap(response => timer(300).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.stealerlogCallbackModel = response.data;
          this.dashboardService.stealerlogCallbackModel = response.data;
        }
        this.isLoading = false;
      });
  }

  onToggleSort(sort: SortType) {
    let key;
    let order: 'asc' | 'desc' = 'asc';

    key = 'm_message_date';

    if (sort === SortType.NEWEST_FIRST) {
      order = 'desc';
    } else if (sort === SortType.OLDEST_FIRST) {
      order = 'asc';
    } else if (sort === SortType.DEFAULT) {
      this.fetchSearchResults();
      return;
    }

    this.stealerlogCallbackModel.Result = this.helperService.sortByKey<any>(
      this.stealerlogCallbackModel.Result,
      key,
      order
    );
    this.cdr.detectChanges();
  }

  reloadFilters(_: Record<string, string | null>) {
    this.fetchSearchResults();
  }

  resetFilters(_: void) {
    this.fetchSearchResults(true);
  }

  onToggleAnalyticsTrigger($event: string) {
    this.dashboardService.consolidatedParamModel.fullsearch = $event == "Full Search";
    this.fetchSearchResults(true);
  }
}
