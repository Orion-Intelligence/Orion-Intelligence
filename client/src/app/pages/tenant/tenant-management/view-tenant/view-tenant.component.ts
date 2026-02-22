import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { TenantStatus, TenantStatusValues } from '../../../../shared/model/tenant/tenant.model';
import { LicenseService } from '../../../../services/licenses/licenses.service';
@Component({
  selector: 'app-view-tenant',
  standalone: true,
  imports: [NgFor, FormsModule, CommonModule],
  animations: [fadeInDashboardItem],
  templateUrl: './view-tenant.component.html',
})
export class ViewTenantComponent implements OnInit {
  protected readonly JSON = JSON;

  tenants: any[] = [];
  licenseList = Object.values(LicenseName);
  isLoading = true;
  selectedTenantId: string | null = null;
  TenantStatus = TenantStatusValues;

  constructor(public apiService: ApiService, protected licenseService: LicenseService) {
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<any[]>('tenants/get', headers).subscribe({
      next: (data) => {
        this.tenants = (data || []).map((tenant: any) => ({
          ...tenant,
          verified: tenant.verified ?? false,
          user_quota: tenant.user_quota ?? 0,
          status: tenant.status === TenantStatusValues.ONBOARDING ||
                        tenant.status === TenantStatusValues.ACTIVE ||
                        tenant.status === TenantStatusValues.DISABLE
            ? tenant.status
            : TenantStatusValues.ACTIVE,
          licenses: tenant.licenses && tenant.licenses.length
            ? tenant.licenses
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

  updateTenant(tenant: any): void {
    if (!tenant.licenses || tenant.licenses.length === 0) {
      tenant.licenses = [LicenseName.FREE];
    }
    this.isLoading = true;
    this.apiService.post('update/tenants', tenant).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (_) => {
        this.isLoading = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu')) {
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

  getTenantLicensesLabel(tenant: any): string {
    if (!tenant.licenses || tenant.licenses.length === 0) {
      return 'None';
    }
    return tenant.licenses
      .map((l: LicenseName) => this.licenseService.getLicenseLabel(l))
      .join(', ');
  }

  getTenantStatusBadgeClass(status: TenantStatus): string {
    return status === TenantStatusValues.ACTIVE
      ? 'bg-emerald-500/10 text-emerald-300'
      : 'bg-rose-500/10 text-rose-300';
  }

  getSubscriptionBadgeClass(subscription?: boolean): string {
    return subscription
      ? 'bg-sky-500/10 text-sky-300'
      : 'bg-slate-500/10 text-slate-300';
  }

  getVerifiedBadgeClass(verified?: boolean): string {
    return verified
      ? 'bg-sky-500/10 text-sky-300'
      : 'bg-rose-500/10 text-rose-300';
  }
}
