import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, shareReplay, tap, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { CompanyProfile } from '../model/company-profile/company.profile.model';
import { AppService } from '../../services/core/app/app.service';
import { AuthService } from '../../services/authetication/auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileResolver implements Resolve<CompanyProfile> {
    private cache$?: Observable<CompanyProfile>;

    constructor(private apiService: ApiService, private appService: AppService, private authService: AuthService) { }

    resolve(): Observable<CompanyProfile> {
        if (!this.cache$) {
            this.cache$ = this.apiService
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
                    switchMap(profile => {
                        if (!profile) return of(profile);
                        const id = this.appService.userProfile().preferences?.['userId'];
                        return this.apiService
                            .get(`s/static/${id}`, { responseType: 'blob' } as any)
                            .pipe(
                                catchError(err => {
                                    console.error('Failed to load image', err);
                                    return of(null);
                                }),
                                tap(image => {
                                    if (image) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            this.appService.profileImageUrl.set(reader.result as string);
                                        };
                                        reader.readAsDataURL(image as Blob);
                                    }
                                }),
                                map(() => profile)
                            );
                    }),
                    shareReplay(1)
                );
        }

        return this.cache$;
    }

}
