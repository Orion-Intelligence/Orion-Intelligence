import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../services/core/app/app.service';
import { AppSettingsModel, ConfigSettings } from '../../../shared/model/app/config';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { SmtpSettingsBlockComponent } from '../../../shared/components/smtp-settings-block/smtp-settings-block.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LANGUAGE_OPTIONS, LanguageOption } from '../../../shared/constants/shared-enums';
import { ActivatedRoute } from '@angular/router';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { TenantBrandingSettingsComponent } from './tenant-branding-settings/tenant-branding-settings.component';

const DEFAULT_APP_NAME = 'Orion Intelligence';
type SystemSettingsTab = 'branding' | 'platform';
type SystemSettingsSection = 'configuration' | 'mail';

@Component({
  selector: 'app-sidebar-user-system-settings',
  imports: [FormsModule, CommonModule, SmtpSettingsBlockComponent, TranslatePipe, TenantBrandingSettingsComponent],
  animations: [fadeInDashboardItem],
  templateUrl: './sidebar-user-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent implements OnInit {
  activeTab: SystemSettingsTab = 'branding';
  configurationEditing = false;
  mailEditing = false;
  configurationError = '';
  mailErrorState = false;
  form = { language: '', version: '', app_name: '0', ai_endpoint_enabled: true, admin_root_allowed: false, s_onion: '', data_sources_url: '', adversaries_url: '', pricing_url: '', documentation_allowed: false, whistle_blowing_allowed: false, accounts_mail_password: '', accounts_mail: '', accounts_smtp_server: '', accounts_smtp_port: '' };
  languageOptions: LanguageOption[] = LANGUAGE_OPTIONS;
  onionPattern = /^(https?:\/\/)?[a-z2-7]{56}\.onion\/?$/i;
  urlPattern = /^https?:\/\/.+/i;
  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  smtpServerPattern = /^(?=.{1,253}$)(localhost|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}|(\d{1,3}\.){3}\d{1,3})$/;

  constructor(private apiService: ApiService, private route: ActivatedRoute, protected appService: AppService, private licenseService: LicenseService, private messageNotificationService: MessageNotificationService) {
  }

  ngOnInit(): void {
    this.activeTab = this.getInitialTab();
    this.loadSettings();
  }

  canEditTenantBranding(): boolean {
    const role = this.appService.userSessionData().user.role;
    return role === 'admin' || (role === 'member' && this.licenseService.isMaintainer());
  }

  canManagePlatformSettings(): boolean {
    return this.appService.userSessionData().user.role === 'admin';
  }

  selectTab(tab: SystemSettingsTab): void {
    if ((tab === 'branding' && !this.canEditTenantBranding()) ||
      (tab === 'platform' && !this.canManagePlatformSettings())) {
      return;
    }
    this.activeTab = tab;
    this.configurationEditing = false;
    this.mailEditing = false;
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
    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.app_name = settings.app_name?.trim() || DEFAULT_APP_NAME;
    this.form.ai_endpoint_enabled = settings.ai_endpoint_enabled;
    this.form.admin_root_allowed = settings.admin_root_allowed;
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

  toggleConfigurationEdit() {
    if (this.configurationEditing) {
      if (this.save('configuration')) {
        this.configurationEditing = false;
      }
      return;
    }
    this.mailEditing = false;
    this.configurationEditing = true;
  }

  cancelConfigurationEdit() {
    this.loadSettings();
    this.configurationEditing = false;
  }

  toggleMailEdit() {
    if (this.mailEditing) {
      if (this.save('mail')) {
        this.mailEditing = false;
      }
      return;
    }
    this.configurationEditing = false;
    this.mailEditing = true;
  }

  cancelMailEdit() {
    this.loadSettings();
    this.mailEditing = false;
  }

  save(section: SystemSettingsSection): boolean {
    if (section === 'configuration') {
      this.configurationError = '';
    }
    else {
      this.mailErrorState = false;
    }
    const configurationFields = [
      { key: 'app_name', label: 'App Name' },
      { key: 'language', label: 'Language' },
      { key: 'data_sources_url', label: 'Data Sources URL' },
      { key: 'adversaries_url', label: 'Adversaries URL' },
      { key: 'pricing_url', label: 'Pricing URL' }
    ] as const;
    const mailFields = [
      { key: 'accounts_mail_password', label: 'Account Mail Password' },
      { key: 'accounts_mail', label: 'Account Mail' },
      { key: 'accounts_smtp_server', label: 'Account SMTP Server' },
      { key: 'accounts_smtp_port', label: 'Account SMTP Port' }
    ] as const;
    const requiredFields = section === 'configuration'
      ? configurationFields
      : mailFields;
    for (const field of requiredFields) {
      const value = this.form[field.key];
      if (typeof value !== 'string' || !value.trim()) {
        if (section === 'mail') {
          this.mailErrorState = true;
        }
        else {
          this.configurationError = `${field.label} is required`;
        }
        return false;
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
    if (section === 'configuration' && this.form.s_onion && !this.onionPattern.test(this.form.s_onion)) {
      this.messageNotificationService.show('Invalid onion address');
      return false;
    }
    if (section === 'configuration' && ((this.form.data_sources_url && !this.urlPattern.test(this.form.data_sources_url)) ||
      (this.form.adversaries_url && !this.urlPattern.test(this.form.adversaries_url)) ||
      (this.form.pricing_url && !this.urlPattern.test(this.form.pricing_url)))) {
      this.configurationError = 'Data Sources URL, Adversaries URL, and Pricing URL must start with http:// or https://';
      return false;
    }
    if (section === 'mail' && !this.emailPattern.test(this.form.accounts_mail)) {
      this.mailErrorState = true;
      return false;
    }
    if (section === 'mail' && !this.smtpServerPattern.test(this.form.accounts_smtp_server)) {
      this.mailErrorState = true;
      return false;
    }
    const smtpPort = Number(this.form.accounts_smtp_port);
    if (section === 'mail' && (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)) {
      this.mailErrorState = true;
      return false;
    }
    const settings: Record<string, string> = section === 'configuration'
      ? {
        language: this.form.language,
        app_name: this.form.app_name,
        ai_endpoint_enabled: this.form.ai_endpoint_enabled ? '1' : '0',
        admin_root_allowed: this.form.admin_root_allowed ? '1' : '0',
        s_onion: this.form.s_onion,
        meta_info: JSON.stringify(this.buildMetaInfo('configuration'))
      }
      : {
        meta_info: JSON.stringify(this.buildMetaInfo('mail'))
      };
    this.apiService.post<any>('public/update', { settings }).subscribe({
      next: (response) => {
        if (response?.settings) {
          this.applySettings(response.settings);
          const s = this.appService.configData()?.appSettings;
          if (s) {
            this.loadSettings();
          }
        }
      },
      error: () => {
        if (section === 'mail') {
          this.mailErrorState = true;
          this.mailEditing = true;
        }
        else {
          this.configurationError = 'Failed to save configuration';
          this.configurationEditing = true;
        }
      }
    });
    return true;
  }

  private buildMetaInfo(section: 'configuration' | 'mail'): Record<string, string | boolean> {
    const metaInfo: Record<string, string | boolean> = {};
    if (section === 'configuration') {
      metaInfo['S_HOME_HEADER_DATA_SOURCES'] = this.form.data_sources_url;
      metaInfo['S_HOME_HEADER_ADVERSARIES'] = this.form.adversaries_url;
      metaInfo['S_HOME_HEADER_PRICING'] = this.form.pricing_url;
      metaInfo['S_HOME_HEADER_PRICING_ALLOWED'] = this.form.documentation_allowed;
      metaInfo['S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED'] = this.form.whistle_blowing_allowed;
    }
    if (section === 'mail') {
      metaInfo['ACCOUNTS_MAIL_PASSWORD'] = this.form.accounts_mail_password;
      metaInfo['ACCOUNTS_MAIL'] = this.form.accounts_mail;
      metaInfo['ACCOUNTS_SMTP_SERVER'] = this.form.accounts_smtp_server;
      metaInfo['ACCOUNTS_SMTP_PORT'] = this.form.accounts_smtp_port;
    }
    return metaInfo;
  }

  get displayVersion(): string {
    return (this.form.version || '').replaceAll('_', '.');
  }

  private getInitialTab(): SystemSettingsTab {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'branding' && this.canEditTenantBranding()) {
      return 'branding';
    }
    return this.canManagePlatformSettings() ? 'platform' : 'branding';
  }

  private applySettings(settings: Partial<AppSettingsModel>): void {
    const current = this.appService.configData();
    const appSettings = { ...current.appSettings, ...settings };
    this.appService.configData.set(new ConfigSettings(appSettings, current.localSettings));
    const updated = this.appService.configData().appSettings;
    this.appService.updateFavicon(updated.logo_url);
    document.title = updated.app_name?.trim() || DEFAULT_APP_NAME;
  }
}
