import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/'], { replaceUrl: true }).then();
      return false;
    }
    return true;
  }
}
