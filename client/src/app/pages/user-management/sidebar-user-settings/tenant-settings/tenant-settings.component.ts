import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api.service';
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { userSessionData } from '../../../../shared/model/company-profile/node.model';
import { UserImagePickerComponent } from '../user-image-picker/user-image-picker.component';
import { TenantModel } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { getTenantLocationDisplay, toggleEditState } from '../sidebar-settings.util';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { AlertWebhookSettingsBlockComponent } from '../../../../shared/partials/alert-webhook-settings-block/alert-webhook-settings-block.component';
import { AlertConnectorSettingsResponse, AlertWebhookSettingsForm } from '../../../../shared/partials/alert-webhook-settings-block/model/alert-webhook-settings.model';
import { SmtpSettingsBlockComponent } from '../../../../shared/partials/smtp-settings-block/smtp-settings-block.component';
import { SmtpSettingsForm } from '../../../../shared/partials/smtp-settings-block/model/smtp-settings.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tenant-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent, SmtpSettingsBlockComponent, AlertWebhookSettingsBlockComponent, TranslatePipe],
  animations: [fadeInDashboardItem],
  templateUrl: './tenant-settings.component.html'
})
export class TenantSettingsComponent implements OnInit {
  isAccountSectionOpen = true;
  isEditing = false;
  contactEditing = false;
  privacyEditing = false;
  mailErrorState = false;
  webhookErrorState = false;
  userSessionData: userSessionData;
  userId: string = '';
  mailForm: SmtpSettingsForm = { accounts_mail_password: '', accounts_mail: '', accounts_smtp_server: '', accounts_smtp_port: '' };
  webhookForm: AlertWebhookSettingsForm = this.createWebhookForm();

  constructor(protected apiService: ApiService, protected appService: AppService, protected authService: AuthService, protected licenseService: LicenseService, private messageNotificationService: MessageNotificationService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    this.userId = this.userSessionData?.user.preferences?.["userId"];
    this.mailForm = {
      accounts_mail_password: this.userSessionData.tenant.accountsMailPassword || '',
      accounts_mail: this.userSessionData.tenant.accountsMail || '',
      accounts_smtp_server: this.userSessionData.tenant.accountsSmtpServer || '',
      accounts_smtp_port: this.userSessionData.tenant.accountsSmtpPort || '',
    };
    this.loadAlertConnectorSettings();
  }

  isMember(): boolean {
    return this.appService.userSessionData().user.role == 'member';
  }

  toggleSection(section: string) {
    if (section === 'profile') {
      this.isAccountSectionOpen = !this.isAccountSectionOpen;
    }
  }

  toggleEdit(event: Event) {
    this.isEditing = toggleEditState(event, this.isEditing, () => {
      this.updateUser(true);
    });
  }

  toggleContactEdit(event: Event) {
    this.contactEditing = toggleEditState(event, this.contactEditing, () => {
      this.updateUser();
    });
  }

  togglePrivacyEdit(event: Event) {
    this.privacyEditing = toggleEditState(event, this.privacyEditing, () => {
      this.updateUser();
    });
  }

  saveMailSettings() {
    this.updateUser(true);
    this.isEditing = false;
  }

  getLocationDisplay(): string {
    return getTenantLocationDisplay(this.userSessionData.tenant);
  }

  normalizedAlertRunTime(): string | null {
    const value = (this.userSessionData.tenant.alertRunTime || '').trim();
    return value || null;
  }

  getAlertRunTimeDisplay(): string {
    return this.normalizedAlertRunTime() || 'Use default schedule';
  }

  openAlertRunTimePicker(input: HTMLInputElement): void {
    if (!this.privacyEditing || input.disabled) {
      return;
    }
    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  updateUser(includeMailSettings = false) {
    let route = "update/tenants";
    if (includeMailSettings) {
      this.mailErrorState = false;
    }
    const tenantData = {
      id: '',
      name: this.userSessionData.tenant.name,
      phone: this.userSessionData.tenant.phone,
      country: this.userSessionData.tenant.country,
      city: this.userSessionData.tenant.city,
      postal_code: this.userSessionData.tenant.postalCode,
      profile_visibility_enabled: this.userSessionData.tenant.profileVisibilityEnabled,
      event_management_enabled: this.userSessionData.tenant.eventManagementEnabled === true,
      alerts_visible_to_admin: this.userSessionData.tenant.alertsVisibleToAdmin !== false,
      alert_run_time: this.normalizedAlertRunTime(),
    } as TenantModel;
    if (includeMailSettings) {
      tenantData.accounts_mail_password = this.mailForm.accounts_mail_password;
      tenantData.accounts_mail = this.mailForm.accounts_mail;
      tenantData.accounts_smtp_server = this.mailForm.accounts_smtp_server;
      tenantData.accounts_smtp_port = this.mailForm.accounts_smtp_port;
    }
    this.apiService.post(route, tenantData).subscribe({
      error: () => {
        if (includeMailSettings) {
          this.mailErrorState = true;
        }
      }
    });
  }

  cancelEdit(event?: Event) {
    event?.stopPropagation();
    this.isEditing = false;
  }

  cancelContactEdit(event: Event) {
    event.stopPropagation();
    this.contactEditing = false;
  }

  cancelPrivacyEdit(event: Event) {
    event.stopPropagation();
    this.privacyEditing = false;
  }

  updateUserResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.put<any>('tenant/image', formData).subscribe({
      next: (res) => {
        if (res?.image) {
          this.appService.userSessionData().tenant.image =
                      `/api/s/static/tenant/${res.image}`;
        }
      },
      error: (err) => {
        const message = err?.error?.detail || 'Failed to upload image';
        this.messageNotificationService.show(message);
      }
    });
  }

  deleteUserResource() {
    return this.apiService.delete<any>('tenant/image').subscribe(() => {
      this.appService.userSessionData().tenant.image =
                'assets/images/tenant/default.png';
    });
  }

  private loadAlertConnectorSettings() {
    this.apiService.get<AlertConnectorSettingsResponse>('alert-connectors/settings').subscribe({
      next: (response) => this.applyAlertConnectorSettings(response),
      error: () => {
        this.webhookErrorState = true;
      }
    });
  }

  private applyAlertConnectorSettings(response: AlertConnectorSettingsResponse) {
    this.webhookForm = {
      slack_client_id: response?.app?.slack_client_id || '',
      slack_client_secret: '',
      slack_configured: response?.app?.slack_configured === true,
      jira_client_id: response?.app?.jira_client_id || '',
      jira_client_secret: '',
      jira_configured: response?.app?.jira_configured === true,
      alert_slack_connected: response?.tenant?.slack_connected === true,
      alert_slack_channel: response?.tenant?.slack_channel || '',
      alert_slack_team: response?.tenant?.slack_team || '',
      alert_jira_connected: response?.tenant?.jira_connected === true,
      alert_jira_site_url: response?.tenant?.jira_site_url || '',
      alert_jira_site_name: response?.tenant?.jira_site_name || ''
    };
    this.webhookErrorState = false;
  }

  private createWebhookForm(): AlertWebhookSettingsForm {
    return {
      slack_client_id: '',
      slack_client_secret: '',
      slack_configured: false,
      jira_client_id: '',
      jira_client_secret: '',
      jira_configured: false,
      alert_slack_connected: false,
      alert_slack_channel: '',
      alert_slack_team: '',
      alert_jira_connected: false,
      alert_jira_site_url: '',
      alert_jira_site_name: ''
    };
  }
}
