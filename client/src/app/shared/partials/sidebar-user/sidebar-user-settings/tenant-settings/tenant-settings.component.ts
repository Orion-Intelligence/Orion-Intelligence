import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AppStorageService } from '../../../../../services/core/app/app-storage.service';
import { AppService } from '../../../../../services/core/app/app.service';
import { AuthService } from '../../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { userMetaData, userSessionData } from '../../../../model/company-profile/company.profile.model';
import { UserImagePickerComponent } from '../user-image-picker/user-image-picker.component';
import { TenantModel } from '../../../../model/tenant/tenant.model';

@Component({
  selector: 'app-tenant-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
  templateUrl: './tenant-settings.component.html',
  styleUrl: './tenant-settings.component.css'
})
export class TenantSettingsComponent implements OnInit {
  isAccountSectionOpen = true;

  isEditing = false;
  userSessionData: userSessionData;
  twoFactorEnabled = true;
  isDarkMode = true;
  userId: string = '';
  constructor(protected apiService: ApiService, protected appStorage: AppStorageService, protected appService: AppService, protected authService: AuthService, protected licenseService: LicenseService) {
    this.userSessionData = this.appService.userSessionData();
  }
  ngOnInit(): void {
    this.userId = this.userSessionData?.user.preferences?.["userId"]
  }


  isMember(): boolean {
    return this.appService.userSessionData().user.role == 'member';
  }
  applyTheme() {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(this.isDarkMode ? 'dark-theme' : 'light-theme');
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

    const { city, country } = tenant;
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
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'save company profile failed');
      },
    });
  }
  cancelEdit(event: Event) {
    event.stopPropagation();
    this.isEditing = false;
  }

  protected readonly JSON = JSON;
}
