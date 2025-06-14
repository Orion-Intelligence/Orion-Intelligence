import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {EmptyResultComponent} from '../../empty-result/empty-result.component';
import {LoadingFormComponent} from '../../loading-form/loading-form.component';
import {EmptyQueryComponent} from '../../empty-query/empty-query.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {CardData, SearchDynamicEmailCallbackModel} from '../../../model/api/email/search_dynamic_email_callback_model';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {searchDynamicEmailParamModel} from '../../../model/api/email/search_dynamic_email_param_model';

@Component({
  selector: 'app-dashboard-email-api',
  imports: [FormsModule, NgForOf, NgOptimizedImage, ReactiveFormsModule, NgIf, EmptyResultComponent, LoadingFormComponent, EmptyQueryComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-email-api.component.html'
})
export class DashboardEmailApiComponent implements OnInit {
  username: string = '';
  email: string = '';
  loading = false;
  error = false;
  breachData: CardData | null = null;
  query_triggered = false;

  emailParambackModel: searchDynamicEmailParamModel = new searchDynamicEmailParamModel();
  emailCallbackbackModel: SearchDynamicEmailCallbackModel = new SearchDynamicEmailCallbackModel();
  protected readonly Object = Object;
  protected readonly Array = Array;

  constructor(public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    if (this.emailCallbackbackModel.cards_data.length > 0) {
      this.query_triggered = true
      this.breachData = this.emailCallbackbackModel.cards_data[0];
    }
    this.route.queryParams.subscribe(params => {
      if (params['username']) {
        this.username = params['username'];
      }
      if (params['email']) {
        this.email = params['email'];
      }

      if (this.email || this.username) {
        this.onSearchSubmit(null);
      }
    });
  }

  onSearchSubmit($event: SubmitEvent | null) {
    if ($event) {
      $event.preventDefault();
    }

    this.loading = true;
    this.error = false;

    this.emailParambackModel.email = this.email;
    this.emailParambackModel.username = this.username;
    this.emailCallbackbackModel.cards_data = [];

    this.router.navigate([], {
      queryParams: {username: this.username, email: this.email}, queryParamsHandling: 'merge'
    }).then();

    this.query_triggered = true;
    this.dashboardService.fetchSearchResults<SearchDynamicEmailCallbackModel>('dynamic/email', this.emailParambackModel)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.emailCallbackbackModel = response.data;
            this.breachData = response.data.cards_data?.length > 0 ? response.data.cards_data[0] : null;
          } else {
            this.emailCallbackbackModel = new SearchDynamicEmailCallbackModel();
            this.breachData = null;
          }
          this.loading = false;
        }, error: () => {
          this.error = true;
          this.loading = false;
        }
      });
  }
}
