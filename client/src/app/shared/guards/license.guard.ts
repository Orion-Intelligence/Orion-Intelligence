import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LicenseService } from '../../services/licenses/licenses.service';
import { map, Observable } from 'rxjs';
import {AuthService} from '../../services/authetication/auth.service';

@Injectable({
    providedIn: 'root'
})
export class LicenseGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router, private licenseService: LicenseService) { }

    canActivate(): Observable<boolean> {
        return this.licenseService.loadLicenses().pipe(
            map(() => {
                const role = this.authService.getRole();
                if (this.licenseService.isMaintainer() || role=="admin") return true;
                this.router.navigate(['dashboard/strategic']).then();
                return false;
            })
        );
    }
}
