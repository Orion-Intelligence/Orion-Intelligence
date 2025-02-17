import { Injectable } from '@angular/core';
import {Observable, interval, switchMap, tap, map} from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private refreshTokenSubscription: any;

  constructor(private apiService: ApiService) {}

  startTokenRefresh(refreshAction: () => Observable<string | null>): void {
    if (!this.refreshTokenSubscription || this.refreshTokenSubscription.closed) {
      this.refreshTokenSubscription = interval(900000)
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
          })
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
