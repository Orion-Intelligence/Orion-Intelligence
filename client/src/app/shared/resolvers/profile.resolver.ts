import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, shareReplay, tap} from 'rxjs/operators';
import {ApiService} from '../services/api.service';
import {CompanyProfile} from '../model/company-profile/company.profile.model';
import {AppService} from '../../services/core/app/app.service';

@Injectable({providedIn: 'root'})
export class ProfileResolver implements Resolve<CompanyProfile> {
  private cache$?: Observable<CompanyProfile>;

  constructor(private apiService: ApiService, private appService: AppService) {
  }

  resolve(): Observable<CompanyProfile> {
    return this.apiService
      .post<CompanyProfile>('get/company/profile', {})
      .pipe(
        catchError(err => {
          console.error('Failed to load profile', err);
          return of(null as any);
        }),
        tap(profile => {
          if (profile) {
            this.appService.userProfile.set(profile);
            console.log(this.appService.userProfile().preferences?.['userId']);
          }
        }),
        shareReplay(1)
      );
  }

}
