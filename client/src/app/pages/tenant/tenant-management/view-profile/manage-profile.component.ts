import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { AddTenantComponent } from "../add-tenant/add-tenant.component";
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { AppService } from '../../../../services/core/app/app.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { finalize, switchMap, tap } from 'rxjs';
import { NodeResolver } from '../../../../shared/resolvers/session-data-resolver.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
@Component({
  selector: 'app-view-profile',
  imports: [NgFor, FormsModule, CommonModule, AddTenantComponent, ConfirmationPopupComponent, TooltipDirective],
  animations: [fadeInDashboardItem],
  templateUrl: './manage-profile.component.html'
})
export class ManageProfileComponent implements OnInit {
  protected readonly JSON = JSON;

  users: User[] = [];
  licenseList = Object.values(LicenseName);
  isLoading = true;
  selectedUserId: string | null = null;
  expandedUserIndex: number | null = null;
  showAddTenantPopup: boolean = false;
  userToDelete: User | null = null;
  isDeleteConfirmationOpen = signal<boolean>(false);

  constructor(public apiService: ApiService, protected appService: AppService, private nodeResolver: NodeResolver, protected licenseService: LicenseService) {
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (_) => {
        this.isLoading = false;
      },
    });
  }

  toggleExpandedUser(index: number): void {
    this.expandedUserIndex = this.expandedUserIndex === index ? null : index;
  }

  updateUser(user: User) {
    if (!user.licenses || user.licenses.length === 0) {
      user.licenses = [LicenseName.FREE];
    }
    this.isLoading = true;
    this.apiService.post('update/user', user).pipe(switchMap(() => this.nodeResolver.resolve()), finalize(() => (this.isLoading = false))).subscribe({
      next: (_) => {
      },
      error: () => {
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu')) {
      this.selectedUserId = null;
    }
  }

  isLicenseDisabled(): boolean {
    return false;
  }

  canAssignLicense(license: LicenseName): boolean {
    if (license === LicenseName.MAINTAINER) {
      return false;
    }
    if (this.appService.userSessionData().user.role === 'admin') {
      return true;
    }
    return (this.appService.userSessionData().tenant.licenses || []).includes(license);
  }

  toggleUserLicense(user: any, license: LicenseName) {
    if (!user.licenses) {
      user.licenses = [];
    }
    if (user.licenses.includes(license)) {
      user.licenses = user.licenses.filter((l: LicenseName) => l !== license);
      return;
    }
    if (license === LicenseName.FREE || license === LicenseName.ENTERPRISE) {
      user.licenses = [license];
      return;
    }
    user.licenses = user.licenses.filter((l: LicenseName) => l !== LicenseName.FREE && l !== LicenseName.ENTERPRISE);
    if (license === LicenseName.OSINT_BASIC) {
      user.licenses = user.licenses.filter((l: LicenseName) => l !== LicenseName.OSINT_ADVANCED);
    }
    if (license === LicenseName.OSINT_ADVANCED) {
      user.licenses = user.licenses.filter((l: LicenseName) => l !== LicenseName.OSINT_BASIC);
    }
    user.licenses.push(license);
  }

  deleteUser(user: User) {
    this.userToDelete = user;
    this.isDeleteConfirmationOpen.set(true);
  }

  confirmDeleteUser(value: boolean) {
    this.isDeleteConfirmationOpen.set(false);
    if (!value || !this.userToDelete) {
      this.userToDelete = null;
      return;
    }
    this.isLoading = true;
    this.apiService.post('delete/user', this.userToDelete).pipe(switchMap(() => this.apiService.post<User[]>('users', new HttpHeaders({}))), tap(data => this.users = data), switchMap(() => this.nodeResolver.resolve()), finalize(() => {
      this.isLoading = false;
      this.userToDelete = null;
    })).subscribe();
  }

  getUserLicensesLabel(user: any): string {
    if (!user.licenses || user.licenses.length === 0) {
      return 'None';
    }
    return user.licenses.map((l: LicenseName) => this.licenseService.getLicenseLabel(l)).join(', ');
  }

  canEditUser(user: User): boolean {
    return !(user.role === 'admin' || user.licenses?.includes('maintainer'));
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active'
      ? 'bg-emerald-500/10 text-emerald-300'
      : 'bg-rose-500/10 text-rose-300';
  }

  getSubscriptionBadgeClass(subscription?: boolean): string {
    return subscription
      ? 'bg-sky-500/10 text-sky-300'
      : 'bg-slate-500/10 text-slate-300';
  }

  get activeUsersCount(): number {
    return this.users.filter(user => user.status === 'active').length;
  }

  get editableUsersCount(): number {
    return this.users.filter(user => this.canEditUser(user)).length;
  }

  addtenant() {
    this.showAddTenantPopup = true;
  }

  clossAddTenant() {
    this.showAddTenantPopup = false;
  }

  setStatus(user: User, status: 'active' | 'disable') {
    user.status = status;
  }
}
