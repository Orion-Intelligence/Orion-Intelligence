import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { UserImagePickerComponent } from "../sidebar-user-settings/user-image-picker/user-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { ConfigSettings } from '../../../model/app/config';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
@Component({
  selector: 'app-sidebar-user-system-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './sidebar-user-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent implements OnInit {
  isEditing = false;
  formError = '';
  systemData = { ai_endpoint: '', language_allowed: '', version: '', api_allowed: '0', app_name: '0', s_onion: '' };
  form = { language: '', version: '', api_allowed: '0', app_name: '0', ai_endpoint: '', s_onion: '', data_sources_url: '', adversaries_url: '', pricing_url: '', documentation_allowed: false, whistle_blowing_allowed: false };
  languageOptions = [ 'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'bn', 'tr', 'nl', 'sv', 'pl', 'cs' ];
  onionPattern = /^(https?:\/\/)?[a-z2-7]{56}\.onion\/?$/i;
  urlPattern = /^https?:\/\/.+/i;

  constructor(private apiService: ApiService, protected appService: AppService, protected authService: AuthService,private messageNotificationService: MessageNotificationService) {
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const settings = this.appService.configData()?.appSettings;
    if (!settings) {
      return;
    }
    let metaInfo: Record<string, string | boolean> = {};
    try {
      metaInfo = settings.meta_info ? JSON.parse(settings.meta_info) : {};
    }
    catch {
      metaInfo = {};
    }
    this.systemData = settings as typeof this.systemData;
    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.api_allowed = settings.api_allowed;
    this.form.app_name = settings.app_name;
    this.form.ai_endpoint = settings.ai_endpoint;
    this.form.s_onion = settings.s_onion;
    this.form.data_sources_url = typeof metaInfo['S_HOME_HEADER_DATA_SOURCES'] === 'string' ? metaInfo['S_HOME_HEADER_DATA_SOURCES'] : '';
    this.form.adversaries_url = typeof metaInfo['S_HOME_HEADER_ADVERSARIES'] === 'string' ? metaInfo['S_HOME_HEADER_ADVERSARIES'] : '';
    this.form.pricing_url = typeof metaInfo['S_HOME_HEADER_PRICING'] === 'string' ? metaInfo['S_HOME_HEADER_PRICING'] : '';
    this.form.documentation_allowed = metaInfo['S_HOME_HEADER_PRICING_ALLOWED'] === true;
    this.form.whistle_blowing_allowed = metaInfo['S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED'] === true;
    this.formError = '';
  }

  toggleEdit() {
    if (this.isEditing) {
      this.save();
    }
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.loadSettings();
    this.isEditing = false;
  }

  updateUserResource(file: File,key: 'auth_dashboard_icon' | 'logo_url' | 'logo_wide_light' | 'logo_wide_dark' = 'logo_url') {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService
      .put<any>(`system/image?key=${key}`, formData)
      .subscribe({
        next: (res) => {
          if (res?.logo_url) {
            (this.appService.getConfig().appSettings as any).logo_url = res.logo_url;
          }
          if (res?.logo_wide_light) {
            (this.appService.getConfig().appSettings as any).logo_wide_light = res.logo_wide_light;
          }
          if (res?.logo_wide_dark) {
            (this.appService.getConfig().appSettings as any).logo_wide_dark = res.logo_wide_dark;
          }
          if(res?.auth_dashboard_icon){
            (this.appService.getConfig().appSettings as any).auth_dashboard_icon = res.auth_dashboard_icon;
          }
          if ((this.appService.getConfig().appSettings as any).logo_url) {
            this.appService.updateFavicon((this.appService.getConfig().appSettings as any).logo_url);
          }
        },
        error: (err) => {
          const message = err?.error?.detail || 'Failed to upload image';
          this.messageNotificationService.show(message);
        }
      });
  }

  deleteUserResource(key: 'auth_dashboard_icon' | 'logo_url' | 'logo_wide_light' | 'logo_wide_dark' = 'logo_url') {
    return this.apiService.delete<any>(`system/image?key=${key}`).subscribe(() => {
      const fallbackMap: Record<string, string> = {
        logo_url: '/api/s/static/system/logo_url_default.png',
        logo_wide_light: '/api/s/static/system/logo_wide_light_default.png',
        logo_wide_dark: '/api/s/static/system/logo_wide_dark_default.png',
        login_page_image: '/api/s/static/system/auth_dashboard_icon_default.png'
      };
      const fallback = fallbackMap[key];
      (this.appService.getConfig().appSettings as any)[key] = fallback;
      if (key === 'logo_url') {
        this.appService.updateFavicon(fallback);
      }
    });
  }

  save() {
    this.formError = '';
    if (this.form.s_onion && !this.onionPattern.test(this.form.s_onion)) {
      this.messageNotificationService.show('Invalid onion address');
      return;
    }
    if ((this.form.data_sources_url && !this.urlPattern.test(this.form.data_sources_url)) ||
      (this.form.adversaries_url && !this.urlPattern.test(this.form.adversaries_url)) ||
      (this.form.pricing_url && !this.urlPattern.test(this.form.pricing_url))) {
      this.formError = 'Data Sources URL, Adversaries URL, and Pricing URL must start with http:// or https://';
      return;
    }
    const settings = {
      language: this.form.language,
      version: this.form.version,
      api_allowed: this.form.api_allowed,
      app_name: this.form.app_name,
      ai_endpoint: this.form.ai_endpoint,
      s_onion: this.form.s_onion,
      meta_info: JSON.stringify({
        S_HOME_HEADER_DATA_SOURCES: this.form.data_sources_url,
        S_HOME_HEADER_ADVERSARIES: this.form.adversaries_url,
        S_HOME_HEADER_PRICING: this.form.pricing_url,
        S_HOME_HEADER_PRICING_ALLOWED: this.form.documentation_allowed,
        S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED: this.form.whistle_blowing_allowed
      })
    };
    this.apiService.post<any>('public/update', { settings }).subscribe({
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
              app_name: s.app_name,
              s_onion: s.s_onion
            };
            document.title = s.app_name;
            this.loadSettings();
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
