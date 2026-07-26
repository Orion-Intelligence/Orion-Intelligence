import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../../shared/services/api.service';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { IocCategory, TenantStatus, TenantStatusValues } from '../../../../shared/model/tenant/tenant.model';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../../../shared/components/ui-dropdown/ui-dropdown.component';
import { search_filter_labels } from '../../../../shared/constants/shared-enums';
import { TenantIocSelectorComponent } from '../../../../shared/components/tenant-ioc-selector/tenant-ioc-selector.component';
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';

@Component({
  selector: 'app-view-tenant',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe, UiDropdownComponent, TenantIocSelectorComponent, ConfirmationPopupComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './view-tenant.component.html',
})
export class ViewTenantComponent implements OnInit {
  protected readonly JSON = JSON;

  tenants: any[] = [];
  tenantSearch = '';
  licenseList = Object.values(LicenseName).filter((license) => license !== LicenseName.FEEDER);
  isLoading = true;
  selectedTenantId: string | null = null;
  TenantStatus = TenantStatusValues;
  isIocSelectorOpen = false;
  activeIocTenant: any | null = null;
  iocDraft: IocCategory[] = [];
  tenantToDelete: any | null = null;

  constructor(public apiService: ApiService, protected licenseService: LicenseService) {
  }

  get tenantLicenseOptions(): UiDropdownOption[] {
    return this.licenseList
      .filter(license => this.licenseService.getLicenseLabel(license) !== 'maintainer')
      .map(license => ({ key: license, label: this.licenseService.getLicenseLabel(license) }));
  }

  get filteredTenants(): any[] {
    const search = this.tenantSearch.trim().toLowerCase();
    if (!search) {
      return this.tenants;
    }
    return this.tenants.filter((tenant) => [
      tenant.companyName,
      tenant.company,
      tenant.name,
      tenant.email,
      tenant.phone,
      tenant.country,
      tenant.city,
      tenant.status,
      tenant.subscription ? 'paid' : 'free',
      tenant.verified ? 'verified' : 'not verified',
      this.getTenantLicensesLabel(tenant)
    ].some(value => String(value || '').toLowerCase().includes(search)));
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<any[]>('tenants/get', headers).subscribe({
      next: (data) => {
        this.tenants = (data || []).map((tenant: any) => ({
          ...tenant,
          verified: tenant.verified ?? false,
          privileged_ioc: tenant.privileged_ioc ?? false,
          _saved_privileged_ioc: tenant.privileged_ioc ?? false,
          user_quota: tenant.user_quota ?? 0,
          status: tenant.status === TenantStatusValues.ONBOARDING ||
                        tenant.status === TenantStatusValues.ACTIVE ||
                        tenant.status === TenantStatusValues.DISABLE
            ? tenant.status
            : TenantStatusValues.ACTIVE,
          licenses: tenant.licenses?.length
            ? tenant.licenses.filter((license: LicenseName) => license !== LicenseName.FEEDER)
            : [LicenseName.FREE],
        }));
        this.isLoading = false;
      },
      error: (_) => {
        this.isLoading = false;
      },
    });
  }

  getStatusLabel(status: TenantStatus): string {
    switch (status) {
      case TenantStatusValues.ONBOARDING:
        return 'Disable';
      case TenantStatusValues.ACTIVE:
        return 'Active';
      case TenantStatusValues.DISABLE:
        return 'Disable';
      default:
        return '';
    }
  }

  isAdmin(): boolean {
    return this.licenseService.isAdmin();
  }

