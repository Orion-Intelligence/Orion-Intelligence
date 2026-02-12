import {Component, OnInit} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../../../../services/api.service';
import {AppService} from '../../../../../services/core/app/app.service';
import {AuthService} from '../../../../../services/authetication/auth.service';
import {LicenseService} from '../../../../../services/licenses/licenses.service';
import {userSessionData} from '../../../../model/company-profile/node.model';
import {UserImagePickerComponent} from '../user-image-picker/user-image-picker.component';
import {TenantModel} from '../../../../model/tenant/tenant.model';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-tenant-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './tenant-settings.component.html',
  styleUrl: './tenant-settings.component.css'
})
export class TenantSettingsComponent implements OnInit {
  isAccountSectionOpen = true;

  isEditing = false;
  userSessionData: userSessionData;
  userId: string = '';

  constructor(protected apiService: ApiService, protected appService: AppService, protected authService: AuthService, protected licenseService: LicenseService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    this.userId = this.userSessionData?.user.preferences?.["userId"]
  }


  isMember(): boolean {
    return this.appService.userSessionData().user.role == 'member';
  }

  toggleSection(section: string) {
    if (section === 'profile') this.isAccountSectionOpen = !this.isAccountSectionOpen;
  }

  toggleEdit(event: Event) {
    event.stopPropagation();
    if (this.isEditing) {
      this.updateUser()
    }
    this.isEditing = !this.isEditing;
  }

  getLocationDisplay(): string {
    const tenant = this.userSessionData.tenant;
    if (!tenant) return '';

    const {city, country} = tenant;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return '';
  }

  updateUser() {
    let route = "update/tenants"
    const tenantData: TenantModel = {
      id: '',
      name: this.userSessionData.tenant.name,
      phone: this.userSessionData.tenant.phone,
      country: this.userSessionData.tenant.country,
      city: this.userSessionData.tenant.city,
      postal_code: this.userSessionData.tenant.postalCode,
      iocs: []
    };

    this.apiService.post(route, tenantData).subscribe({
      next: () => {
      },
      error: (_) => {
      },
    });
  }

  cancelEdit(event: Event) {
    event.stopPropagation();
    this.isEditing = false;
  }

  updateUserResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiService.put<any>('tenant/image', formData).subscribe(res => {
      if (res?.image) {
        this.appService.userSessionData().tenant.image =
          `/api/s/static/tenant/${res.image}`;
      }
    });
  }

  deleteUserResource() {
    return this.apiService.delete<any>('tenant/image').subscribe(() => {
      this.appService.userSessionData().tenant.image =
        'assets/images/tenant/default.png';
    });
  }
}
