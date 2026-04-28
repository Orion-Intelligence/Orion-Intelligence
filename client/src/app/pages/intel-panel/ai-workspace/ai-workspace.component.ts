import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { AppService } from '../../../services/core/app/app.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { AiWorkspaceMessage } from '../../../shared/model/chat/ai-workspace-message.model';
import { AiWorkspacePrompt } from '../../../shared/constants/shared-enums';
import { NexusChatService } from './nexus-chat.service';
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
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private activeChatRequest?: Subscription;
  private chatRequestId = 0;
  private stoppedRequestIds = new Set<number>();
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  private readonly queryContext: string;

  protected readonly quickPrompts = Object.values(AiWorkspacePrompt);
  protected readonly isSending = signal(false);
  protected readonly isLoadingHistory = signal(true);
  protected readonly isStreamingReply = signal(false);
  protected readonly streamingMessageId = signal<string | null>(null);
  protected readonly nexusStep = signal('');
  protected readonly contextQuery = computed(() => this.queryContext);
  protected readonly canUseNexusChat = computed(() => this.licenseService.canUseModule('ai'));

  messageDraft = '';
  messages: AiWorkspaceMessage[] = [];

  constructor(private readonly api: ApiService, protected readonly appService: AppService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly subscriptionService: SubscriptionService, protected readonly licenseService: LicenseService, private readonly nexusChatService: NexusChatService) {
    this.queryContext = (this.route.snapshot.queryParamMap.get('q') || '').trim();
  }

  ngOnInit(): void {
    this.loadChatHistory();
  }

  ngOnDestroy(): void {
    this.cancelActiveNexusRequest();
    this.stoppedRequestIds.clear();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.cancelActiveNexusRequest();
  }

  sendMessage(): void {
    if (this.isSending()) {
      return;
    }

    const text = this.messageDraft.trim();
    if (!text) {
      return;
    }

    this.cancelActiveNexusRequest();
    this.messages = [...this.messages, this.createMessage('user', text)];
    this.persistChatHistory();
    this.messageDraft = '';
    this.isSending.set(true);
    this.nexusStep.set('');
    this.scrollToBottom();

    if (!this.subscriptionService.accountExpirable()) {
      this.messages = [...this.messages, this.createErrorMessage(text)];
      this.isSending.set(false);
      this.scrollToBottom();
      return;
    }

    const payload = {
      message: text,
      report: this.contextQuery() || '',
    };

    const requestId = ++this.chatRequestId;
    this.stoppedRequestIds.delete(requestId);
    let reply = '';
    let botMessage: AiWorkspaceMessage | undefined;
    const updateReply = (value: string) => {
      if (requestId !== this.chatRequestId) {
        return;
      }
      if (!botMessage) {
        botMessage = this.createMessage('bot', '');
        this.messages = [...this.messages, botMessage];
        this.isStreamingReply.set(true);
        this.streamingMessageId.set(botMessage.id);
      }
      this.messages = this.messages.map(message => message.id === botMessage?.id ? { ...message, text: value } : message);
    };
    const finishStream = () => {
      if (requestId !== this.chatRequestId) {
        return;
      }
      this.activeChatRequest = undefined;
      this.isStreamingReply.set(false);
      this.streamingMessageId.set(null);
      this.isSending.set(false);
      this.nexusStep.set('');
      if (!reply.trim()) {
        this.messages = botMessage ? this.messages.filter(message => message.id !== botMessage?.id) : this.messages;
        this.messages = [...this.messages, this.createErrorMessage(text)];
      }
      else {
        this.persistChatHistory();
      }
      this.scrollToBottom();
    };

    this.activeChatRequest = this.nexusChatService.streamNexusChat(payload).subscribe({
      next: (chunk) => {
        if (requestId !== this.chatRequestId) {
          return;
        }
        if (chunk.delta) {
          reply += chunk.delta;
          updateReply(reply);
        }
        if (chunk.response) {
          reply = chunk.response;
          updateReply(reply);
        }
      },
      complete: () => {
        if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
          return;
        }
        finishStream();
      },
      error: () => {
        if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
          return;
        }
        this.activeChatRequest = undefined;
        this.isStreamingReply.set(false);
        this.streamingMessageId.set(null);
        this.messages = botMessage ? this.messages.filter(message => message.id !== botMessage?.id) : this.messages;
        this.messages = [...this.messages, this.createErrorMessage(text)];
        this.isSending.set(false);
        this.nexusStep.set('');
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
    this.stoppedRequestIds.add(this.chatRequestId);
    this.chatRequestId += 1;
    this.cancelActiveNexusRequest();
    this.messages = [...this.messages, this.createCancelledMessage()];
    this.isSending.set(false);
    this.isStreamingReply.set(false);
    this.streamingMessageId.set(null);
    this.nexusStep.set('');
    this.scrollToBottom();
  }

  startNewChat(): void {
    this.chatRequestId += 1;
    this.stoppedRequestIds.clear();
    this.cancelActiveNexusRequest();
    this.isSending.set(false);
    this.isStreamingReply.set(false);
    this.streamingMessageId.set(null);
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

  private cancelActiveNexusRequest(): void {
    if (this.activeChatRequest || this.isSending() || this.isStreamingReply()) {
      this.nexusChatService.cancelNexusChat();
    }
    this.activeChatRequest?.unsubscribe();
    this.activeChatRequest = undefined;
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
