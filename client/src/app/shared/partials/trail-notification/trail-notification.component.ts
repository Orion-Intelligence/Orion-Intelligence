import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { HeaderComponent } from "../header/login-header/header.component";
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import {SubscriptionService} from '../../../services/dashboard/subscription.service';

@Component({
  selector: 'app-trail-notification',
  imports: [NgIf, HeaderComponent],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
  @Input() trialNotificationCheck: boolean = false;
  constructor(public subscriptionService: SubscriptionService, private dashboardService: DashboardService) {
  }
  upgradeNow() {
    this.dashboardService.showSubscription.set(true);
  }
}
