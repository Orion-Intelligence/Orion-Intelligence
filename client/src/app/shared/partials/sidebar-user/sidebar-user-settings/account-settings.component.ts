import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { userMetaData, userSessionData } from '../../../model/company-profile/company.profile.model';
import { UserImagePickerComponent } from "./user-image-picker/user-image-picker.component";
import { AppStorageService } from '../../../../services/core/app/app-storage.service';
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
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
  constructor(protected apiService: ApiService, protected appStorage: AppStorageService, private appService: AppService, protected authService: AuthService, protected licenseService: LicenseService) {
    this.userSessionData = this.appService.userSessionData();
  }
  ngOnInit(): void {
    if (this.userSessionData) {
      this.setItemsFromPreferences();
      this.twoFactorEnabled = this.userSessionData.twofa_enabled
    }
  }
  setItemsFromPreferences() {
    if (this.userSessionData?.preferences?.["theme"]) {
      this.isDarkMode = this.userSessionData?.preferences?.["theme"] === 'dark-theme';
    } else {
      const storedTheme = this.appStorage.getTheme();
      if (storedTheme === 'dark-theme') {
        this.isDarkMode = true;
      } else if (storedTheme === 'light-theme') {
        this.isDarkMode = false;
      }
    }
    this.userId = this.userSessionData?.preferences?.["userId"]
  }
  isAdmin(): boolean {
    return this.authService.getRole() === 'admin';
  }
  isProfile(): boolean {
    return this.authService.getRole() == 'profile';
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
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark-theme' : 'light-theme';

    this.appStorage.setTheme(theme);

    this.appService.userSessionData.update(profile => {
      if (!profile) return profile;
      return {
        ...profile,
        preferences: {
          ...profile.preferences,
          theme: theme
        }
      };
    });

    this.applyTheme();
  }
  toggleTwoFa() {
    this.userSessionData.twofa_enabled = !this.userSessionData.twofa_enabled
    this.updateUser()
  }

  getLocationDisplay(): string {
    const profile = this.userSessionData;
    if (!profile) return '';

    const { city, country } = profile;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return '';
  }

  updateUser() {
    let route = "update/current/user"
    const userMeta: userMetaData = {
      username: this.authService.getUsername(),
      twofa_enabled: this.userSessionData.twofa_enabled,
      preferences: this.userSessionData.preferences,
    };

    this.apiService.post(route, userMeta).subscribe({
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
