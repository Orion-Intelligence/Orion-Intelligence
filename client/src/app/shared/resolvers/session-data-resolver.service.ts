import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { userSessionData } from '../model/company-profile/company.profile.model';
import { AppService } from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class NodeResolver implements Resolve<userSessionData> {
  private cache$?: Observable<userSessionData>;

  constructor(private apiService: ApiService, private appService: AppService) {
  }

  resolve(): Observable<userSessionData> {
    return this.apiService
      .post<userSessionData>('get/tenant/node', {})
      .pipe(
        catchError(err => {
          console.error('Failed to load session data', err);
          return of(null as any);
        }),
        tap(sessionData => {
          if (sessionData) {
            this.appService.userSessionData.set(sessionData);
            console.log(this.appService.userSessionData().user.preferences?.['userId']);
          }
        }),
        shareReplay(1)
      );
  }

}
