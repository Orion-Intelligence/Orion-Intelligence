import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordToggleDirective } from '../../directives/password-toggle.directive';

export interface SmtpSettingsForm {
  accounts_mail_password: string;
  accounts_mail: string;
  accounts_smtp_server: string;
  accounts_smtp_port: string;
}

@Component({
  selector: 'app-smtp-settings-block',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordToggleDirective],
  host: { class: 'block sm:col-span-2' },
  templateUrl: './smtp-settings-block.component.html'
})
export class SmtpSettingsBlockComponent {
  @Input({ required: true }) form!: SmtpSettingsForm;
  @Input({ required: true }) isEditing!: boolean;
  @Input({ required: true }) description!: string;
  @Input() showVerify = false;
  @Input() isVerifying = false;
  @Input() status = '';
  @Input() error = '';

  @Output() verify = new EventEmitter<void>();
}
