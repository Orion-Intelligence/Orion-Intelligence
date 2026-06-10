import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { AiWorkspaceMessage } from '../../../../shared/model/chat/ai-workspace-message.model';
import { ResultRowHelperService } from '../../../../shared/services/result-row-helper.service';
import { ShareResponseDialogComponent } from '../../../../shared/partials/share-response-dialog/share-response-dialog.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-bot-message-actions',
  standalone: true,
  imports: [CommonModule, ShareResponseDialogComponent, TranslatePipe],
  templateUrl: './bot-message-actions.component.html',
})
export class BotMessageActionsComponent {
  protected readonly copied = signal(false);

  @Input({ required: true }) message!: AiWorkspaceMessage;

  constructor(private readonly resultRowHelper: ResultRowHelperService) {}

  copyMessage(event?: MouseEvent): void {
    event?.stopPropagation();
    const text = this.message.text.trim();
    if (!text) {
      return;
    }
    this.resultRowHelper.copyToClipboard(text).subscribe((ok) => {
      this.copied.set(ok);
      setTimeout(() => this.copied.set(false), 1200);
    });
  }
}
