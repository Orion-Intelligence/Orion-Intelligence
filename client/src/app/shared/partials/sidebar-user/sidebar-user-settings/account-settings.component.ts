import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { userMetaData, userSessionData } from '../../../model/company-profile/node.model';
import { UserImagePickerComponent } from "./user-image-picker/user-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { LicenseName } from '../../../model/licenses/license.rules';
import { getTenantLocationDisplay } from './sidebar-settings.util';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './account-settings.component.html'
})
export class AccountSettingsComponent implements OnInit {
  userSessionData: userSessionData;
  twoFactorEnabled = true;
  isDarkMode = true;
  editableUsername = '';

  constructor(protected apiService: ApiService, protected appService: AppService, protected licenseService: LicenseService, private messageNotificationService: MessageNotificationService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    if (this.userSessionData) {
      this.setItemsFromPreferences();
      this.twoFactorEnabled = this.userSessionData.user.twofa_enabled;
      this.editableUsername = this.userSessionData.user.username || '';
    }
  }

  setItemsFromPreferences() {
    const userTheme = this.userSessionData?.user?.theme;
    const preferenceTheme = this.userSessionData?.user?.preferences?.["theme"];
    const theme = userTheme || preferenceTheme || 'dark-theme';
    this.isDarkMode = theme === 'dark-theme';
  }

  isAdmin(): boolean {
    return this.appService.userSessionData().user.role === 'admin';
  }

  applyTheme() {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(this.isDarkMode ? 'dark-theme' : 'light-theme');
  }

  private getCurrentTheme(): 'dark-theme' | 'light-theme' {
    return this.isDarkMode ? 'dark-theme' : 'light-theme';
  }

  toggleTheme() {
    const theme = this.getCurrentTheme();
    this.appService.userSessionData.update(state => {
      if (!state) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          theme,
          preferences: {
            ...(state.user.preferences || {}),
            theme
          }
        }
      };
    });
    this.applyTheme();
    this.updateUser();
  }

  toggleTwoFa() {
    this.userSessionData.user.twofa_enabled = this.twoFactorEnabled;
    this.updateUser();
  }

  getLocationDisplay(): string {
    return getTenantLocationDisplay(this.userSessionData.tenant);
  }

  updateUser() {
    const route = "update/current/user";
    this.userSessionData.user.username = this.editableUsername.trim() || this.userSessionData.user.username;
    const theme = this.getCurrentTheme();
    const preferences = {
      ...(this.userSessionData.user.preferences || {}),
      theme
    };
    this.userSessionData.user.theme = theme;
    this.userSessionData.user.preferences = preferences;
    const userMeta: userMetaData = {
      username: this.userSessionData.user.username,
      twofa_enabled: this.userSessionData.user.twofa_enabled,
      theme,
      preferences,
      demo_tour: this.userSessionData.user.demo_tour
    };
    this.apiService.post(route, userMeta).subscribe({
      next: () => {
      },
      error: (_err) => {
      },
    });
  }

  updateUserResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.put<any>('user/image', formData).subscribe({
      next: (res) => {
        if (res?.image) {
          this.appService.userSessionData().user.image = `/api/s/static/user/${res.image}`;
        }
      },
      error: (err) => {
        const message = err?.error?.detail || 'Failed to upload image';
        this.messageNotificationService.show(message);
      }
    });
  }

  deleteUserResource() {
    return this.apiService.delete<any>('user/image').subscribe(() => {
      this.appService.userSessionData().user.image = `/api/s/static/user/default.png`;
    });
  }

  getUserLicensesLabel(user: any): string {
    if (!user?.license?.length) {
      return '';
    }
    return user.license.map((l: LicenseName) => this.licenseService.getLicenseLabel(l)).join(', ');
  }

  get displayVersion(): string {
    const version = this.appService.getConfig()?.appSettings?.version || '';
    return version.replaceAll('_', '.');
  }
}
