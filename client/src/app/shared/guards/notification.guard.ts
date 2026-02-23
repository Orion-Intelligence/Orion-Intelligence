import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationGuard implements CanActivate {
  private readonly welcomeAccessKey = 'allow_welcome_once';

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
      return false;
    }

    if (state.url.startsWith('/welcome') && !route.paramMap.get('token')) {
      const allowWelcome = sessionStorage.getItem(this.welcomeAccessKey) === '1';
      if (!allowWelcome) {
        this.router.navigate(['/login'], { replaceUrl: true }).then();
        return false;
      }
      sessionStorage.removeItem(this.welcomeAccessKey);
    }

    return true;
  }
}
