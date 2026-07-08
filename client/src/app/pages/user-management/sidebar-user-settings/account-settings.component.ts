import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { userMetaData, userSessionData } from '../../../shared/model/company-profile/node.model';
import { UserImagePickerComponent } from "./user-image-picker/user-image-picker.component";
import { AppService } from '../../../services/core/app/app.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { LicenseName } from '../../../shared/model/licenses/license.rules';
import { getTenantLocationDisplay } from './sidebar-settings.util';
import { areAllPasswordRequirementsMet, createEmptyPasswordChecks, evaluatePasswordInput, PasswordChecks, PasswordStrength } from '../../../shared/utils/auth-form.util';
import { PasswordToggleDirective } from '../../../shared/directives/password-toggle.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LANGUAGE_OPTIONS, LanguageOption } from '../../../shared/constants/shared-enums';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent, PasswordToggleDirective, TranslatePipe],
  animations: [fadeInDashboardItem],
  templateUrl: './account-settings.component.html'
})
export class AccountSettingsComponent implements OnInit {
  userSessionData: userSessionData;
  twoFactorEnabled = true;
  isDarkMode = true;
  isProfileVisible = true;
  editableUsername = '';
  selectedLanguage = '';
  hasLanguagePreference = false;
  languageOptions: LanguageOption[] = LANGUAGE_OPTIONS;
  isPasswordSectionOpen = false;
  newPassword = '';
  confirmPassword = '';
  passwordStrength: PasswordStrength = null;
  showPasswordMeter = false;
  passwordChecks: PasswordChecks = createEmptyPasswordChecks();
  currentUnmetCheck: string | null = null;

  constructor(protected apiService: ApiService, protected appService: AppService, protected licenseService: LicenseService, private messageNotificationService: MessageNotificationService, private translationService: TranslationService) {
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
    this.isProfileVisible = this.userSessionData?.user?.preferences?.["profile_visible"] !== false;
    const userLanguage = this.userSessionData?.user?.preferences?.["language"];
    this.hasLanguagePreference = this.translationService.isSupportedLanguage(userLanguage);
    const systemLanguage = this.translationService.getSystemLanguage();
    this.selectedLanguage = this.hasLanguagePreference ? this.translationService.getSupportedLanguage(userLanguage, systemLanguage) : systemLanguage;
  }

  isTenantProfileVisibilityEnabled(): boolean {
    return this.userSessionData?.tenant?.profileVisibilityEnabled !== false;
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

  toggleProfileVisibility() {
    if (!this.isTenantProfileVisibilityEnabled()) {
      return;
    }
    const preferences = {
      ...(this.userSessionData.user.preferences || {}),
      profile_visible: this.isProfileVisible
    };
    this.userSessionData.user.preferences = preferences;
    this.updateUser();
  }

  changeLanguage() {
    this.selectedLanguage = this.translationService.getSupportedLanguage(this.selectedLanguage, this.translationService.getSystemLanguage());
    this.hasLanguagePreference = true;
    const preferences = {
      ...(this.userSessionData.user.preferences || {}),
      language: this.selectedLanguage
    };
    this.userSessionData.user.preferences = preferences;
    this.appService.userSessionData.update(state => {
      if (!state) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...(state.user.preferences || {}),
            language: this.selectedLanguage
          }
        }
      };
    });
    this.updateUser();
  }

  getLocationDisplay(): string {
    return getTenantLocationDisplay(this.userSessionData.tenant);
  }

  updateUser() {
    const route = "update/current/user";
    this.userSessionData.user.username = this.editableUsername.trim() || this.userSessionData.user.username;
    const theme = this.getCurrentTheme();
    const preferences: Record<string, any> & {
      theme: 'dark-theme' | 'light-theme';
      profile_visible: boolean;
    } = {
      ...(this.userSessionData.user.preferences || {}),
      theme,
      profile_visible: this.isProfileVisible
    };
    if (this.hasLanguagePreference) {
      preferences['language'] = this.selectedLanguage;
    }
    else {
      delete preferences['language'];
    }
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
      next: () => void 0,
      error: (_err) => void 0,
    });
  }

  togglePasswordSection() {
    this.isPasswordSectionOpen = !this.isPasswordSectionOpen;
    if (!this.isPasswordSectionOpen) {
      this.resetPasswordForm();
    }
  }

  onPasswordInput(password: string) {
    const evaluation = evaluatePasswordInput(password);
    this.showPasswordMeter = evaluation.showPasswordMeter;
    this.passwordChecks = evaluation.passwordChecks;
    this.currentUnmetCheck = evaluation.currentUnmetCheck;
    this.passwordStrength = evaluation.passwordStrength;
  }

  get allPasswordRequirementsMet(): boolean {
    return areAllPasswordRequirementsMet(this.passwordChecks);
  }

  updatePassword() {
    const userMeta: userMetaData = {
      username: this.userSessionData.user.username,
      password: this.newPassword
    };
    this.apiService.post<{ message?: string }>('update/current/user', userMeta).subscribe({
      next: () => {
        this.messageNotificationService.show('Password updated successfully', 'success');
        this.resetPasswordForm();
        this.isPasswordSectionOpen = false;
      },
      error: (err) => {
        this.messageNotificationService.show(err?.error?.detail || 'Failed to update password');
      }
    });
  }

  private resetPasswordForm() {
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordStrength = null;
    this.showPasswordMeter = false;
    this.passwordChecks = createEmptyPasswordChecks();
    this.currentUnmetCheck = null;
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
