import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class SmtpSettingsBlockComponent implements OnChanges {
  private apiService = inject(ApiService);
  private hostElement = inject(ElementRef<HTMLElement>);

  isVerifyingMail = false;
  mailConfigurationStatus = '';
  verifyError = false;

  @Input({ required: true }) form!: SmtpSettingsForm;
  @Input({ required: true }) isEditing!: boolean;
  @Input() errorState = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['errorState']?.currentValue) {
      this.scrollToError();
    }
  }

  verifyMailConfiguration() {
    if (this.isVerifyingMail) {
      return;
    }
    this.isVerifyingMail = true;
    this.mailConfigurationStatus = '';
    this.verifyError = false;
    this.apiService.post<any>('system/mail/verify', {}).subscribe({
      next: () => {
        this.mailConfigurationStatus = 'working';
        this.isVerifyingMail = false;
      },
      error: () => {
        this.mailConfigurationStatus = 'not working';
        this.verifyError = true;
        this.isVerifyingMail = false;
        this.scrollToError();
      }
    });
  }

  private scrollToError(): void {
    setTimeout(() => {
      this.hostElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
