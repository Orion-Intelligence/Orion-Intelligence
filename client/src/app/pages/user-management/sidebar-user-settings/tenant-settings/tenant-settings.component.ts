import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api.service';
import { AppService } from '../../../../services/core/app/app.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { userSessionData } from '../../../../shared/model/company-profile/node.model';
import { UserImagePickerComponent } from '../user-image-picker/user-image-picker.component';
import { TenantModel } from '../../../../shared/model/tenant/tenant.model';
import { getTenantLocationDisplay } from '../sidebar-settings.util';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { AlertWebhookSettingsBlockComponent } from '../../../../shared/partials/alert-webhook-settings-block/alert-webhook-settings-block.component';
import { AlertConnectorSettingsResponse, AlertWebhookSettingsForm } from '../../../../shared/partials/alert-webhook-settings-block/model/alert-webhook-settings.model';
import { createWebhookForm, mapAlertConnectorSettings } from '../../../../shared/partials/alert-webhook-settings-block/alert-webhook-settings.util';
import { SmtpSettingsBlockComponent } from '../../../../shared/partials/smtp-settings-block/smtp-settings-block.component';
import { SmtpSettingsForm } from '../../../../shared/partials/smtp-settings-block/model/smtp-settings.model';
import { TimePickerComponent } from '../../../../shared/partials/filters/time-picker/time-picker.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';
import { notifyUploadImageError, uploadImageResource } from '../../settings-resource.util';

@Component({
  selector: 'app-tenant-settings',
  imports: [FormsModule, CommonModule, UserImagePickerComponent, SmtpSettingsBlockComponent, AlertWebhookSettingsBlockComponent, TimePickerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './tenant-settings.component.html',
  styleUrls: ['./tenant-settings.component.css']
})
export class TenantSettingsComponent implements OnInit {
  private contactSnapshot = '';
  private privacySnapshot = '';
  private mailSnapshot = '';
  private webhookSnapshot = '';

  isAccountSectionOpen = true;
  mailErrorState = false;
  webhookErrorState = false;
  userSessionData: userSessionData;
  userId = '';
  mailForm: SmtpSettingsForm = { accounts_mail_password: '', accounts_mail: '', accounts_smtp_server: '', accounts_smtp_port: '' };
  webhookForm: AlertWebhookSettingsForm = createWebhookForm();

  constructor(protected apiService: ApiService, protected appService: AppService, protected licenseService: LicenseService, private messageNotificationService: MessageNotificationService, private translationService: TranslationService) {
    this.userSessionData = this.appService.userSessionData();
  }

  ngOnInit(): void {
    const userId = this.userSessionData?.user.preferences?.userId;
    this.userId = typeof userId === 'string' ? userId : '';
    this.mailForm = {
      accounts_mail_password: this.userSessionData.tenant.accountsMailPassword ?? '',
      accounts_mail: this.userSessionData.tenant.accountsMail ?? '',
      accounts_smtp_server: this.userSessionData.tenant.accountsSmtpServer ?? '',
      accounts_smtp_port: this.userSessionData.tenant.accountsSmtpPort ?? '',
    };
    this.captureEditableSettings();
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

  isContactDirty(): boolean {
    return this.contactState() !== this.contactSnapshot;
  }

  isPrivacyDirty(): boolean {
    return this.privacyState() !== this.privacySnapshot;
  }

  isMailDirty(): boolean {
    return this.mailState() !== this.mailSnapshot;
  }

  isWebhookDirty(): boolean {
    return this.webhookState() !== this.webhookSnapshot;
  }

  saveWebhookSettings(): void {
    if (!this.isWebhookDirty()) {
      return;
    }
    const payload = {
      slack_client_id: this.webhookForm.slack_client_id,
      slack_client_secret: this.webhookForm.slack_client_secret,
      jira_client_id: this.webhookForm.jira_client_id,
      jira_client_secret: this.webhookForm.jira_client_secret
    };
    this.apiService.post<AlertConnectorSettingsResponse>('alert-connectors/settings', payload).subscribe({
      next: (response) => {
        this.applyAlertConnectorSettings(response);
      },
      error: () => {
        this.webhookErrorState = true;
      }
    });
  }

  saveContactSettings(): void {
    if (this.isContactDirty()) {
      this.updateUser();
    }
  }

  savePrivacySettings(): void {
    if (this.isPrivacyDirty()) {
      this.updateUser();
    }
  }

  saveMailSettings(): void {
    if (this.isMailDirty()) {
      this.updateUser(true);
    }
  }

  getLocationDisplay(): string {
    return getTenantLocationDisplay(this.userSessionData.tenant);
  }

  normalizedAlertRunTime(): string | null {
    const value = (this.userSessionData.tenant.alertRunTime ?? '').trim();
    return value || null;
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
      next: () => {
        this.contactSnapshot = this.contactState();
        this.privacySnapshot = this.privacyState();
        if (includeMailSettings) {
          this.mailSnapshot = this.mailState();
        }
      },
      error: () => {
        if (includeMailSettings) {
          this.mailErrorState = true;
        }
      }
    });
  }

  updateUserResource(file: File) {
    return uploadImageResource(this.apiService, 'tenant/image', file).subscribe({
      next: (res) => {
        if (res?.image) {
          this.appService.userSessionData().tenant.image =
                        `/api/s/static/tenant/${res.image}`;
        }
      },
      error: (err) => {
        notifyUploadImageError(err, this.messageNotificationService, this.translationService); 
      }
    });
  }

  deleteUserResource() {
    return this.apiService.delete<unknown>('tenant/image').subscribe(() => {
      this.appService.userSessionData().tenant.image =
                'assets/images/tenant/default.png';
    });
  }

  private loadAlertConnectorSettings() {
    this.apiService.get<AlertConnectorSettingsResponse>('alert-connectors/settings').subscribe({
      next: (response) => {
        this.applyAlertConnectorSettings(response);
      },
      error: () => {
        this.webhookErrorState = true;
      }
    });
  }

  private applyAlertConnectorSettings(response: AlertConnectorSettingsResponse) {
    this.webhookForm = mapAlertConnectorSettings(response);
    this.webhookErrorState = false;
    this.webhookSnapshot = this.webhookState();
  }

  private webhookState(): string {
    return JSON.stringify([
      this.webhookForm.slack_client_id,
      this.webhookForm.slack_client_secret,
      this.webhookForm.jira_client_id,
      this.webhookForm.jira_client_secret
    ]);
  }

  private captureEditableSettings(): void {
    this.contactSnapshot = this.contactState();
    this.privacySnapshot = this.privacyState();
    this.mailSnapshot = this.mailState();
  }

  private contactState(): string {
    return JSON.stringify([
      this.userSessionData.tenant.phone || '',
      this.userSessionData.tenant.country || '',
      this.userSessionData.tenant.city || ''
    ]);
  }

  private privacyState(): string {
    return JSON.stringify([
      this.normalizedAlertRunTime(),
      this.userSessionData.tenant.profileVisibilityEnabled !== false,
      this.userSessionData.tenant.eventManagementEnabled === true,
      this.userSessionData.tenant.alertsVisibleToAdmin !== false
    ]);
  }

  private mailState(): string {
    return JSON.stringify([
      this.mailForm.accounts_mail,
      this.mailForm.accounts_mail_password,
      this.mailForm.accounts_smtp_server,
      this.mailForm.accounts_smtp_port
    ]);
  }
}
