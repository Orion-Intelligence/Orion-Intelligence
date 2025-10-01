import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { trialTime } from '../constants/shared-enums';

@Injectable({
  providedIn: 'root'
})
export class subscriptionGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router, protected dashboardService: DashboardService) {
  }

  public isAdminOrSubscription(): boolean {
    const role = this.authService.getRole();
    const subscription = this.authService.getSubscriptionStatus();
    const verifyDate = this.authService.getVerificationDate();

    let hasTrial = false;

    if (verifyDate) {
      const expiry = new Date(verifyDate);
      expiry.setDate(expiry.getDate() + trialTime);
      hasTrial = expiry > new Date();
    }

    return role === 'admin' || subscription || hasTrial;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.isAdminOrSubscription()) {
      return true;
    }
    this.dashboardService.showSubscription.set(true)
    return this.router.parseUrl('/');
  }
}
