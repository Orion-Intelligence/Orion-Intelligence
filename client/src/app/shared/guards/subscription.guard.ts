import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import {SubscriptionService} from '../../services/dashboard/subscription.service';

@Injectable({
  providedIn: 'root'
})
export class subscriptionGuard implements CanActivate {
  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    protected dashboardService: DashboardService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.subscriptionService.accountExpirable() && !(this.subscriptionService.isDemo())) {
      return true;
    }
    this.dashboardService.showSubscription.set(true);
    return this.router.parseUrl('/');
  }
}
