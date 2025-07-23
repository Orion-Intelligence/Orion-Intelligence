import {Injectable} from '@angular/core';
import {CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AuthService} from '../../services/authetication/auth.service';
import {DashboardService} from '../../services/dashboard/dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class subscriptionGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router,protected dashboardService:DashboardService) {
  }

  isAdmin(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'admin';
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    if (this.isAdmin()) {
      return true;
    }
    this.dashboardService.showSubscription.set(true)
    return this.router.parseUrl('/');
  }
}
