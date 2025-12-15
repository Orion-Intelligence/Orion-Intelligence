import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { CompanyProfile } from '../../../model/company-profile/company.profile.model';
import { ProfileImagePickerComponent } from "./profile-image-picker/profile-image-picker.component";
import { AppStorageService } from '../../../../services/core/app/app-storage.service';
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [FormsModule, NgIf, CommonModule, ProfileImagePickerComponent],
  templateUrl: './sidebar-profile-settings.component.html'
})
export class SidebarProfileSettingsComponent implements OnInit {
  isProfileOpen = true;
  is2FAOpen = true;
  isThemeOpen = true;
  isEditing = false;
  profile: CompanyProfile;
  twoFactorEnabled = true;
  isDarkMode = true;
  userId: string = '';
  constructor(protected apiService: ApiService, protected appStorage: AppStorageService, private appService: AppService, protected authService: AuthService) { this.profile = this.appService.userProfile(); }
  ngOnInit(): void {
    if (this.profile) {
      this.setItemsFromPreferences();
    }
  }
  setItemsFromPreferences() {
    if (this.profile?.preferences?.["theme"]) {
      this.isDarkMode = this.profile?.preferences?.["theme"] === 'dark-theme';
    } else {
      const storedTheme = this.appStorage.getTheme();
      if (storedTheme === 'dark-theme') {
        this.isDarkMode = true;
      } else if (storedTheme === 'light-theme') {
        this.isDarkMode = false;
      }
    }
    if (this.profile?.preferences?.["twoFa"]) {
      this.twoFactorEnabled = this.profile?.preferences?.["twoFa"] === 'true';
    }
    this.userId = this.profile?.preferences?.["userId"]
  }
  isAdmin(): boolean {
    return this.authService.getRole() === 'admin';
  }
  isAnalyst(): boolean {
    return this.authService.getRole() == 'analyst';
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
    if (section === 'profile') this.isProfileOpen = !this.isProfileOpen;
    if (section === 'twoFA') this.is2FAOpen = !this.is2FAOpen;
    if (section === 'theme') this.isThemeOpen = !this.isThemeOpen;
  }

  toggleEdit(event: Event) {
    event.stopPropagation();
    if (this.isEditing) {
      this.updateCompanyProfile()
    }
    this.isEditing = !this.isEditing;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark-theme' : 'light-theme';

    this.appStorage.setTheme(theme);

    this.appService.userProfile.update(profile => {
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
    this.twoFactorEnabled = !this.twoFactorEnabled;

    this.appService.userProfile.update(profile => {
      if (!profile) return profile;
      return {
        ...profile,
        preferences: {
          ...profile.preferences,
          twoFa: String(this.twoFactorEnabled)
        }
      };
    });
  }

  getLocationDisplay(): string {
    const profile = this.profile;
    if (!profile) return '';

    const { city, country } = profile;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return '';
  }

  updateCompanyProfile() {
    this.apiService.post('update/company/profile', this.profile).subscribe({
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
