import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api.service';
import { AppService } from '../../../../services/core/app/app.service';
import { AppSettingsModel } from '../../../../shared/model/app/config';
import { notifyUploadImageError } from '../../settings-resource.util';
import { applyAppSettings, DEFAULT_APP_NAME } from '../system-settings.util';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';
import { UserImagePickerComponent } from '../../sidebar-user-settings/user-image-picker/user-image-picker.component';
import { getOwnProperty, setOwnProperty } from '../../../../shared/utils/type-guards.util';


type SystemResourceKey = 'auth_dashboard_icon' | 'logo_url' | 'logo_wide_light' | 'logo_wide_dark';

const DEFAULT_SYSTEM_ASSETS: Record<SystemResourceKey, string> = {
  logo_url: '/api/s/static/system/logo_url_default.png',
  logo_wide_light: '/api/s/static/system/logo_wide_light_default.png',
  logo_wide_dark: '/api/s/static/system/logo_wide_dark_default.png',
  auth_dashboard_icon: '/api/s/static/system/auth_dashboard_icon_default.png'
};

@Component({
  selector: 'app-tenant-branding-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UserImagePickerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './tenant-branding-settings.component.html'
})
export class TenantBrandingSettingsComponent implements OnInit {
  private appNameSnapshot = '';

  brandingError = '';
  form = { app_name: '0' };

  constructor(private apiService: ApiService, protected appService: AppService, private messageNotificationService: MessageNotificationService, private translationService: TranslationService) {
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const settings = this.appService.configData()?.appSettings;
    if (!settings) {
      return;
    }
    this.form.app_name = settings.app_name?.trim() || DEFAULT_APP_NAME;
    this.brandingError = '';
    this.appNameSnapshot = this.form.app_name;
  }

  isBrandingDirty(): boolean {
    return this.form.app_name !== this.appNameSnapshot;
  }

  updateUserResource(file: File, key: SystemResourceKey = 'logo_url'): void {
    const formData = new FormData();
    formData.append('file', file);
    this.apiService
      .put<Record<string, unknown>>(`system/image?key=${key}`, formData)
      .subscribe({
        next: (res) => {
          const updatedAssets: Partial<AppSettingsModel> = {};
          for (const assetKey of Object.keys(DEFAULT_SYSTEM_ASSETS) as SystemResourceKey[]) {
            const assetValue = getOwnProperty(res, assetKey);
            if (typeof assetValue === 'string' && assetValue) {
              setOwnProperty(updatedAssets, assetKey, assetValue);
            }
          }
          this.applySettings(updatedAssets);
        },
        error: (err) => {
          notifyUploadImageError(err, this.messageNotificationService, this.translationService); 
        }
      });
  }

  deleteUserResource(key: SystemResourceKey = 'logo_url'): void {
    this.apiService.delete<unknown>(`system/image?key=${key}`).subscribe({
      next: () => {
        this.applySettings({ [key]: getOwnProperty(DEFAULT_SYSTEM_ASSETS, key) });
      },
      error: (err) => {
        const message = err?.error?.detail ?? this.translationService.translate('Failed to remove image');
        this.messageNotificationService.show(message);
      }
    });
  }

  save(): boolean {
    this.brandingError = '';
    if (!this.form.app_name.trim()) {
      this.brandingError = 'App Name is required';
      return false;
    }
    this.form.app_name = this.form.app_name.trim() || DEFAULT_APP_NAME;
    this.apiService.post<{ settings?: Partial<AppSettingsModel> }>('public/update', { settings: { app_name: this.form.app_name } }).subscribe({
      next: (response) => {
        if (response?.settings) {
          this.applySettings(response.settings);
          this.loadSettings();
        }
      },
      error: () => {
        this.brandingError = 'Failed to save tenant branding';
      }
    });
    return true;
  }

  private applySettings(settings: Partial<AppSettingsModel>): void {
    applyAppSettings(this.appService, settings);
  }
}
