import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AppService } from "../../services/core/app/app.service";

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivate {

    constructor(
        private appService: AppService,
        private router: Router
    ) { }

    canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const session = this.appService.userSessionData();

        if (!session) return true;

        if (session.user?.hasOnboarding && state.url !== '/onboarding') {
            this.router.navigate(['/onboarding'], {
                queryParams: { redirect: state.url }
            });
            return false;
        }

        return true;
    }
}
