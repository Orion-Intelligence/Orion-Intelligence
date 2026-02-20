import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { map, Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<boolean> {
  constructor(private authService: AuthService) { }

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const { isAuthenticated, hasSession } = this.authService.getSessionStatus();
    if (isAuthenticated) {
      return of(true);
    }
    if (isAuthenticated && !hasSession) {
      return this.authService.refreshToken().pipe(map(() => true));
    }
    return of(true);
  }
}
