import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { AppService } from '../../services/core/app/app.service';
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private appService: AppService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.getIsMobileDemo() && state.url !== '/dashboard/strategic/all') {
      this.router.navigate(['/dashboard/strategic/all']).then();
      return false;
    }
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { redirect: state.url } }).then();
      return false;
    }
    return true;
  }
}
