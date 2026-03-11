import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AppService } from '../../../../../services/core/app/app.service';
import { AuthService } from '../../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { userSessionData } from '../../../../model/company-profile/node.model';
import { UserImagePickerComponent } from '../user-image-picker/user-image-picker.component';
import { TenantModel } from '../../../../model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { getTenantLocationDisplay, toggleEditState } from '../sidebar-settings.util';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';
@Component({
  selector: 'app-tenant-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './tenant-settings.component.html'
})
export class TenantSettingsComponent implements OnInit {
  isAccountSectionOpen = true;
  isEditing = false;
  userSessionData: userSessionData;
  userId: string = '';

  constructor(protected apiService: ApiService, protected appService: AppService, protected authService: AuthService, protected licenseService: LicenseService, private messageNotificationService: MessageNotificationService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    this.userId = this.userSessionData?.user.preferences?.["userId"];
  }

  isMember(): boolean {
    return this.appService.userSessionData().user.role == 'member';
  }

  toggleSection(section: string) {
    if (section === 'profile') {
      this.isAccountSectionOpen = !this.isAccountSectionOpen;
    }
  }

  toggleEdit(event: Event) {
    this.isEditing = toggleEditState(event, this.isEditing, () => this.updateUser());
  }

  getLocationDisplay(): string {
    return getTenantLocationDisplay(this.userSessionData.tenant);
  }

  updateUser() {
    let route = "update/tenants";
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
    return this.apiService.put<any>('tenant/image', formData).subscribe({
      next: (res) => {
        if (res?.image) {
          this.appService.userSessionData().tenant.image =
                      `/api/s/static/tenant/${res.image}`;
        }
      },
      error: (err) => {
        const message = err?.error?.detail || 'Failed to upload image';
        this.messageNotificationService.show(message);
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
