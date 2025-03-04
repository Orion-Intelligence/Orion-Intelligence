import {Component} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {DashboardSearchNoSuggestionComponent} from '../../../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import {CardData} from '../../../../../../pages/dashboard/models/dynamic/email/search_dynamic_email_callback_model';
import {LoadingFormComponent} from '../../../../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../../../../../pages/app/animations/dashboard-item.animations-in';

@Component({
  selector: 'app-dashboard-email-api',
  imports: [
    FormsModule,
    NgForOf,
    NgOptimizedImage,
    ReactiveFormsModule,
    NgIf,
    DashboardSearchNoSuggestionComponent,
    LoadingFormComponent
  ],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-email-api.component.html',
  styleUrl: './dashboard-email-api.component.css'
})
export class DashboardEmailApiComponent {
  username: string = '';
  email: string = '';
  loading = false;
  error = false;
  breachData: CardData | null = null;

  constructor(public dashboardService: DashboardService) {
  }

  onSearchSubmit($event: SubmitEvent) {
    $event.preventDefault();
    this.loading = true;
    this.error = false;
    this.dashboardService.searchDynamicEmailParambackModel.email = this.email;
    this.dashboardService.searchDynamicEmailParambackModel.username = this.username;
    this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data = []


    this.dashboardService.fetchDynamicEmailSearchResults().subscribe({
      next: (_) => {
        if (this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data.length > 0) {
          this.breachData = this.dashboardService.searchDynamicEmailCallbackbackModel.cards_data[0];
        } else {
          this.breachData = null;
        }
        this.loading = false;
      },
      error: (_) => {
        this.error = true;
        this.loading = false;
      }
    });

  }
}
