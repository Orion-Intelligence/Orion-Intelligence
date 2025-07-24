import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {switchMap, timer, map, distinctUntilChanged, combineLatest} from 'rxjs';
import {ResultComponent} from '../../../shared/partials/result/result.component';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';
import {CredentialParamModel} from '../../../shared/model/results/credentials/credential.param.model';
import {DashboardService} from '../../../services/dashboard/dashboard.service';
import {NgIf} from '@angular/common';
import {CredentialListComponent} from '../credential-list/credential-list.component';
import {StealerLogCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {SortType} from '../../../shared/constants/enums';
import {HelperService} from '../../../shared/services/helper.service';
import {stealer_filters} from '../../../shared/constants/filters';

@Component({
  selector: 'app-credential',
  standalone: true,
  imports: [ResultComponent, NgIf, CredentialListComponent],
  templateUrl: './credential.component.html',
  animations: [fadeInDashboardItem],
})
export class CredentialComponent implements OnInit, AfterViewInit {
  query: string = "";
  isLoading: boolean = false;
  firstTrigger: boolean = true;

  credentialParamModel: CredentialParamModel = new CredentialParamModel();
  stealerlogCallbackModel: StealerLogCallbackModel = new StealerLogCallbackModel();
  protected readonly Math = Math;
  protected readonly filters = stealer_filters;

  constructor(
    protected helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService
  ) {
  }

  get currentResultCount(): number {
    return this.stealerlogCallbackModel?.Result?.length ?? 0;
  }

  ngOnInit(): void {
    this.stealerlogCallbackModel = {...this.dashboardService.stealerlogCallbackModel};

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params]) => {
        this.query = params['q'];
        this.credentialParamModel.q = params['q'] || '';

        if (this.firstTrigger && this.stealerlogCallbackModel.Result.length > 0) {
          this.isLoading = false;
          if (this.credentialParamModel.q)
            this.query = this.credentialParamModel.q;
        } else {
          this.cdr.detectChanges();
          this.fetchSearchResults();
        }

        this.firstTrigger = false;
      });
  }

  ngAfterViewInit(): void {
  }

  fetchSearchResults(reset = false): void {
    if (this.isLoading) return;

    this.isLoading = true;

    const cleanedParams: any = {};
    Object.entries(this.credentialParamModel).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanedParams[key] = value;
      }
    });
    this.router.navigate([], {
      queryParams: cleanedParams,
      queryParamsHandling: reset ? '' : 'merge'
    }).then();


    this.credentialParamModel.q = this.credentialParamModel.q.replace(/"([^"]*?)@([^"]*?)"/g, '"$1" "$2"');
    this.credentialParamModel.q = this.credentialParamModel.q
      .split(' ')
      .map(token => token.startsWith('@') && !token.includes('"') ? token.replace('@', '') : token)
      .join(' ');

    this.dashboardService.fetchSearchResults<StealerLogCallbackModel>('search/stealerlogs', this.credentialParamModel)
      .pipe(switchMap(response => timer(300).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.stealerlogCallbackModel = response.data;
          this.dashboardService.stealerlogCallbackModel = response.data;
        }
        this.isLoading = false;
      });
  }

  onUpdateQuery(query: string): void {
    this.credentialParamModel.q = query;
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

  reloadFilters(event: Record<string, string | null>) {
    if (event['mDateRange']) {
      this.credentialParamModel.mDateRange = event['mDateRange']
    }
    this.fetchSearchResults();
  }

  resetFilters(_: void) {
    this.credentialParamModel.mDateRange = "";
    this.fetchSearchResults(true);
  }

}
