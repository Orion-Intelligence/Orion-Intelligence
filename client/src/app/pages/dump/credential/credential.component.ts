import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, timer, map, distinctUntilChanged, combineLatest } from 'rxjs';
import { ResultComponent } from '../../../shared/partials/result/result.component';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { CredentialParamModel } from '../../../shared/model/results/credentials/credential.param.model';
import { CredentialCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { NgIf } from '@angular/common';
import { CredentialListComponent } from '../credential-list/credential-list.component';

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
  credentialCallbackModel: CredentialCallbackModel = new CredentialCallbackModel();
  protected readonly Math = Math;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService
  ) { }

  get currentResultCount(): number {
    return this.credentialCallbackModel?.Result?.length ?? 0;
  }

  ngOnInit(): void {
    this.credentialCallbackModel = { ...this.dashboardService.credentialCallbackModel };

    combineLatest([this.route.queryParams, this.route.url])
      .pipe(distinctUntilChanged())
      .subscribe(([params]) => {
        this.query = params['q'];
        this.credentialParamModel.q = params['q'] || '';

        if (this.firstTrigger && this.credentialCallbackModel.Result.length > 0) {
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

  ngAfterViewInit(): void { }

  fetchSearchResults(): void {
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
      queryParamsHandling: 'merge'
    }).then();

    this.dashboardService.fetchSearchResults<CredentialCallbackModel>('search/credential', this.credentialParamModel)
      .pipe(switchMap(response => timer(300).pipe(map(() => response))))
      .subscribe(response => {
        if (response.success && response.data) {
          this.credentialCallbackModel = response.data;
          this.dashboardService.credentialCallbackModel = response.data;
        }
        this.isLoading = false;
      });
  }

  onUpdateQuery(query: string): void {
    this.credentialParamModel.q = query;
  }
}
