import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, shareReplay, tap} from 'rxjs/operators';
import {ApiService} from '../services/api.service';
import {userSessionData} from '../model/company-profile/company.profile.model';
import {AppService} from '../../services/core/app/app.service';

@Injectable({providedIn: 'root'})
export class SessionDataResolver implements Resolve<userSessionData> {
  private cache$?: Observable<userSessionData>;

  constructor(private apiService: ApiService, private appService: AppService) {
  }

  resolve(): Observable<userSessionData> {
    return this.apiService
      .post<userSessionData>('get/tenant/node', {})
      .pipe(
        catchError(err => {
          console.error('Failed to load profile', err);
          return of(null as any);
        }),
        tap(profile => {
          if (profile) {
            this.appService.userSessionData.set(profile);
            console.log(this.appService.userSessionData().preferences?.['userId']);
          }
        }),
        shareReplay(1)
      );
  }

}
