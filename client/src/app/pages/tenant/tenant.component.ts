import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { TenantModel, TenantStatusValues } from '../../shared/model/tenant/tenant.model';
import { search_filter_labels } from '../../shared/constants/shared-enums';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../../services/core/app/app.service';
import { HeaderComponent } from '../../shared/partials/header/login-header/header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TenantIocSelectorComponent } from '../../shared/partials/tenant-ioc-selector/tenant-ioc-selector.component';

@Component({
  selector: 'app-tenant',
  imports: [FormsModule, CommonModule, NgClass, HeaderComponent, TranslatePipe, TenantIocSelectorComponent],
  templateUrl: './tenant.component.html'
})
export class TenantComponent implements OnInit {
  onboardingData: TenantModel = { id: '', name: '', iocs: [], phone: '', country: '', city: '', postal_code: '' };
  currentStep = 1;
  categories: Record<string, string[]> = {};
  readonly iocPermissionWarning = "You don't have permission to manage IOCs outside your domain. Ask your network administrator.";

  constructor(private router: Router, public apiService: ApiService, public appService: AppService) {
  }

  ngOnInit(): void {
    this.initializeIOCs();
  }

  private initializeIOCs(): void {
    const search_filter_keys = Object.keys(search_filter_labels);
    this.onboardingData.iocs = Array.from(search_filter_keys).map(key => ({
      ioc_id: key,
      name: search_filter_labels[key] || key,
      values: []
    }));
  }

  isPrivilegedIoc(): boolean {
    const tenantPrivileged = this.onboardingData.privileged_ioc ?? this.appService.tenantData().privileged_ioc;
    return tenantPrivileged === undefined
      ? this.appService.userSessionData().tenant.privilegedIoc !== true
      : tenantPrivileged !== true;
  }

  goNext() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  hasIocsWithValues(): boolean {
    return this.onboardingData?.iocs?.some(ioc => ioc.values.length > 0) ?? false;
  }

  removeIoc(iocId: string, value: string): void {
    if (this.isPrivilegedIoc()) {
      return;
    }
    const ioc = this.onboardingData.iocs.find(item => item.ioc_id === iocId);
    if (ioc) {
      ioc.values = ioc.values.filter(item => item !== value);
    }
  }

  confirm() {
    const filteredOnboardingData = {
      name: this.onboardingData.name,
      status: TenantStatusValues.ACTIVE
    } as TenantModel;
    if (!this.isPrivilegedIoc()) {
      filteredOnboardingData.iocs = this.onboardingData.iocs.filter(ioc => ioc.values && ioc.values.length > 0);
    }
    this.categories = {};
    this.onboardingData.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);
    this.apiService.post<any>('update/tenants', filteredOnboardingData).subscribe({
      next: (res) => {
        this.appService.userSessionData.update(state => {
          if (!state) {
            return state;
          }
          const updated = {
            ...state,
            tenant: res.tenant ?? state.tenant,
            alerts: res.alerts ?? state.alerts
          };
          this.appService.tenantData.set({
            name: (res.tenant?.name ?? this.appService.tenantData().name) || '',
            iocs: (res.tenant?.iocs ?? this.appService.tenantData().iocs) || [],
            privileged_ioc: res.tenant?.privileged_ioc ?? this.appService.tenantData().privileged_ioc
          });
          this.appService.setOnboardingStatus(false);
          this.router.navigate(['/dashboard']).then();
          return updated;
        });
      },
    });
  }
}
