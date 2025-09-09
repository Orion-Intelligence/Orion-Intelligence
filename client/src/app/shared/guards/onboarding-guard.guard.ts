import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AppService } from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivate {
    constructor(private router: Router, private appService: AppService) { }

    canActivate(): boolean {
        const onboarding = localStorage.getItem('onboarding') === 'true';

        if (onboarding) {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
            return false;
        }

        return true;
    }
}
