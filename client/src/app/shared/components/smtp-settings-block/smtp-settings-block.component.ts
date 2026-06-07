import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordToggleDirective } from '../../directives/password-toggle.directive';
import { SmtpSettingsForm } from '../../model/smtp-settings/smtp-settings.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-smtp-settings-block',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordToggleDirective],
  host: { class: 'block sm:col-span-2' },
  templateUrl: './smtp-settings-block.component.html'
})
export class SmtpSettingsBlockComponent {
  private apiService = inject(ApiService);

  isVerifyingMail = false;
  mailConfigurationStatus = '';
  verifyError = '';

  @Input({ required: true }) form!: SmtpSettingsForm;
  @Input({ required: true }) isEditing!: boolean;
  @Input() error = '';

  verifyMailConfiguration() {
    if (this.isVerifyingMail) {
      return;
    }
    this.isVerifyingMail = true;
    this.mailConfigurationStatus = '';
    this.verifyError = '';
    this.apiService.post<any>('system/mail/verify', {}).subscribe({
      next: () => {
        this.mailConfigurationStatus = 'working';
        this.isVerifyingMail = false;
      },
      error: (err) => {
        this.mailConfigurationStatus = 'not working';
        this.verifyError = err?.error?.detail || 'Mail configuration is not working';
        this.isVerifyingMail = false;
      }
    });
  }
}
