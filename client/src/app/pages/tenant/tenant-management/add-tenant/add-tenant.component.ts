import { Component, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { TenantTeamModel } from '../../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../../shared/services/api.service';
import { popupAnimation, overlayAnimation } from '../../../../shared/animations/popup.animations';
import { AppService } from '../../../../services/core/app/app.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { areAllPasswordRequirementsMet, buildUsernameSuggestions, buildUsernameSuggestionText, createEmptyPasswordChecks, evaluatePasswordInput, PasswordChecks, PasswordStrength } from '../../../../shared/utils/auth-form.util';
import { PasswordToggleDirective } from '../../../../shared/directives/password-toggle.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../../../shared/components/ui-dropdown/ui-dropdown.component';

@Component({
  selector: 'app-add-tenant',
  imports: [FormsModule, NgClass, PasswordToggleDirective, TranslatePipe, UiDropdownComponent],
  templateUrl: './add-tenant.component.html',
  animations: [popupAnimation, overlayAnimation]
})
export class AddTenantComponent implements OnInit {
  licenseList = Object.values(LicenseName);
  licenses = ['free', 'osint_basic', 'osint_advanced', 'social_mapper', 'pentester', 'maintainer', 'enterprise'];
  permissionOptions: UiDropdownOption[] = [{ key: 'case_management', label: 'Case Management' }];
  statusOptions: UiDropdownOption[] = [{ key: 'active', label: 'Active' }, { key: 'disable', label: 'Disable' }];
  isAdmin: boolean = false;
  model: TenantTeamModel = { username: '', email: '', password: '', role: 'analyst', status: 'active', subscription: false, licenses: [], permissions: [] };
  errorText: string = "";
  usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{7,19}$/;
  usernameSuggestion: string = "";
  showPasswordMeter = false;
  passwordStrength: PasswordStrength = null;
  passwordChecks: PasswordChecks = createEmptyPasswordChecks();
  currentUnmetCheck: string | null = null;
  confirmPassword = '';
  readonly closs = output<undefined>();
  readonly accountAdded = output<undefined>();

  constructor(public apiService: ApiService, private appService: AppService, protected licenseService: LicenseService) {
  }

  ngOnInit(): void {
    this.isAdmin = this.appService.userSessionData().user.role === 'admin';
    this.isAdmin ? (this.model.role = 'analyst') : (this.model.role = 'member');
  }

  onSubmit() {
    this.errorText = '';
    this.usernameSuggestion = '';
    if (!this.model.username) {
      this.errorText = 'Username is required';
      return;
    }
    if (!this.validateUsername()) {
      return;
    }
    if (!this.model.email && this.model.role != "demo") {
      this.errorText = 'Email is required';
      return;
    }
    if (!this.model.password || !this.allPasswordRequirementsMet) {
      this.errorText = 'Password is required';
      return;
    }
    if (this.model.password !== this.confirmPassword) {
      this.errorText = 'Password and confirm password do not match';
      return;
    }
    if (!this.model.licenses || this.model.licenses.length === 0) {
      this.model.licenses = [LicenseName.FREE];
    }
    const endpoint = this.isAdmin ? 'tenant/create/user' : 'tenant/create/user';
    this.apiService.post(endpoint, this.model).subscribe({
      next: () => {
        // TODO: The 'emit' function requires a mandatory void argument
        this.accountAdded.emit(undefined);
        this.onClose();
      },
      error: err => {
        this.errorText = err?.error?.detail || 'Failed to create user';
      }
    });
  }

  validateUsername(): boolean {
    if (this.usernamePattern.test(this.model.username)) {
      return true;
    }
    const suggestions = buildUsernameSuggestions(this.model.username, this.usernamePattern);
    this.usernameSuggestion = buildUsernameSuggestionText(suggestions);
    this.errorText = 'Invalid username';
    return false;
  }

  onClose() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.closs.emit(undefined);
  }

  get hasFullLicenseAccess(): boolean {
    return this.appService.userSessionData()?.user?.role === 'admin';
  }

  get tenantLicenses(): string[] {
    return this.appService.userSessionData()?.tenant?.licenses ?? [];
  }

  get visibleTenantLicensesCount(): number {
    if (this.hasFullLicenseAccess) {
      return this.licenseList.filter(license => this.licenseService.getLicenseLabel(license) !== 'maintainer').length;
    }
    return this.licenseList.filter(license => this.tenantLicenses.includes(license) &&
          this.licenseService.getLicenseLabel(license) !== 'maintainer').length;
  }

  get roleOptions(): UiDropdownOption[] {
    return this.isAdmin
      ? [{ key: 'analyst', label: 'Analyst' }, { key: 'demo', label: 'Demo' }]
      : [{ key: 'analyst', label: 'Analyst' }, { key: 'member', label: 'Member' }];
  }

  get licenseDropdownOptions(): UiDropdownOption[] {
    return this.licenseList
      .filter(license => (this.hasFullLicenseAccess || this.tenantLicenses.includes(license)) && license !== LicenseName.MAINTAINER)
      .map(license => ({ key: license, label: this.licenseService.getLicenseLabel(license) }));
  }

  setRole(value: string | null): void {
    if (value === 'member' || value === 'analyst' || value === 'demo') {
      this.model.role = value;
    }
  }

  setStatus(value: string | null): void {
    if (value === 'active' || value === 'disable') {
      this.model.status = value;
    }
  }

  onLicenseDropdownChange(nextLicenses: string[]): void {
    const currentLicenses = this.model.licenses || [];
    const addedLicense = nextLicenses.find(license => !currentLicenses.includes(license));
    if (addedLicense) {
      this.toggleTenantLicense(this.model, addedLicense as LicenseName);
      return;
    }
    this.model.licenses = nextLicenses;
  }

  toggleTenantLicense(tenant: any, license: LicenseName): void {
    if (!tenant.licenses) {
      tenant.licenses = [];
    }
    const index = tenant.licenses.indexOf(license);
    if (index > -1) {
      tenant.licenses.splice(index, 1);
      return;
    }
    if (license === LicenseName.ENTERPRISE) {
      tenant.licenses = [LicenseName.ENTERPRISE];
      return;
    }
    tenant.licenses = tenant.licenses.filter((l: LicenseName) => l !== LicenseName.ENTERPRISE);
    if (license === LicenseName.FREE) {
      tenant.licenses = [LicenseName.FREE];
      return;
    }
    if (license === LicenseName.OSINT_BASIC) {
      tenant.licenses = tenant.licenses.filter((l: LicenseName) =>
        l !== LicenseName.OSINT_ADVANCED && l !== LicenseName.FREE);
    }
    if (license === LicenseName.OSINT_ADVANCED) {
      tenant.licenses = tenant.licenses.filter((l: LicenseName) =>
        l !== LicenseName.OSINT_BASIC && l !== LicenseName.FREE);
    }
    tenant.licenses = tenant.licenses.filter((l: LicenseName) => l !== LicenseName.FREE);

    tenant.licenses.push(license);
  }

  onPasswordInput(password: string) {
    const evaluation = evaluatePasswordInput(password);
    this.showPasswordMeter = evaluation.showPasswordMeter;
    this.passwordChecks = evaluation.passwordChecks;
    this.currentUnmetCheck = evaluation.currentUnmetCheck;
    this.passwordStrength = evaluation.passwordStrength;
  }

  get allPasswordRequirementsMet(): boolean {
    return areAllPasswordRequirementsMet(this.passwordChecks);
  }
}
