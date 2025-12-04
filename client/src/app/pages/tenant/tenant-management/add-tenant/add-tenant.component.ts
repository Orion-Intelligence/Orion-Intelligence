import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { TenantTeamModel } from '../../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../../shared/services/api.service';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { popupAnimation, overlayAnimation } from '../../../../shared/animations/popup.animations';

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
  licenses = ["free", "osint_basic", "osint_advanced", "pentester", "maintainer", "enterprise"];
  isAdmin: boolean = false;

  model: TenantTeamModel = {
    username: "",
    email: "",
    password: "",
    role: "profile",
    status: "active",
    subscription: false,
    licenses: [],
  };

  constructor(public apiService: ApiService, private messageNotificationService: MessageNotificationService, private authService: AuthService) {
  }
  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === "admin"
    this.isAdmin ? this.model.role = 'demo' : this.model.role = 'profile';
  }

  onSubmit() {
    if (this.isAdmin) {
      this.apiService.post('admin/create/user', this.model).subscribe({
        next: () => {
          this.accountAdded.emit()
          this.onClose();
        },
        error: (err) => {
          this.messageNotificationService.show(err?.error?.detail || 'failed to create user');
        },
      });
    }
    else {
      this.apiService.post('tenant/create/user', this.model).subscribe({
        next: () => {
          this.accountAdded.emit()
          this.onClose();
        },
        error: (err) => {
          this.messageNotificationService.show(err?.error?.detail || 'failed to create user');
        },
      });
    }
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
