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
  users: User[] = [];
  licenseList = Object.values(LicenseName);
  isLoading = true;
  selectedUserId: string | null = null;
  expandedUserIndex: number | null = null;
  showAddTenantPopup: boolean = false;
  isDeleteConfirmationOpen = signal<boolean>(false);
  userToDelete: User | null = null;

  constructor(public apiService: ApiService, protected appService: AppService, private nodeResolver: NodeResolver, protected licenseService: LicenseService) {
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
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

    isLicenseDisabled(user: any, license: LicenseName): boolean {
      return false;
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
      const names = user.licenses.map((l: LicenseName) => this.licenseService.getLicenseLabel(l)).join(', ');
      return (names.length <= 15) ? names : names.slice(0, 15) + ('...');
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
    protected readonly JSON = JSON;
}
