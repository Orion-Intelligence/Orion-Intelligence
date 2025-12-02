import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { AddTenantComponent } from "../add-tenant/add-tenant.component";

@Component({
  selector: 'app-view-profile',
  imports: [NgFor, FormsModule, CommonModule, AddTenantComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './view-profile.component.html'
})
export class ViewProfileComponent implements OnInit {
  users: User[] = [];
  licenseList = Object.values(LicenseName);
  isLoading = true;
  selectedUserId: string | null = null;
  expandedUserIndex: number | null = null;
  showAddTenantPopup: boolean = false;

  constructor(public apiService: ApiService,) {
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
      },
    });
  }

  toggleExpandedUser(index: number): void {
    this.expandedUserIndex = this.expandedUserIndex === index ? null : index;
  }

  getRoleLabel(role: User['role']): string {
    switch (role) {
      case 'admin': return 'Admin';
      case 'crawler': return 'Crawler';
      case 'demo': return 'Demo';
      case 'profile': return 'Profile';
      default: return '';
    }
  }

  updateUser(user: User) {
    if (!user.licenses || user.licenses.length === 0) {
      user.licenses = [LicenseName.FREE];
    }
    this.isLoading = true;
    this.apiService.post('update/user', user).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu')) {
      this.selectedUserId = null;
    }
  }

  getLicenseLabel(license: LicenseName | string) {
    switch (license as LicenseName) {
      case LicenseName.FREE: return 'Free';
      case LicenseName.OSINT_BASIC: return 'OSINT Basic';
      case LicenseName.OSINT_ADVANCED: return 'OSINT Advanced';
      case LicenseName.PENTESTER: return 'Pentester';
      case LicenseName.MAINTAINER: return 'Maintainer';
      case LicenseName.ENTERPRISE: return 'Enterprise';
      default: return license;
    }
  }

  isLicenseDisabled(user: any, license: LicenseName): boolean {
    const licenses: LicenseName[] = user.licenses || [];
    const hasFree = licenses.includes(LicenseName.FREE);
    const hasEnterprise = licenses.includes(LicenseName.ENTERPRISE);
    const hasBasic = licenses.includes(LicenseName.OSINT_BASIC);
    const hasAdvanced = licenses.includes(LicenseName.OSINT_ADVANCED);

    if (license === LicenseName.FREE) {
      return licenses.length > 0 && !hasFree;
    }

    if (hasFree && license !== LicenseName.FREE.valueOf()) {
      return true;
    }

    if (license === LicenseName.ENTERPRISE) {
      return licenses.length > 1 || (licenses.length === 1 && !hasEnterprise);
    }

    if (hasEnterprise && license !== LicenseName.ENTERPRISE.valueOf()) {
      return true;
    }

    if (license === LicenseName.OSINT_BASIC && hasAdvanced && !hasBasic) {
      return true;
    }

    if (license === LicenseName.OSINT_ADVANCED && hasBasic && !hasAdvanced) {
      return true;
    }

    return false;
  }

  toggleUserLicense(user: any, license: LicenseName) {
    if (this.isLicenseDisabled(user, license)) {
      return;
    }
    if (!user.licenses) user.licenses = [];
    const index = user.licenses.indexOf(license);
    if (index > -1) {
      user.licenses.splice(index, 1);
    } else {
      user.licenses.push(license);
    }
  }

  getUserLicensesLabel(user: any): string {
    if (!user.licenses || user.licenses.length === 0) return 'None';
    const names = user.licenses.map((l: LicenseName) => this.getLicenseLabel(l)).join(', ');
    return (names.length <= 15) ? names : names.slice(0, 15) + ('...');
  }
  addtenant() {
    this.showAddTenantPopup = true;
  }
  clossAddTenant() {
    this.showAddTenantPopup = false;
  }
}
