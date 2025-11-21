
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';

@Component({
  selector: 'app-view-tenant',
  imports: [NgFor, FormsModule, CommonModule],
  animations: [fadeInDashboardItem],
  templateUrl: './view-tenant.component.html'
})
export class ViewTenantComponent implements OnInit {
  users: User[] = [];
  licenseList = Object.values(LicenseName);
  isLoading = true;
  selectedUserId: string | null = null;

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
  getLicenseLabel(license: LicenseName) {
    switch (license) {
      case LicenseName.FREE: return 'Free';
      case LicenseName.OSINT_BASIC: return 'OSINT Basic';
      case LicenseName.OSINT_ADVANCED: return 'OSINT Advanced';
      case LicenseName.PENTESTER: return 'Pentester';
      case LicenseName.DATA_MANAGER: return 'Data Manager';
      case LicenseName.ENTERPRISE: return 'Enterprise';
      default: return license;
    }
  }
  toggleUserLicense(user: any, license: LicenseName) {
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
    return user.licenses.map((l: LicenseName) => this.getLicenseLabel(l)).join(', ');
  }

}
