import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, shareReplay, tap, map } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { CompanyProfile } from '../model/company-profile/company.profile.model';
import { AppService } from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class ProfileResolver implements Resolve<CompanyProfile> {
    private cache$?: Observable<CompanyProfile>;

    constructor(private apiService: ApiService, private appService: AppService) { }

    resolve(): Observable<CompanyProfile> {
        if (!this.cache$) {
            this.cache$ = forkJoin({
                profile: this.apiService.post<CompanyProfile>('get/company/profile', {})
                    .pipe(
                        catchError(err => {
                            console.error('Failed to load profile', err);
                            return of(null as any);
                        })
                    ),
                image: this.apiService.post('get/image', {}, { responseType: 'blob' } as any)
                    .pipe(
                        catchError(err => {
                            console.error('Failed to load image', err);
                            return of(null);
                        })
                    )
            }).pipe(
                tap(({ profile, image }) => {
                    if (profile) {
                        this.appService.userProfile.set(profile);
                    }
                    if (image) {
                        const objectUrl = URL.createObjectURL(image as Blob);
                        this.appService.profileImageUrl.set(objectUrl);
                    }
                }),
                map(({ profile }) => profile),
                shareReplay(1)
            );
        }
        return this.cache$;
    }


}
