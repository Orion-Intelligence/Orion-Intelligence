import { Injectable } from '@angular/core';
import { interval, Observable, switchMap, tap, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private refreshTokenSubscription: any;
  private readonly FIRST_REFRESH_DELAY = 5000;
  private readonly REFRESH_INTERVAL = 120000;

  startTokenRefresh(refreshAction: () => Observable<string | null>): void {
    if (!this.refreshTokenSubscription || this.refreshTokenSubscription.closed) {
      this.refreshTokenSubscription = timer(this.FIRST_REFRESH_DELAY)
        .pipe(
          switchMap(() => refreshAction()),
          tap({
            next: (_) => {
              return
            },
            error: () => {
              this.stopTokenRefresh();
            },
          }),
          switchMap(() => interval(this.REFRESH_INTERVAL).pipe(switchMap(() => refreshAction())))
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
}
