import { Injectable } from '@angular/core';
import { LicenseName } from '../../shared/model/licenses/license.rules';
import { license_rules } from '../../shared/constants/shared-enums';
import { AuthService } from '../authetication/auth.service';
import { map, Observable, of } from 'rxjs';
import { SubscriptionService } from '../dashboard/subscription.service';
import { Router } from '@angular/router';
import { DashboardService } from '../dashboard/dashboard.service';

type CombinedRule = {
    modules: Set<string> | 'all';
    cti_graph: boolean;
    mapping: boolean;
    scanning: boolean;
    maintainer: boolean;
};

@Injectable({
    providedIn: 'root'
})
export class LicenseService {


    constructor(protected dashboardService: DashboardService, private auth: AuthService, private subscriptionService: SubscriptionService, private router: Router) { }

    getLicenses(): string[] {
        return this.auth.getLicenses() ?? [];
    }

    loadLicenses(): Observable<string[]> {
        if (this.auth.getLicenses().length > 0) {
            return of(this.auth.getLicenses());
        }
        return this.auth.refreshToken().pipe(
            map(() => this.auth.getLicenses())
        );
    }

    private getCombinedRule(): CombinedRule {
        const userLicenses = this.getLicenses();

        const combined: CombinedRule = {
            modules: new Set<string>(),
            cti_graph: false,
            mapping: false,
            scanning: false,
            maintainer: false
        };

        for (const lic of userLicenses) {
            const rule = license_rules[lic as LicenseName];
            if (!rule) continue;

            if (rule.modules === 'all') {
                combined.modules = 'all';
            } else if (combined.modules !== 'all') {
                for (const m of rule.modules) {
                    combined.modules.add(m);
                }
            }

            combined.cti_graph ||= rule.cti_graph;
            combined.mapping ||= rule.mapping;
            combined.scanning ||= rule.scanning;
            combined.maintainer ||= rule.maintainer;
        }

        return combined;
    }

    demoSubscription(moduleName: string) {
      if (!this.canAccess(moduleName)) {
        this.dashboardService.showSubscription.set(true);
        this.router.navigate(['/']).then();
      }
    }

    canAccess(moduleName: string): boolean {
      if (moduleName === 'Stealerlogs') moduleName = 'stealer_logs';
      if (moduleName === 'Strategic') moduleName = 'general';

      const rule = this.getCombinedRule();
      const key = moduleName.toLowerCase();
      const access = rule.modules === 'all' || rule.modules.has(key);

      return !(this.subscriptionService.isDemo() && !access);
    }

    canUseModule(moduleName: string): boolean {
        const rule = this.getCombinedRule();
        if (this.subscriptionService.isDemo() || this.auth.getRole() == "admin") {
            return true
        } else
            return (rule.modules === 'all' || rule.modules.has(moduleName))
    }

    canUseCtiGraph(): boolean {
        if (this.subscriptionService.isDemo()) {
            return true
        } else
          return this.getCombinedRule().cti_graph;
    }

    canUseMapping(): boolean {
        if (this.subscriptionService.isDemo()) {
            return true
        } else
          return this.getCombinedRule().mapping;
    }

    canUseScanning(): boolean {
        if (this.subscriptionService.isDemo()) {
            return true
        } else
          return this.getCombinedRule().scanning;
    }

    isMaintainer(): boolean {
        return this.getCombinedRule().maintainer;
    }
}
