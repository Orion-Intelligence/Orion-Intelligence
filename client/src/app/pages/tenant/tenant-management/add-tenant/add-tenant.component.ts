import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { LicenseName } from '../../../../shared/model/licenses/license.rules';
import { User } from '../../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-add-tenant',
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './add-tenant.component.html',
  styleUrl: './add-tenant.component.css'
})

export class AddTenantComponent {

  @Output() closs = new EventEmitter<void>();

  licenseList = Object.values(LicenseName);
  licenses = ["free", "osint_basic", "osint_advanced", "pentester", "maintainer", "enterprise"];

  model: User = {
    username: "",
    email: "",
    // password: "",
    role: "demo",
    status: "verification_pending",
    subscription: false,
    licenses: [],
    verificationDate: ""
  };
  password = ''

  constructor(public apiService: ApiService) {
  }

  onSubmit() {
    console.log(this.model);
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
