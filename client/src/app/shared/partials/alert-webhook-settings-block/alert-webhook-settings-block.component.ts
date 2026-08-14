import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertWebhookSettingsForm } from './model/alert-webhook-settings.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-alert-webhook-settings-block',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  host: { class: 'block sm:col-span-2' },
  templateUrl: './alert-webhook-settings-block.component.html',
  styleUrls: ['./alert-webhook-settings-block.component.scss']
})
export class AlertWebhookSettingsBlockComponent {
  @Input({ required: true }) form!: AlertWebhookSettingsForm;
  @Input({ required: true }) isEditing!: boolean;
  @Input() context: 'system' | 'tenant' = 'system';
  @Input() isAdmin = false;
  @Input() errorState = false;

  @Output() edit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  get slackRedirectUri(): string {
    return `${window.location.origin}/api/alert-connectors/slack/callback`;
  }

  get jiraRedirectUri(): string {
    return `${window.location.origin}/api/alert-connectors/jira/callback`;
  }

  get isSystemContext(): boolean {
    return this.context === 'system';
  }

  get isTenantContext(): boolean {
    return this.context === 'tenant';
  }
}
