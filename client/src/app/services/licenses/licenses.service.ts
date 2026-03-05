import { Injectable } from '@angular/core';
import { LicenseName } from '../../shared/model/licenses/license.rules';
import { license_rules } from '../../shared/constants/shared-enums';
import { Observable, of } from 'rxjs';
import { SubscriptionService } from '../dashboard/subscription.service';
import { Router } from '@angular/router';
import { DashboardService } from '../dashboard/dashboard.service';
import { AppService } from '../core/app/app.service';
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
  constructor(protected dashboardService: DashboardService, private appService: AppService, private subscriptionService: SubscriptionService, private router: Router) { }

  getLicenses(): string[] {
    return this.appService.userSessionData().user.license ?? [];
  }

  loadLicenses(): Observable<string[]> {
    return of(this.appService.userSessionData().user.license);
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
      if (!rule) {
        continue;
      }
      if (rule.modules === 'all') {
        combined.modules = 'all';
      }
      else if (combined.modules !== 'all') {
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
    if(moduleName=='Profile')
      return;
    if (!this.canAccess(moduleName)) {
      this.dashboardService.showSubscription.set(true);
      this.router.navigate(['/']).then();
    }
  }

  canAccess(moduleName: string): boolean {
    if (moduleName === 'Stealerlogs') {
      moduleName = 'stealer_logs';
    }
    if (moduleName === 'Strategic') {
      moduleName = 'general';
    }
    const rule = this.getCombinedRule();
    const key = moduleName.toLowerCase();
    const access = rule.modules === 'all' || rule.modules.has(key);
    return !(this.subscriptionService.isDemo() && !access);
  }

  canUseModule(moduleName: string): boolean {
    const rule = this.getCombinedRule();
    if (this.subscriptionService.isDemo() || this.appService.userSessionData().user.role == "admin") {
      return true;
    }
    else {
      return (rule.modules === 'all' || rule.modules.has(moduleName));
    }
  }

  canUseCtiGraph(): boolean {
    if (this.subscriptionService.isDemo()) {
      return true;
    }
    else {
      return this.getCombinedRule().cti_graph;
    }
  }

  canUseMapping(): boolean {
    if (this.subscriptionService.isDemo()) {
      return true;
    }
    else {
      return this.getCombinedRule().mapping;
    }
  }

  canUseScanning(): boolean {
    if (this.subscriptionService.isDemo()) {
      return true;
    }
    else {
      return this.getCombinedRule().scanning;
    }
  }

  isMaintainer(): boolean {
    return this.getCombinedRule().maintainer;
  }

  getLicenseLabel(license: LicenseName | string): string {
    switch (license) {
      case LicenseName.MAINTAINER:
        return 'Maintainer';
      case LicenseName.FREE:
        return 'Free';
      case LicenseName.OSINT_BASIC:
        return 'OSINT Basic';
      case LicenseName.OSINT_ADVANCED:
        return 'OSINT Advanced';
      case LicenseName.SOCIAL_MAPPER:
        return 'Social Mapper';
      case LicenseName.PENTESTER:
        return 'Pentester';
      case LicenseName.ENTERPRISE:
        return 'Enterprise';
      default:
        return license;
    }
  }
}
