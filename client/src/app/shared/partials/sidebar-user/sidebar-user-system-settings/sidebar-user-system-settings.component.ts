import { Component, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { UserImagePickerComponent } from "../sidebar-user-settings/user-image-picker/user-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { ConfigSettings } from '../../../model/app/config';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
@Component({
  selector: 'app-sidebar-user-system-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './sidebar-user-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent implements OnInit {
  isEditing = false;
  systemData = { ai_endpoint: '', language_allowed: '', version: '', api_allowed: '0', app_name: '0' };
  form = { language: '', version: '', api_allowed: '0', app_name: '0', ai_endpoint: '', };
  languageOptions = [ 'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'bn', 'tr', 'nl', 'sv', 'pl', 'cs' ];

  constructor(private apiService: ApiService, protected appService: AppService, protected authService: AuthService) {
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const settings = this.appService.configData()?.appSettings;
    if (!settings) {
      return;
    }
    this.systemData = settings as typeof this.systemData;
    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.api_allowed = settings.api_allowed;
    this.form.app_name = settings.app_name;
    this.form.ai_endpoint = settings.ai_endpoint;
  }

  toggleEdit() {
    if (this.isEditing) {
      this.save();
    }
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.form.language = this.systemData.language_allowed;
    this.form.version = this.systemData.version;
    this.form.api_allowed = this.systemData.api_allowed;
    this.form.app_name = this.systemData.app_name;
    this.form.ai_endpoint = this.systemData.ai_endpoint;
    this.isEditing = false;
  }

  updateUserResource(file: File, key: 'logo_url' | 'logo_wide_light' | 'logo_wide_dark' = 'logo_url') {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.put<any>(`system/image?key=${key}`, formData).subscribe(res => {
      if (res?.logo_url) {
        (this.appService.getConfig().appSettings as any).logo_url = res.logo_url;
      }
      if (res?.logo_wide_light) {
        (this.appService.getConfig().appSettings as any).logo_wide_light = res.logo_wide_light;
      }
      if (res?.logo_wide_dark) {
        (this.appService.getConfig().appSettings as any).logo_wide_dark = res.logo_wide_dark;
      }
      if ((this.appService.getConfig().appSettings as any).logo_url) {
        this.appService.updateFavicon((this.appService.getConfig().appSettings as any).logo_url);
      }
    });
  }

  deleteUserResource(key: 'logo_url' | 'logo_wide_light' | 'logo_wide_dark' = 'logo_url') {
    return this.apiService.delete<any>(`system/image?key=${key}`).subscribe(() => {
      const fallback = key === 'logo_url'
        ? '/api/s/static/system/logo_url_default.png'
        : key === 'logo_wide_light'
          ? '/api/s/static/system/logo_wide_light_default.png'
          : '/api/s/static/system/logo_wide_dark_default.png';
      (this.appService.getConfig().appSettings as any)[key] = fallback;
      if (key === 'logo_url') {
        this.appService.updateFavicon(fallback);
      }
    });
  }

  save() {
    this.apiService.post<any>('public/update', { settings: this.form }).subscribe({
      next: (response) => {
        if (response?.settings) {
          const current = this.appService.configData();
          this.appService.configData.set(new ConfigSettings(response.settings, current.localSettings));
          const s = this.appService.configData()?.appSettings;
          if (s) {
            this.systemData = {
              ai_endpoint: s.ai_endpoint,
              language_allowed: s.language_allowed,
              version: s.version,
              api_allowed: s.api_allowed,
              app_name: s.app_name
            };
            document.title = s.app_name;
          }
        }
      },
      error: () => {}
    });
  }

  get displayVersion(): string {
    return (this.systemData.version || '').replaceAll('_', '.');
  }
}
