import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../../services/authetication/auth.service';
import {Observable, of, switchMap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<boolean> {
  constructor(private authService: AuthService) {}

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const {isAuthenticated, hasSession} = this.authService.getSessionStatus();

    if (isAuthenticated && !hasSession) {
      return this.authService.refreshToken().pipe(
        switchMap(() => of(true))
      );
    }

    return of(true);
  }
}
