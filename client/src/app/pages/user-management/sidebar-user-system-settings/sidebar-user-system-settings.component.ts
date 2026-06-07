import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { FormsModule } from '@angular/forms';
import { UserImagePickerComponent } from "../sidebar-user-settings/user-image-picker/user-image-picker.component";
import { AppService } from '../../../services/core/app/app.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { ConfigSettings } from '../../../shared/model/app/config';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { SmtpSettingsBlockComponent } from '../../../shared/components/smtp-settings-block/smtp-settings-block.component';

const DEFAULT_APP_NAME = 'Orion Intelligence';

@Component({
  selector: 'app-sidebar-user-system-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent, SmtpSettingsBlockComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './sidebar-user-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent implements OnInit {
  isEditing = false;
  configurationError = '';
  mailErrorState = false;
  systemData = { ai_endpoint_enabled: true, language_allowed: '', version: '', app_name: '0', s_onion: '' };
  form = { language: '', version: '', app_name: '0', ai_endpoint_enabled: true, s_onion: '', data_sources_url: '', adversaries_url: '', pricing_url: '', documentation_allowed: false, whistle_blowing_allowed: false, accounts_mail_password: '', accounts_mail: '', accounts_smtp_server: '', accounts_smtp_port: '' };
  languageOptions = [ 'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'bn', 'tr', 'nl', 'sv', 'pl', 'cs' ];
  onionPattern = /^(https?:\/\/)?[a-z2-7]{56}\.onion\/?$/i;
  urlPattern = /^https?:\/\/.+/i;
  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  smtpServerPattern = /^(?=.{1,253}$)(localhost|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}|(\d{1,3}\.){3}\d{1,3})$/;

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
    this.systemData = {
      ...(settings as typeof this.systemData),
      app_name: settings.app_name?.trim() || DEFAULT_APP_NAME
    };
    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.app_name = settings.app_name?.trim() || DEFAULT_APP_NAME;
    this.form.ai_endpoint_enabled = settings.ai_endpoint_enabled;
    this.form.s_onion = settings.s_onion;
    this.form.data_sources_url = typeof metaInfo['S_HOME_HEADER_DATA_SOURCES'] === 'string' ? metaInfo['S_HOME_HEADER_DATA_SOURCES'] : '';
    this.form.adversaries_url = typeof metaInfo['S_HOME_HEADER_ADVERSARIES'] === 'string' ? metaInfo['S_HOME_HEADER_ADVERSARIES'] : '';
    this.form.pricing_url = typeof metaInfo['S_HOME_HEADER_PRICING'] === 'string' ? metaInfo['S_HOME_HEADER_PRICING'] : '';
    this.form.documentation_allowed = metaInfo['S_HOME_HEADER_PRICING_ALLOWED'] === true;
    this.form.whistle_blowing_allowed = metaInfo['S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED'] === true;
    this.form.accounts_mail_password = typeof metaInfo['ACCOUNTS_MAIL_PASSWORD'] === 'string' ? metaInfo['ACCOUNTS_MAIL_PASSWORD'] : '';
    this.form.accounts_mail = typeof metaInfo['ACCOUNTS_MAIL'] === 'string' ? metaInfo['ACCOUNTS_MAIL'] : '';
    this.form.accounts_smtp_server = typeof metaInfo['ACCOUNTS_SMTP_SERVER'] === 'string' ? metaInfo['ACCOUNTS_SMTP_SERVER'] : '';
    this.form.accounts_smtp_port = typeof metaInfo['ACCOUNTS_SMTP_PORT'] === 'string' ? metaInfo['ACCOUNTS_SMTP_PORT'] : '';
    this.configurationError = '';
    this.mailErrorState = false;
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
    this.configurationError = '';
    this.mailErrorState = false;
    const requiredFields = [
      { key: 'app_name', label: 'App Name' },
      { key: 'language', label: 'Language' },
      { key: 'data_sources_url', label: 'Data Sources URL' },
      { key: 'adversaries_url', label: 'Adversaries URL' },
      { key: 'pricing_url', label: 'Pricing URL' },
      { key: 'accounts_mail_password', label: 'Account Mail Password' },
      { key: 'accounts_mail', label: 'Account Mail' },
      { key: 'accounts_smtp_server', label: 'Account SMTP Server' },
      { key: 'accounts_smtp_port', label: 'Account SMTP Port' }
    ] as const;
    for (const field of requiredFields) {
      const value = this.form[field.key];
      if (typeof value !== 'string' || !value.trim()) {
        if (String(field.key).startsWith('accounts_')) {
          this.mailErrorState = true;
        }
        else {
          this.configurationError = `${field.label} is required`;
        }
        return;
      }
    }
    this.form.app_name = this.form.app_name.trim() || DEFAULT_APP_NAME;
    this.form.language = this.form.language.trim();
    this.form.s_onion = this.form.s_onion.trim();
    this.form.data_sources_url = this.form.data_sources_url.trim();
    this.form.adversaries_url = this.form.adversaries_url.trim();
    this.form.pricing_url = this.form.pricing_url.trim();
    this.form.accounts_mail_password = this.form.accounts_mail_password.trim();
    this.form.accounts_mail = this.form.accounts_mail.trim();
    this.form.accounts_smtp_server = this.form.accounts_smtp_server.trim();
    this.form.accounts_smtp_port = this.form.accounts_smtp_port.trim();
    if (this.form.s_onion && !this.onionPattern.test(this.form.s_onion)) {
      this.messageNotificationService.show('Invalid onion address');
      return;
    }
    if ((this.form.data_sources_url && !this.urlPattern.test(this.form.data_sources_url)) ||
      (this.form.adversaries_url && !this.urlPattern.test(this.form.adversaries_url)) ||
      (this.form.pricing_url && !this.urlPattern.test(this.form.pricing_url))) {
      this.configurationError = 'Data Sources URL, Adversaries URL, and Pricing URL must start with http:// or https://';
      return;
    }
    if (!this.emailPattern.test(this.form.accounts_mail)) {
      this.mailErrorState = true;
      return;
    }
    if (!this.smtpServerPattern.test(this.form.accounts_smtp_server)) {
      this.mailErrorState = true;
      return;
    }
    const smtpPort = Number(this.form.accounts_smtp_port);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      this.mailErrorState = true;
      return;
    }
    const settings = {
      language: this.form.language,
      version: this.form.version,
      app_name: this.form.app_name,
      ai_endpoint_enabled: this.form.ai_endpoint_enabled ? '1' : '0',
      s_onion: this.form.s_onion,
      meta_info: JSON.stringify({
        S_HOME_HEADER_DATA_SOURCES: this.form.data_sources_url,
        S_HOME_HEADER_ADVERSARIES: this.form.adversaries_url,
        S_HOME_HEADER_PRICING: this.form.pricing_url,
        S_HOME_HEADER_PRICING_ALLOWED: this.form.documentation_allowed,
        S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED: this.form.whistle_blowing_allowed,
        ACCOUNTS_MAIL_PASSWORD: this.form.accounts_mail_password,
        ACCOUNTS_MAIL: this.form.accounts_mail,
        ACCOUNTS_SMTP_SERVER: this.form.accounts_smtp_server,
        ACCOUNTS_SMTP_PORT: this.form.accounts_smtp_port
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
              ai_endpoint_enabled: s.ai_endpoint_enabled,
              language_allowed: s.language_allowed,
              version: s.version,
              app_name: s.app_name?.trim() || DEFAULT_APP_NAME,
              s_onion: s.s_onion
            };
            document.title = s.app_name?.trim() || DEFAULT_APP_NAME;
            this.loadSettings();
          }
        }
      },
      error: () => {
        this.mailErrorState = true;
      }
    });
  }

  get displayVersion(): string {
    return (this.systemData.version || '').replaceAll('_', '.');
  }
}
