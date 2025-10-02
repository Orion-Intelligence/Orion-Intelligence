import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { subscriptionGuard } from '../../guards/subscription.guard';
import { HeaderComponent } from "../header/login-header/header.component";
import { DashboardService } from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-trail-notification',
  imports: [NgIf, HeaderComponent],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
  @Input() trialNotificationCheck: boolean = false;
  constructor(public subscriptionGuard: subscriptionGuard, private dashboardService: DashboardService) {
  }
  upgradeNow() {
    this.dashboardService.showSubscription.set(true);
  }
}
