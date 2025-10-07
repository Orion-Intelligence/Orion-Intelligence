import { Component } from '@angular/core';
import { HeaderComponent } from '../header/login-header/header.component';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { NgIf } from '@angular/common';
import { ProSubscriptionComponent } from '../pro-subscription/pro-subscription.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-gateway',
  imports: [HeaderComponent, NgIf, ProSubscriptionComponent],
  templateUrl: './payment-gateway.component.html'
})
export class PaymentGatewayComponent {
  showSubscription = false;

  hideSubscription() {
    this.dashboardService.showSubscription.set(false)
  }

  constructor(public subscriptionService: SubscriptionService, protected dashboardService: DashboardService, private router: Router,) {
    const fromInterceptor =
      this.router.getCurrentNavigation()?.extras?.state?.['fromInterceptor'] ||
      (history.state && history.state['fromInterceptor']);
    if (!fromInterceptor) {
      this.router.navigate(['/login'], { replaceUrl: true }).then();
    }
  }

  upgradeNow() {
    this.showSubscription = true;
    this.dashboardService.showSubscription.set(true);
  }
}
