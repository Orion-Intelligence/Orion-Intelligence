import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { AlertAllowedTenantOption, User } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { AddTenantComponent } from "../add-tenant/add-tenant.component";
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { AppService } from '../../../../services/core/app/app.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { finalize, switchMap, tap } from 'rxjs';
import { NodeResolver } from '../../../../shared/resolvers/session-data-resolver.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../../../shared/components/ui-dropdown/ui-dropdown.component';

@Component({
  selector: 'app-view-profile',
  imports: [FormsModule, CommonModule, AddTenantComponent, ConfirmationPopupComponent, TooltipDirective, TranslatePipe, UiDropdownComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './manage-profile.component.html',
})
export class ManageProfileComponent implements OnInit {
  private readonly allAlertsOption = 'all';

  protected readonly JSON = JSON;

  users: User[] = [];
  userSearch = '';
  licenseList = Object.values(LicenseName);
  permissionOptions: UiDropdownOption[] = [{ key: 'case_management', label: 'Case Management' }];
  alertTenantOptions: AlertAllowedTenantOption[] = [];
  statusOptions: UiDropdownOption[] = [{ key: 'active', label: 'Active' }, { key: 'disable', label: 'Disable' }];
  passwordResetOptions: UiDropdownOption[] = [{ key: 'false', label: 'No password reset' }, { key: 'true', label: 'Require password reset' }];
  isLoading = true;
  selectedUserId: string | null = null;
  expandedUserIndex: number | null = null;
  showAddTenantPopup: boolean = false;
  userToDelete: User | null = null;
  isDeleteConfirmationOpen = signal<boolean>(false);
  userToFlush: User | null = null;
  isFlushUserConfirmationOpen = signal<boolean>(false);
  userQuotaErrors: Record<string, string> = {};

  constructor(public apiService: ApiService, protected appService: AppService, private nodeResolver: NodeResolver, protected licenseService: LicenseService) {
  }

  bytesToGb(value?: number | null): number {
    return Number(((Number(value || 0)) / 1_000_000_000).toFixed(2));
  }

  gbToBytes(value?: number | null): number | null {
    const gb = Number(value || 0);

    if (!Number.isFinite(gb) || gb <= 0) {
      return null;
    }

    return Math.round(gb * 1_000_000_000);
  }

  formatGb(value?: number | null): string {
    const bytes = Number(value || 0);

    if (!bytes) {
      return 'Shared';
    }

    return `${this.bytesToGb(bytes)} GB`;
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    if (this.appService.userSessionData().user.role === 'admin') {
      this.loadAlertTenantOptions();
    }
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = (data || []).map((user: User) => ({
          ...user,
          workspace_quota_gb: this.bytesToGb(user.workspace_quota_bytes),
        }));
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

  private getUserErrorKey(user: User): string {
    return String(user.id || user.email || user.username || 'user');
  }

  getUserQuotaError(user: User): string {
    return this.userQuotaErrors[this.getUserErrorKey(user)] || '';
  }

  private setUserQuotaError(user: User, message: string): void {
    this.userQuotaErrors = {
      ...this.userQuotaErrors,
      [this.getUserErrorKey(user)]: message,
    };
  }

  clearUserQuotaError(user: User): void {
    const key = this.getUserErrorKey(user);
    const { [key]: _, ...rest } = this.userQuotaErrors;
    this.userQuotaErrors = rest;
  }

  private getTenantWorkspaceQuotaBytes(): number {
    const tenant: any = this.appService.userSessionData()?.tenant || {};
    return Number(tenant.workspace_quota_bytes || 0);
  }

  private getTenantAssignedUserQuotaBytes(): number {
    const tenant: any = this.appService.userSessionData()?.tenant || {};
    return Number(tenant.workspace_assigned_user_quota_bytes || 0);
  }

  private validateUserWorkspaceQuota(user: User): boolean {
    this.clearUserQuotaError(user);

    const requestedGb = Number(user.workspace_quota_gb || 0);

    if (!Number.isFinite(requestedGb) || requestedGb < 0) {
      this.setUserQuotaError(user, 'Workspace quota must be a valid positive number.');
      return false;
    }

    const requestedBytes = this.gbToBytes(requestedGb) ?? 0;

    if (requestedBytes === 0) {
      return true;
    }

    const tenantQuotaBytes = this.getTenantWorkspaceQuotaBytes();

    if (!tenantQuotaBytes) {
      return true;
    }

    const assignedBytes = this.getTenantAssignedUserQuotaBytes();
    const currentUserBytes = Number(user.workspace_quota_bytes || 0);

    const availableBytes = Math.max(tenantQuotaBytes - Math.max(assignedBytes - currentUserBytes, 0),
      0);

    if (requestedBytes > availableBytes) {
      this.setUserQuotaError(user,
        `User workspace quota cannot exceed available tenant quota. Available: ${this.bytesToGb(availableBytes)} GB.`);
      return false;
    }

    return true;
  }

  private getApiErrorMessage(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (Array.isArray(detail)) {
      return detail[0]?.msg || fallback;
    }

    if (typeof detail === 'string') {
      return detail;
    }

    return error?.error?.message || error?.message || fallback;
  }

  updateUser(user: User) {
    if (!this.validateUserWorkspaceQuota(user)) {
      return;
    }

    if (!user.licenses || user.licenses.length === 0) {
      user.licenses = [LicenseName.FREE];
    }

    const payload = this.buildUserUpdatePayload(user);

    this.isLoading = true;

    this.apiService.post('update/user', payload)
      .pipe(switchMap(() => this.apiService.post<User[]>('users', new HttpHeaders({}))),
        tap((data) => {
          this.users = (data || []).map((user: User) => ({
            ...user,
            workspace_quota_gb: this.bytesToGb(user.workspace_quota_bytes),
          }));
        }),
        switchMap(() => this.nodeResolver.resolve()),
        finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (_) => {
          this.clearUserQuotaError(user);
        },
        error: (error) => {
          this.setUserQuotaError(user,
            this.getApiErrorMessage(error, 'Failed to update user quota.'));
        }
      });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const eventTargetElement = event.target as HTMLElement;
    if (!eventTargetElement.closest('.action-menu')) {
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

  get licenseDropdownOptions(): UiDropdownOption[] {
    return this.licenseList
      .filter(license => this.canAssignLicense(license))
      .map(license => ({ key: license, label: this.licenseService.getLicenseLabel(license) }));
  }

  get alertAllowedOptions(): UiDropdownOption[] {
    return [
      { key: this.allAlertsOption, label: 'All' },
      ...this.alertTenantOptions.map(tenant => ({
        key: tenant.id,
        label: tenant.name || tenant.email || tenant.id
      }))
    ];
  }

  get filteredUsers(): User[] {
    const search = this.userSearch.trim().toLowerCase();
    if (!search) {
      return this.users;
    }
    return this.users.filter((user) => [
      user.username,
      user.email,
      user.role,
      user.status,
      user.subscription ? 'paid' : 'free',
      this.getUserLicensesLabel(user),
      this.getUserPermissionsLabel(user)
    ].some(value => String(value || '').toLowerCase().includes(search)));
  }

  setUserStatus(user: User, value: string | null): void {
    if (value === 'active' || value === 'disable') {
      user.status = value;
    }
  }

  getPasswordResetValue(user: User): string {
    return user.password_reset_required ? 'true' : 'false';
  }

  setPasswordResetRequired(user: User, value: string | null): void {
    user.password_reset_required = value === 'true';
  }

  onUserLicenseDropdownChange(user: User, nextLicenses: string[]): void {
    const currentLicenses = user.licenses || [];
    const addedLicense = nextLicenses.find(license => !currentLicenses.includes(license));
    if (addedLicense) {
      this.toggleUserLicense(user, addedLicense as LicenseName);
      return;
    }
    user.licenses = nextLicenses;
  }

  showAlertsAllowed(user: User): boolean {
    return this.appService.userSessionData().user.role === 'admin' && (user.permissions || []).includes('case_management');
  }

  selectedAlertAllowedValues(user: User): string[] {
    if (user.alerts_allowed_all) {
      return [this.allAlertsOption];
    }
    return user.alerts_allowed_tenant_ids || [];
  }

  onUserPermissionChange(user: User, permissions: string[]): void {
    user.permissions = permissions;
    if (!this.showAlertsAllowed(user)) {
      this.clearAlertAccess(user);
    }
  }

  onUserAlertsAllowedChange(user: User, values: string[]): void {
    if (values.includes(this.allAlertsOption)) {
      user.alerts_allowed_all = true;
      user.alerts_allowed_tenant_ids = [];
      return;
    }
    const allowedTenantIds = new Set(this.alertTenantOptions.map(tenant => tenant.id));
    user.alerts_allowed_all = false;
    user.alerts_allowed_tenant_ids = values.filter(value => allowedTenantIds.has(value));
  }

  private loadAlertTenantOptions(): void {
    this.apiService.get<AlertAllowedTenantOption[]>('tenants/alerts/allowed-options').subscribe({
      next: (options) => {
        this.alertTenantOptions = options || [];
      },
      error: () => {
        this.alertTenantOptions = [];
      }
    });
  }

  private clearAlertAccess(user: User): void {
    user.alerts_allowed_all = false;
    user.alerts_allowed_tenant_ids = [];
  }

  private applyAlertAccessPayload(user: User): void {
    if (!this.showAlertsAllowed(user)) {
      this.clearAlertAccess(user);
      return;
    }
    if (user.alerts_allowed_all) {
      user.alerts_allowed_tenant_ids = [];
      return;
    }
    const allowedTenantIds = new Set(this.alertTenantOptions.map(tenant => tenant.id));
    user.alerts_allowed_tenant_ids = (user.alerts_allowed_tenant_ids || []).filter(id => allowedTenantIds.has(id));
  }

  private buildUserUpdatePayload(user: User): any {
    if (this.appService.userSessionData().user.role === 'admin') {
      this.applyAlertAccessPayload(user);
    }

    const payload: any = { ...user };

    payload.workspace_quota_bytes = this.gbToBytes(user.workspace_quota_gb);

    delete payload.workspace_quota_gb;
    delete payload.workspace_used_bytes;
    delete payload.workspace_remaining_bytes;

    if (this.appService.userSessionData().user.role !== 'admin') {
      delete payload.alerts_allowed_all;
      delete payload.alerts_allowed_tenant_ids;
    }

    return payload;
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

  getUserPermissionsLabel(user: User): string {
    if (!user.permissions || user.permissions.length === 0) {
      return 'None';
    }
    return user.permissions.map(permission => this.getPermissionLabel(permission)).join(', ');
  }

  getPermissionLabel(permission: string): string {
    return this.permissionOptions.find(option => option.key === permission)?.label || permission;
  }

  canEditUser(user: User): boolean {
    return !(user.role === 'admin' || user.licenses?.includes('maintainer'));
  }

  getStatusBadgeClass(status: string): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (status === 'active') {
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

  isAddUserDisabled(): boolean {
    return this.appService.userSessionData().tenant.quotaExceeded || !this.appService.getConfig().appSettings.smtp_configured;
  }

  getAddUserTooltip(): string {
    if (this.appService.userSessionData().tenant.quotaExceeded) {
      return 'Access blocked';
    }
    if (!this.appService.getConfig().appSettings.smtp_configured) {
      return 'SMTP configuration is incomplete';
    }
    return '';
  }

  addtenant() {
    if (this.isAddUserDisabled()) {
      return;
    }
    this.showAddTenantPopup = true;
  }

  clossAddTenant() {
    this.showAddTenantPopup = false;
  }

  flushUserQuota(user: User): void {
    this.userToFlush = user;
    this.isFlushUserConfirmationOpen.set(true);
  }

  confirmFlushUserQuota(value: boolean): void {
    this.isFlushUserConfirmationOpen.set(false);

    if (!value || !this.userToFlush) {
      this.userToFlush = null;
      return;
    }

    const userId = this.userToFlush.id;

    if (!userId) {
      this.userToFlush = null;
      return;
    }

    this.isLoading = true;

    this.apiService
      .post(`users/${userId}/workspace-quota/flush`, {})
      .pipe(switchMap(() => this.apiService.post<User[]>('users', new HttpHeaders({}))),
        tap((data) => {
          this.users = (data || []).map((user: User) => ({
            ...user,
            workspace_quota_gb: this.bytesToGb(user.workspace_quota_bytes),
          }));
        }),
        switchMap(() => this.nodeResolver.resolve()),
        finalize(() => {
          this.isLoading = false;
          this.userToFlush = null;
        }))
      .subscribe();
  }
}
