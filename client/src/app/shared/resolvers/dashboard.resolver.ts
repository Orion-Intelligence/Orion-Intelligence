import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { InsightCacheService } from '../services/insight-cache.service';
import { map, Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<boolean> {
  constructor(private authService: AuthService, private insightCacheService: InsightCacheService) { }

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const { isAuthenticated, hasSession } = this.authService.getSessionStatus();
    if (_state.url.startsWith('/dashboard/home') || _state.url.startsWith('/dashboard/profile/homepage')) {
      this.insightCacheService.warmInsight();
    }
    if (isAuthenticated) {
      return of(true);
    }
    if (isAuthenticated && !hasSession) {
      return this.authService.refreshToken().pipe(map(() => true));
    }
    return of(true);
  }
}
