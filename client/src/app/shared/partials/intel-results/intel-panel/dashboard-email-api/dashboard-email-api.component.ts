import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {
  NoSuggestionComponent
} from '../../../no-suggestion/no-suggestion.component';
import {LoadingFormComponent} from '../../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {CardData} from '../../../../model/dynamic/email/search_dynamic_email_callback_model';
import {NoResultComponent} from "../../../no-result/no-result.component";

@Component({
  selector: 'app-dashboard-email-api',
  imports: [FormsModule, NgForOf, NgOptimizedImage, ReactiveFormsModule, NgIf, NoSuggestionComponent, LoadingFormComponent, NoResultComponent],
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

  constructor(public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    if(this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data.length>0){
      this.query_triggered = true
      this.breachData = this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data[0];
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
