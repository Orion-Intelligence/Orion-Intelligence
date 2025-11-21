import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LicenseService } from '../../services/licenses/licenses.service';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LicenseGuard implements CanActivate {
    constructor(private router: Router, private licenseService: LicenseService) { }

    canActivate(): Observable<boolean> {
        return this.licenseService.loadLicenses().pipe(
            map(() => {
                if (this.licenseService.isMaintainer()) return true;
                this.router.navigate(['dashboard/strategic']);
                return false;
            })
        );
    }
}
