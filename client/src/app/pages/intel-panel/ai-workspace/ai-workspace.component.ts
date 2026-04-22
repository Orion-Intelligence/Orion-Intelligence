import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { AppService } from '../../../services/core/app/app.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { ChatApiResponse } from '../../../shared/model/chat/chat-api-response.model';
import { AiWorkspaceMessage } from '../../../shared/model/chat/ai-workspace-message.model';
import { AiWorkspacePrompt } from '../../../shared/constants/shared-enums';
type ChatHistoryMessage = {
  sender: 'user' | 'bot';
  text: string;
  time: string;
};

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './ai-workspace.component.html',
})
export class AiWorkspaceComponent implements OnInit {
  private readonly sessionId: string;
  private activeChatRequest?: Subscription;
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  private readonly queryContext: string;

  protected readonly quickPrompts = Object.values(AiWorkspacePrompt);
  protected readonly isSending = signal(false);
  protected readonly isLoadingHistory = signal(true);
  protected readonly contextQuery = computed(() => this.queryContext);
  protected readonly canUseNexusChat = computed(() => this.licenseService.canUseModule('ai'));

  messageDraft = '';
  messages: AiWorkspaceMessage[] = [];

  constructor(private readonly api: ApiService, protected readonly appService: AppService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly subscriptionService: SubscriptionService, protected readonly licenseService: LicenseService) {
    this.sessionId = (appService.userSessionData()?.user.username || '').trim() || crypto.randomUUID();
    this.queryContext = (this.route.snapshot.queryParamMap.get('q') || '').trim();
  }

  ngOnInit(): void {
    this.loadChatHistory();
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
    this.persistChatHistory();
    this.messageDraft = '';
    this.isSending.set(true);
    this.scrollToBottom();

    if (!this.subscriptionService.accountExpirable()) {
      this.messages = [...this.messages, this.createErrorMessage(text)];
      this.isSending.set(false);
      this.scrollToBottom();
      return;
    }

    this.activeChatRequest = this.api.post<ChatApiResponse>('nexus/chat', {
      session_id: this.sessionId,
      message: text,
      report: this.contextQuery() || '',
    }).subscribe({
      next: (response) => {
        const reply = (response?.result ?? response?.reply ?? response?.message ?? response?.text ?? '').toString().trim();
        this.messages = [
          ...this.messages,
          reply ? this.createMessage('bot', reply) : this.createErrorMessage(text),
        ];
        this.persistChatHistory();
        this.activeChatRequest = undefined;
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.activeChatRequest = undefined;
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

  stopMessageGeneration(): void {
    this.activeChatRequest?.unsubscribe();
    this.activeChatRequest = undefined;
    this.messages = [...this.messages, this.createCancelledMessage()];
    this.isSending.set(false);
    this.scrollToBottom();
  }

  startNewChat(): void {
    this.api.post('update/current/user/chat-history', {
      chat_history: [],
    }).subscribe({
      next: () => {
        this.messages = [];
        this.messageDraft = '';
        this.router.navigate(['/dashboard/profile/ai'], {
          queryParams: { q: this.contextQuery() || null },
          queryParamsHandling: 'merge',
        }).then();
      },
      error: () => {
        this.router.navigate(['/dashboard/profile/ai'], {
          queryParams: { q: this.contextQuery() || null },
          queryParamsHandling: 'merge',
        }).then();
      }
    });
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

  private createCancelledMessage(): AiWorkspaceMessage {
    return {
      id: crypto.randomUUID(),
      sender: 'error',
      text: 'Message canceled.',
      time: new Date(),
    };
  }

  private restoreChatHistory(): void {
    this.messages = [];
  }

  private persistChatHistory(): void {
    const history = this.buildChatHistoryPayload();
    this.api.post('update/current/user/chat-history', {
      chat_history: history,
    }).subscribe();
  }

  private loadChatHistory(): void {
    this.api.post<{ chat_history?: ChatHistoryMessage[] }>('get/current/user/chat-history', {}).subscribe({
      next: (response) => {
        const history = response?.chat_history || [];
        this.messages = history
          .filter((message) => message.sender === 'user' || message.sender === 'bot')
          .map((message) => ({
            id: crypto.randomUUID(),
            sender: message.sender,
            text: message.text,
            time: new Date(message.time),
          }));
        this.isLoadingHistory.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.restoreChatHistory();
      }
    });
  }

  private buildChatHistoryPayload(): ChatHistoryMessage[] {
    const filtered = this.messages.filter((message): message is AiWorkspaceMessage & { sender: 'user' | 'bot'; } => message.sender === 'user' || message.sender === 'bot');
    let userOverflow = 0;
    let botOverflow = 0;

    for (const message of filtered) {
      if (message.sender === 'user') {
        userOverflow += 1;
      }
      else {
        botOverflow += 1;
      }
    }

    userOverflow = Math.max(0, userOverflow - 100);
    botOverflow = Math.max(0, botOverflow - 100);

    const kept: Array<AiWorkspaceMessage & { sender: 'user' | 'bot'; }> = [];
    for (const message of filtered) {
      if (message.sender === 'user' && userOverflow > 0) {
        userOverflow -= 1;
        continue;
      }
      if (message.sender === 'bot' && botOverflow > 0) {
        botOverflow -= 1;
        continue;
      }
      kept.push(message);
    }

    return kept.map((message) => ({
      sender: message.sender,
      text: message.text,
      time: message.time.toISOString(),
    }));
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const container = this.messagesContainer?.nativeElement;
      if (!container) {
        return;
      }
      const lastMessage = container.lastElementChild as HTMLElement | null;
      if (!lastMessage) {
        return;
      }

      const shouldAnchorToTop = lastMessage.offsetHeight > container.clientHeight * 0.45;
      if (shouldAnchorToTop) {
        const targetTop = Math.max(0, lastMessage.offsetTop - 56);
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
        return;
      }

      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
  }
}
