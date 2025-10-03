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
    return this.checkAdmin();
  }
  public checkSubscription(): boolean {
    const subscription = false;
    return subscription;
  }
  public checkAdmin(): boolean {
    const role = this.authService.getRole();
    return role === 'admin'
  }
  public getTrialDaysLeft(): number {
    const verifyDate = '';
    if (!verifyDate) {
      return 0;
    }
    const expiry = new Date(verifyDate);
    expiry.setDate(expiry.getDate() + trialTime);
    const now = new Date();
    if (expiry <= now) {
      return 0;
    }
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.isAdminOrSubscription()) {
      return true;
    }
    this.dashboardService.showSubscription.set(true)
    return this.router.parseUrl('/');
  }
}