  openTenant(tenant: any): void {
    const url = new URL(window.location.origin);
    url.hostname = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? `${tenant.slug}.localhost`
      : `${tenant.slug}.${url.hostname}`;
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  updateTenant(tenant: any): void {
    if (!tenant.licenses || tenant.licenses.length === 0) {
      tenant.licenses = [LicenseName.FREE];
    }
    this.isLoading = true;
    this.apiService.post<any>('update/tenants', tenant).subscribe({
      next: (res) => {
        if (res?.tenant) {
          tenant.iocs = res.tenant.iocs ?? tenant.iocs;
          tenant.privileged_ioc = res.tenant.privileged_ioc ?? tenant.privileged_ioc;
          tenant._saved_privileged_ioc = tenant.privileged_ioc ?? false;
        }
        this.isLoading = false;
      },
      error: (_) => {
        this.isLoading = false;
      },
    });
  }

  openDeleteConfirmation(tenant: any, event?: Event): void {
    event?.stopPropagation();
    this.tenantToDelete = tenant;
  }

  confirmDeleteTenant(confirmed: boolean): void {
    const tenant = this.tenantToDelete;
    this.tenantToDelete = null;
    if (!confirmed || !tenant) {
      return;
    }
    this.isLoading = true;
    this.apiService.delete(`tenants/${tenant.id}`).subscribe({
      next: () => {
        this.tenants = this.tenants.filter(item => item.id !== tenant.id);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const eventTargetElement = event.target as HTMLElement;
    if (!eventTargetElement.closest('.action-menu')) {
      this.selectedTenantId = null;
    }
  }

  toggleTenantLicense(tenant: any, license: LicenseName): void {
    if (!tenant.licenses) {
      tenant.licenses = [];
    }
    const index = tenant.licenses.indexOf(license);
    if (index > -1) {
      tenant.licenses.splice(index, 1);
    }
    else {
      tenant.licenses.push(license);
    }
  }

  onTenantLicenseDropdownChange(tenant: any, licenses: string[]): void {
    tenant.licenses = licenses;
  }

  canManageTenantIocs(tenant: any): boolean {
    return this.isAdmin() && tenant?.privileged_ioc !== true && tenant?._saved_privileged_ioc !== true;
  }

  getTenantIocCount(tenant: any): number {
    return (tenant?.iocs || []).reduce((total: number, ioc: IocCategory) => total + (ioc.values?.length || 0), 0);
  }

  openIocSelector(tenant: any, event?: Event): void {
    event?.stopPropagation();
    if (!this.canManageTenantIocs(tenant)) {
      return;
    }
    this.activeIocTenant = tenant;
    this.iocDraft = this.buildIocDraft(tenant.iocs || []);
    this.isIocSelectorOpen = true;
  }

  closeIocSelector(): void {
    this.isIocSelectorOpen = false;
    this.activeIocTenant = null;
    this.iocDraft = [];
  }

  buildIocDraft(existingIocs: IocCategory[]): IocCategory[] {
    const existingById = new Map<string, IocCategory>();
    for (const ioc of existingIocs || []) {
      existingById.set(ioc.ioc_id, ioc);
    }
    const keys = [...Object.keys(search_filter_labels)];
    for (const ioc of existingIocs || []) {
      if (ioc.ioc_id && !keys.includes(ioc.ioc_id)) {
        keys.push(ioc.ioc_id);
      }
    }
    return keys.map(key => {
      const existing = existingById.get(key);
      return {
        ioc_id: key,
        name: search_filter_labels[key] || existing?.name || key,
        values: [...new Set((existing?.values || []).map(value => String(value).trim()).filter(Boolean))]
      };
    });
  }

  saveIocSelector(): void {
    if (!this.activeIocTenant) {
      return;
    }
    const selectedIocs = this.iocDraft.filter(ioc => ioc.values?.length > 0);
    const payload = {
      ...this.activeIocTenant,
      iocs: selectedIocs
    };
    this.isLoading = true;
    this.apiService.post<any>('update/tenants', payload).subscribe({
      next: (res) => {
        this.activeIocTenant.iocs = res?.tenant?.iocs ?? selectedIocs;
        this.activeIocTenant.privileged_ioc = res?.tenant?.privileged_ioc ?? this.activeIocTenant.privileged_ioc;
        this.activeIocTenant._saved_privileged_ioc = this.activeIocTenant.privileged_ioc ?? false;
        this.isLoading = false;
        this.closeIocSelector();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getTenantLicensesLabel(tenant: any): string {
    if (!tenant.licenses || tenant.licenses.length === 0) {
      return 'None';
    }
    return tenant.licenses
      .map((l: LicenseName) => this.licenseService.getLicenseLabel(l))
      .join(', ');
  }

  getTenantStatusBadgeClass(status: TenantStatus): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (status === TenantStatusValues.ACTIVE) {
      return isLightTheme
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-emerald-500/10 text-emerald-300';
    }
    return isLightTheme
      ? 'bg-rose-100 text-rose-800'
      : 'bg-rose-500/10 text-rose-300';
  }

  getSubscriptionBadgeClass(subscription?: boolean): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (subscription) {
      return isLightTheme
        ? 'bg-sky-100 text-sky-800'
        : 'bg-sky-500/10 text-sky-300';
    }
    return isLightTheme
      ? 'bg-slate-100 text-slate-700'
      : 'bg-slate-500/10 text-slate-300';
  }

  getVerifiedBadgeClass(verified?: boolean): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (verified) {
      return isLightTheme
        ? 'bg-sky-100 text-sky-800'
        : 'bg-sky-500/10 text-sky-300';
    }
    return isLightTheme
      ? 'bg-rose-100 text-rose-800'
      : 'bg-rose-500/10 text-rose-300';
  }
}
