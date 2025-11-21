import { Injectable } from '@angular/core';
import { LicenseName } from '../../shared/model/licenses/license.rules';
import { license_rules } from '../../shared/constants/shared-enums';
import { AuthService } from '../authetication/auth.service';
import { Observable, of } from 'rxjs';

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

    constructor(private auth: AuthService) { }

    private getLicenses(): string[] {
        return this.auth.getLicenses() ?? [];
    }

    loadLicenses(): Observable<string[]> {
        return of(this.getLicenses());
    }

    private getCombinedRule(): CombinedRule {
        const userLicenses = this.getLicenses();
        console.log("license: " + userLicenses)

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

            combined.cti_graph = rule.cti_graph;
            combined.mapping = rule.mapping;
            combined.scanning = rule.scanning;
            combined.maintainer = rule.maintainer;
        }

        return combined;
    }

    canUseModule(moduleName: string): boolean {
        const rule = this.getCombinedRule();
        return rule.modules === 'all' || rule.modules.has(moduleName);
    }

    canUseCtiGraph(): boolean {
        return this.getCombinedRule().cti_graph;
    }

    canUseMapping(): boolean {
        return this.getCombinedRule().mapping;
    }

    canUseScanning(): boolean {
        return this.getCombinedRule().scanning;
    }

    isMaintainer(): boolean {
        console.log(this.getCombinedRule().maintainer);
        return this.getCombinedRule().maintainer;
    }
}
