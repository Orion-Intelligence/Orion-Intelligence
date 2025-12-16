import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {map, Observable, of} from 'rxjs';
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

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const role = this.authService.getRole();

        if (role === 'demo' && mode === 'free') {
            // return of(this.router.createUrlTree(
            //     ['dashboard/strategic/all'],
            //     { queryParams: Object.fromEntries(urlParams) }
            // ));
        }

        if (role === 'admin' || role === 'demo') {
            return of(true);
        }

        return of(true);
    }
}
