import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { AppService } from '../../../services/core/app/app.service';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { ChatApiResponse } from '../../../shared/model/chat/chat-api-response.model';
import { AiWorkspaceMessage } from '../../../shared/model/chat/ai-workspace-message.model';
import { AiWorkspacePrompt } from '../../../shared/constants/shared-enums';

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './ai-workspace.component.html',
})
export class AiWorkspaceComponent {
  private readonly sessionId: string;
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  private readonly queryContext: string;

  protected readonly quickPrompts = Object.values(AiWorkspacePrompt);
  protected readonly isSending = signal(false);
  protected readonly contextQuery = computed(() => this.queryContext);

  messageDraft = '';
  messages: AiWorkspaceMessage[] = [];

  constructor(private readonly api: ApiService, appService: AppService, private readonly route: ActivatedRoute, private readonly subscriptionService: SubscriptionService) {
    this.sessionId = (appService.userSessionData()?.user.username || '').trim() || crypto.randomUUID();
    this.queryContext = (this.route.snapshot.queryParamMap.get('q') || '').trim();
  }

  sendMessage(): void {
    if (this.isSending()) {
      return;
    }

    const text = this.messageDraft.trim();
    if (!text) {
      return;
    }

    this.messages = [...this.messages, this.createMessage('user', text)];
    this.messageDraft = '';
    this.isSending.set(true);
    this.scrollToBottom();

    if (!this.subscriptionService.accountExpirable()) {
      this.messages = [...this.messages, this.createErrorMessage(text)];
      this.isSending.set(false);
      this.scrollToBottom();
      return;
    }

    this.api.post<ChatApiResponse>('nlp/chat/report', {
      session_id: this.sessionId,
      message: text,
      report: this.contextQuery() || undefined,
    }).subscribe({
      next: (response) => {
        const reply = (response?.result ?? response?.reply ?? response?.message ?? response?.text ?? '').toString().trim();
        this.messages = [
          ...this.messages,
          reply ? this.createMessage('bot', reply) : this.createErrorMessage(text),
        ];
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages = [...this.messages, this.createErrorMessage(text)];
        this.isSending.set(false);
        this.scrollToBottom();
      }
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  usePrompt(prompt: string): void {
    this.messageDraft = prompt;
  }

  retryMessage(prompt: string): void {
    this.messageDraft = prompt;
    this.sendMessage();
  }

  trackMessage(_index: number, message: AiWorkspaceMessage): string {
    return message.id;
  }

  private createMessage(sender: AiWorkspaceMessage['sender'], text: string): AiWorkspaceMessage {
    return {
      id: crypto.randomUUID(),
      sender,
      text,
      time: new Date(),
    };
  }

  private createErrorMessage(text: string): AiWorkspaceMessage {
    return {
      id: crypto.randomUUID(),
      sender: 'error',
      text: 'Something went wrong. Try again.',
      time: new Date(),
      retryPayload: text,
    };
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const container = this.messagesContainer?.nativeElement;
      if (!container) {
        return;
      }
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
  }
}
