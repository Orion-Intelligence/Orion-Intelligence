import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LicenseService } from '../../services/licenses/licenses.service';

@Injectable({
    providedIn: 'root'
})
export class LicenseGuard implements CanActivate {
    constructor(private router: Router, private licenseService: LicenseService) { }

    canActivate(): boolean {
        if (this.licenseService.isDataManager())
            return true;
        else {
            this.router.navigate(['dashboard/strategic']);
            return false;
        }
    }
}
