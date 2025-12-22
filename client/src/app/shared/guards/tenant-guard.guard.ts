import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { AppService } from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class TenantGuard implements CanActivate {
    constructor(private router: Router, private appService: AppService) { }

    canActivate(): boolean {

        if (!this.appService.userSessionData().tenant.hasOnboarding) {
            this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
            return false;
        }
        return true;
    }
}
