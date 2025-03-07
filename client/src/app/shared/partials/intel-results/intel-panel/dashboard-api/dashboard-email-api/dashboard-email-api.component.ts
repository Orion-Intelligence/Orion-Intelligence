import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {
  DashboardSearchNoSuggestionComponent
} from '../../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {LoadingFormComponent} from '../../../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../../../animations/dashboard.item.animation';
import {CardData} from '../../../../../model/dynamic/email/search_dynamic_email_callback_model';
import {DashboardNoResultComponent} from "../../../dashboard-no-result/dashboard-no-result.component";

@Component({
  selector: 'app-dashboard-email-api',
  imports: [FormsModule, NgForOf, NgOptimizedImage, ReactiveFormsModule, NgIf, DashboardSearchNoSuggestionComponent, LoadingFormComponent, DashboardNoResultComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-email-api.component.html',
  styleUrl: './dashboard-email-api.component.css'
})
export class DashboardEmailApiComponent implements OnInit {
  username: string = '';
  email: string = '';
  loading = false;
  error = false;
  breachData: CardData | null = null;
  query_triggered = false;

  constructor(public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
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

    this.dashboardService.searchDynamicEmailParambackModel.email = this.email;
    this.dashboardService.searchDynamicEmailParambackModel.username = this.username;
    this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data = [];

    this.router.navigate([], {
      queryParams: {username: this.username, email: this.email}, queryParamsHandling: 'merge'
    }).then();

    this.query_triggered = true;
    this.dashboardService.fetchDynamicEmailSearchResults().subscribe({
      next: (_) => {
        if (this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data.length > 0) {
          this.breachData = this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data[0];
        } else {
          this.breachData = null;
        }
        this.loading = false;
      }, error: (_) => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  protected readonly Object = Object;
  protected readonly Array = Array;
}
