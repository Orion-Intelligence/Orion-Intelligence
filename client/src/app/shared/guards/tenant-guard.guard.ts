import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';

@Injectable({ providedIn: 'root' })
export class TenantGuard implements CanActivate {
    constructor(private router: Router, private authService: AuthService) { }

    canActivate(): boolean {

        if (!this.authService.getOnboardingStatus()) {
            this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
            return false;
        }
        return true;
    }
}
