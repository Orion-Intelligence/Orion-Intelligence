import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {ApiService} from '../../../services/api.service';
import {userMetaData, userSessionData} from '../../../model/company-profile/node.model';
import {UserImagePickerComponent} from "./user-image-picker/user-image-picker.component";
import {AppStorageService} from '../../../../services/core/app/app-storage.service';
import {AppService} from '../../../../services/core/app/app.service';
import {AuthService} from '../../../../services/authetication/auth.service';
import {LicenseService} from '../../../../services/licenses/licenses.service';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './account-settings.component.html'
})
export class AccountSettingsComponent implements OnInit {
  isAccountSectionOpen = true;
  is2FAOpen = true;
  isThemeOpen = true;
  isEditing = false;
  userSessionData: userSessionData;
  twoFactorEnabled = true;
  isDarkMode = true;
  userId: string = '';

  constructor(protected apiService: ApiService, protected appStorage: AppStorageService, protected appService: AppService, protected authService: AuthService, protected licenseService: LicenseService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    if (this.userSessionData) {
      this.setItemsFromPreferences();
      this.twoFactorEnabled = this.userSessionData.user.twofa_enabled
    }
  }

  setItemsFromPreferences() {
    if (this.userSessionData?.user.preferences?.["theme"]) {
      this.isDarkMode = this.userSessionData?.user.preferences?.["theme"] === 'dark-theme';
    } else {
      const storedTheme = this.appStorage.getTheme();
      if (storedTheme === 'dark-theme') {
        this.isDarkMode = true;
      } else if (storedTheme === 'light-theme') {
        this.isDarkMode = false;
      }
    }
    this.userId = this.userSessionData?.user.preferences?.["userId"]
  }

  isAdmin(): boolean {
    return this.appService.userSessionData().user.role === 'admin';
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
    if (section === 'twoFA') this.is2FAOpen = !this.is2FAOpen;
    if (section === 'theme') this.isThemeOpen = !this.isThemeOpen;
  }

  toggleEdit(event: Event) {
    event.stopPropagation();
    if (this.isEditing) {
      this.updateUser()
    }
    this.isEditing = !this.isEditing;
  }

  toggleTheme() {
    const theme = this.isDarkMode ? 'dark-theme' : 'light-theme';

    this.appStorage.setTheme(theme);

    this.appService.userSessionData.update(state => {
      if (!state) return state;

      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...(state.user.preferences || {}),
            theme
          }
        }
      };
    });

    this.applyTheme();
  }

  toggleTwoFa() {
    this.userSessionData.user.twofa_enabled = !this.userSessionData.user.twofa_enabled
    this.updateUser()
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
    let route = "update/current/user"
    const userMeta: userMetaData = {
      username: this.appService.userSessionData().user.username,
      twofa_enabled: this.userSessionData.user.twofa_enabled,
      preferences: this.userSessionData.user.preferences,
    };

    this.apiService.post(route, userMeta).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  updateUserResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiService.put<any>('user/image', formData).subscribe(res => {
      if (res?.image) {
        this.appService.userSessionData().user.image =
          `/api/s/static/user/${res.image}`;
      }
    });
  }

  deleteUserResource() {
    return this.apiService.delete<any>('user/image').subscribe(() => {
      this.appService.userSessionData().user.image = `/api/s/static/user/default.png`
    });
  }

  protected readonly JSON = JSON;
}
