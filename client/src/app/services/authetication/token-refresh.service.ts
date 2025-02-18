import { Injectable } from '@angular/core';
import { Observable, timer, interval, switchMap, tap, map } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private refreshTokenSubscription: any;
  private readonly FIRST_REFRESH_DELAY = 5000;
  private readonly REFRESH_INTERVAL = 500000;

  constructor(private apiService: ApiService) {}

  startTokenRefresh(refreshAction: () => Observable<string | null>): void {
    if (!this.refreshTokenSubscription || this.refreshTokenSubscription.closed) {
      this.refreshTokenSubscription = timer(this.FIRST_REFRESH_DELAY)
        .pipe(
          switchMap(() => refreshAction()),
          tap({
            next: (newToken) => {
              if (newToken) {
                console.log('Token refreshed:', newToken);
              }
            },
            error: () => {
              this.stopTokenRefresh();
            },
          }),
          switchMap(() => interval(this.REFRESH_INTERVAL).pipe(switchMap(() => refreshAction()))) // Subsequent refresh every 15 min
        )
        .subscribe();
    }
  }

  stopTokenRefresh(): void {
    if (this.refreshTokenSubscription) {
      this.refreshTokenSubscription.unsubscribe();
      this.refreshTokenSubscription = null;
    }
  }

  refreshToken(): Observable<string | null> {
    return this.apiService.post<{ access_token: string }>('token/refresh', {}).pipe(
      map((response) => response.access_token)
    );
  }
}
