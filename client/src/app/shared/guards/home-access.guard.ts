import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../services/authetication/auth.service';
import { LicenseService } from '../../services/licenses/licenses.service';

@Injectable({
    providedIn: 'root'
})
export class HomeAccessGuard implements CanActivate {

    constructor(
        private router: Router,
        private authService: AuthService,
        private licenseService: LicenseService
    ) { }

    canActivate(): Observable<boolean | UrlTree> {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');

        return this.authService.getRole$().pipe(
            filter((role): role is string => role !== null),
            take(1),
            switchMap((role) => {
                if (role === 'demo' && mode === 'free') {
                    return of(this.router.createUrlTree(
                        ['dashboard/strategic/all'],
                        { queryParams: Object.fromEntries(urlParams) }
                    ));
                }
                if (role === 'admin' || role === 'demo') {
                    return of(true);
                }
                if (role === 'profile') {
                    return this.licenseService.loadLicenses().pipe(
                        map(() => {
                            const isMaintainer = this.licenseService.isMaintainer();
                            if (isMaintainer) {
                                return this.router.createUrlTree(['dashboard/profile/dashboard']);
                            }
                            return true;
                        })
                    );
                }
                return of(true);
            })
        );
    }
}
