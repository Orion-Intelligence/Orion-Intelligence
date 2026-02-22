import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { TenantTeamModel } from '../../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../../shared/services/api.service';
import { popupAnimation, overlayAnimation } from '../../../../shared/animations/popup.animations';
import { AppService } from '../../../../services/core/app/app.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { buildUsernameSuggestions, buildUsernameSuggestionText } from '../../../../shared/utils/auth-form.util';
@Component({
  selector: 'app-add-tenant',
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './add-tenant.component.html',
  styleUrls: ['./add-tenant.component.css', '../view-tenant.component-shared.css'],
  animations: [popupAnimation, overlayAnimation]
})
export class AddTenantComponent implements OnInit {
  licenseList = Object.values(LicenseName);
  licenses = ['free', 'osint_basic', 'osint_advanced', 'social_mapper', 'pentester', 'maintainer', 'enterprise'];
  isAdmin: boolean = false;
  model: TenantTeamModel = { username: '', email: '', password: '', role: 'analyst', status: 'active', subscription: false, licenses: [] };
  errorText: string = "";
  usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{7,19}$/;
  usernameSuggestion: string = "";

  @Output() closs = new EventEmitter<void>();
  @Output() accountAdded = new EventEmitter<void>();

  constructor(public apiService: ApiService, private appService: AppService, protected licenseService: LicenseService) {
  }

  ngOnInit(): void {
    this.isAdmin = this.appService.userSessionData().user.role === 'admin';
    this.isAdmin ? (this.model.role = 'member') : (this.model.role = 'analyst');
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
    if (!this.model.password) {
      this.errorText = 'Password is required';
      return;
    }
    if (!this.model.licenses || this.model.licenses.length === 0) {
      this.model.licenses = [LicenseName.FREE];
    }
    const endpoint = this.isAdmin ? 'tenant/create/user' : 'tenant/create/user';
    this.apiService.post(endpoint, this.model).subscribe({
      next: () => {
        this.accountAdded.emit();
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
    this.closs.emit();
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
}
