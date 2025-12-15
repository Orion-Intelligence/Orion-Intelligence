import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgFor, NgIf} from '@angular/common';
import {LicenseName} from '../../../../shared/model/licenses/license.rules';
import {TenantTeamModel} from '../../../../shared/model/tenant/tenant.model';
import {ApiService} from '../../../../shared/services/api.service';
import {AuthService} from '../../../../services/authetication/auth.service';
import {popupAnimation, overlayAnimation} from '../../../../shared/animations/popup.animations';

@Component({
  selector: 'app-add-tenant',
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './add-tenant.component.html',
  animations: [popupAnimation, overlayAnimation]
})
export class AddTenantComponent implements OnInit {
  @Output() closs = new EventEmitter<void>();
  @Output() accountAdded = new EventEmitter<void>();

  licenseList = Object.values(LicenseName);
  licenses = ['free', 'osint_basic', 'osint_advanced', 'pentester', 'maintainer', 'enterprise'];
  isAdmin: boolean = false;

  model: TenantTeamModel = {
    username: '',
    email: '',
    password: '',
    role: 'profile',
    status: 'active',
    subscription: false,
    licenses: []
  };
  errorText: string = "";
  usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{7,19}$/;
  usernameSuggestion: string = "";

  constructor(
    public apiService: ApiService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'admin';
    this.isAdmin ? (this.model.role = 'demo') : (this.model.role = 'profile');
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
    if (!this.model.email) {
      this.errorText = 'Email is required';
      return;
    }
    if (!this.model.password) {
      this.errorText = 'Password is required';
      return;
    }
    const endpoint = this.isAdmin ? 'admin/create/user' : 'tenant/create/user';
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
    const suggestions: string[] = [];
    const base = this.model.username || '';
    let counter = 1;
    while (suggestions.length < 4 && counter < 50) {
      const suffix = counter.toString();
      let s = base.toLowerCase();
      if (!/^[A-Za-z]/.test(s)) {
        s = 'u' + s;
      }
      s = s.replace(/[^A-Za-z0-9_-]/g, '');
      if (s.length > 20 - suffix.length) {
        s = s.slice(0, 20 - suffix.length);
      }
      if (s.length < 8 - suffix.length) {
        s = s.padEnd(8 - suffix.length, '0');
      }
      const suggestion = s + suffix;
      if (this.usernamePattern.test(suggestion) && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
      counter++;
    }
    this.usernameSuggestion = suggestions.length
      ? 'Username already taken. Suggested usernames: ' + suggestions.join(', ')
      : 'Username already taken.';
    this.errorText = 'Invalid username';
    return false;
  }

  onClose() {
    this.closs.emit();
  }

  getLicenseLabel(license: LicenseName): string {
    switch (license) {
      case LicenseName.FREE:
        return 'Free';
      case LicenseName.OSINT_BASIC:
        return 'OSINT Basic';
      case LicenseName.OSINT_ADVANCED:
        return 'OSINT Advanced';
      case LicenseName.PENTESTER:
        return 'Pentester';
      case LicenseName.ENTERPRISE:
        return 'Enterprise';
      default:
        return license;
    }
  }

  toggleTenantLicense(tenant: any, license: LicenseName): void {
    if (!tenant.licenses) {
      tenant.licenses = [];
    }

    const index = tenant.licenses.indexOf(license);
    if (index > -1) {
      tenant.licenses.splice(index, 1);
    } else {
      tenant.licenses.push(license);
    }
  }
}
