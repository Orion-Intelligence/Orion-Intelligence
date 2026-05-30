import { CommonModule, DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
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
import { ResultRowHelperService } from '../../../shared/services/result-row-helper.service';
import { NexusChatService } from './nexus-chat.service';
import { BotMessageActionsComponent } from './bot-message-actions/bot-message-actions.component';
type ChatHistoryMessage = {
  sender: 'user' | 'bot';
  text: string;
  time: string;
};

type SharedChatMessage = {
  sender: 'user' | 'bot';
  text: string;
  time: Date;
};

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, BotMessageActionsComponent],
  templateUrl: './ai-workspace.component.html',
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private activeChatRequest?: Subscription;
  private chatRequestId = 0;
  private stoppedRequestIds = new Set<number>();
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;
  private readonly queryContext: string;

  protected readonly quickPrompts = Object.values(AiWorkspacePrompt);
  protected readonly isSending = signal(false);
  protected readonly isLoadingHistory = signal(true);
  protected readonly isStreamingReply = signal(false);
  protected readonly isChatShareCreating = signal(false);
  protected readonly streamingMessageId = signal<string | null>(null);
  protected readonly copiedMessageId = signal<string | null>(null);
  protected readonly nexusStep = signal('');
  protected readonly contextQuery = computed(() => this.queryContext);
  protected readonly canUseNexusChat = computed(() => this.licenseService.canUseModule('ai'));

  messageDraft = '';
  editingMessageId: string | null = null;
  editDraft = '';
  messages: AiWorkspaceMessage[] = [];
  composerExpanded = false;
  composerRows = 1;
  composerScrollable = false;

  constructor(private readonly api: ApiService, protected readonly appService: AppService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly subscriptionService: SubscriptionService, protected readonly licenseService: LicenseService, private readonly nexusChatService: NexusChatService, private readonly resultRowHelper: ResultRowHelperService) {
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

    this.cancelMessageEdit();
    this.cancelActiveNexusRequest();
    this.messages = [...this.messages, this.createMessage('user', text)];
    this.persistChatHistory();
    this.messageDraft = '';
    this.queueComposerResize();
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
      tool: 'open_chat',
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
        if (chunk.status) {
          this.nexusStep.set(chunk.status);
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

  resizeComposer(): void {
    const textarea = this.composerInput?.nativeElement;
    if (!textarea) {
      return;
    }

    const lineCount = this.getComposerLineCount(textarea);
    this.composerRows = Math.min(5, lineCount);
    this.composerScrollable = lineCount > 5;
    this.composerExpanded = this.composerRows > 1;
  }

  usePrompt(prompt: string): void {
    this.messageDraft = prompt;
    this.queueComposerResize();
  }

  retryMessage(prompt: string): void {
    this.cancelMessageEdit();
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
    this.nexusChatService.clearNexusSession().subscribe({
      next: () => this.clearChatView(),
      error: () => this.clearChatView(),
    });
  }

  shareChat(): void {
    const messages = this.buildChatHistoryPayload();
    if (this.isChatShareCreating() || !messages.length) {
      return;
    }
    this.isChatShareCreating.set(true);
    this.api.post<{ path: string; }>('profile/chat-shares', {
      messages,
      expiresInHours: 168,
    }).subscribe({
      next: (share) => {
        this.isChatShareCreating.set(false);
        const url = new URL(share.path, window.location.origin).toString();
        window.open(url, '_blank', 'noopener');
      },
      error: () => this.isChatShareCreating.set(false),
    });
  }

  private clearChatView(): void {
    this.messages = [];
    this.messageDraft = '';
    this.cancelMessageEdit();
    this.queueComposerResize();
    this.router.navigate(['/dashboard/profile/ai'], {
      queryParams: { q: this.contextQuery() || null },
      queryParamsHandling: 'merge',
    }).then();
  }

  trackMessage(_index: number, message: AiWorkspaceMessage): string {
    return message.id;
  }

  canEditMessage(message: AiWorkspaceMessage): boolean {
    return !this.isSending() && message.sender === 'user';
  }

  copyMessage(message: AiWorkspaceMessage, event?: MouseEvent): void {
    event?.stopPropagation();
    const text = message.text.trim();
    if (!text) {
      return;
    }
    this.resultRowHelper.copyToClipboard(text).subscribe((ok) => {
      this.copiedMessageId.set(ok ? message.id : null);
      setTimeout(() => this.copiedMessageId.set(null), 1200);
    });
  }

  startMessageEdit(message: AiWorkspaceMessage): void {
    if (!this.canEditMessage(message)) {
      return;
    }
    this.editingMessageId = message.id;
    this.editDraft = message.text;
    requestAnimationFrame(() => {
      const textarea = document.getElementById(`ai-message-edit-${message.id}`) as HTMLTextAreaElement | null;
      textarea?.focus();
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }

  cancelMessageEdit(): void {
    this.editingMessageId = null;
    this.editDraft = '';
  }

  saveMessageEdit(message: AiWorkspaceMessage): void {
    const text = this.editDraft.trim();
    const index = this.messages.findIndex(item => item.id === message.id);
    if (!text || index === -1) {
      return;
    }

    this.chatRequestId += 1;
    this.cancelActiveNexusRequest();
    this.isSending.set(false);
    this.isStreamingReply.set(false);
    this.streamingMessageId.set(null);
    this.nexusStep.set('');
    this.messages = this.messages.slice(0, index);
    this.messageDraft = text;
    this.cancelMessageEdit();
    this.queueComposerResize();
    this.sendMessage();
  }

  onEditKeydown(event: KeyboardEvent, message: AiWorkspaceMessage): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelMessageEdit();
      return;
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.saveMessageEdit(message);
    }
  }

  getEditReserveText(message: AiWorkspaceMessage): string {
    return this.editDraft.length > message.text.length ? this.editDraft : message.text;
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
        const messages = history
          .filter((message) => message.sender === 'user' || message.sender === 'bot')
          .map((message) => ({
            id: crypto.randomUUID(),
            sender: message.sender,
            text: message.text,
            time: new Date(message.time),
          }));
        this.messages = this.addMissingAiFailureMessages(messages);
        this.isLoadingHistory.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.restoreChatHistory();
      }
    });
  }

  private addMissingAiFailureMessages(messages: AiWorkspaceMessage[]): AiWorkspaceMessage[] {
    const result: AiWorkspaceMessage[] = [];
    messages.forEach((message, index) => {
      result.push(message);
      if (message.sender === 'user' && index < messages.length - 1 && messages[index + 1]?.sender !== 'bot') {
        result.push(this.createErrorMessage(message.text));
      }
    });
    return result;
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

  queueComposerResize(): void {
    requestAnimationFrame(() => this.resizeComposer());
  }

  private getComposerLineCount(textarea: HTMLTextAreaElement): number {
    const horizontalPadding = 24;
    const averageCharWidth = 7;
    const availableWidth = Math.max(averageCharWidth, textarea.clientWidth - horizontalPadding);
    const charsPerLine = Math.max(1, Math.floor(availableWidth / averageCharWidth));
    const lines = (textarea.value || '').split('\n');

    return Math.max(1, lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0));
  }

}

@Component({
  selector: 'app-chat-share',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './chat-share/chat-share.component.html',
})
export class ChatShareComponent implements OnInit, OnDestroy {
  private previousTheme: 'light-theme' | 'dark-theme' | null = null;

  messages: SharedChatMessage[] = [];
  expiresAt: Date | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService) { }

  ngOnInit(): void {
    this.forceDarkTheme();
    const shareId = this.route.snapshot.paramMap.get('shareId') || '';
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!shareId || !token) {
      this.errorMessage = 'Invalid share link.';
      this.isLoading = false;
      return;
    }
    this.api.get<{ messages: Array<Omit<SharedChatMessage, 'time'> & { time: string; }>; expiresAt: string; }>(`public/chat-shares/${shareId}`, {
      params: new HttpParams().set('token', token)
    }).subscribe({
      next: response => {
        this.messages = (response.messages || [])
          .filter(message => message.sender === 'user' || message.sender === 'bot')
          .map(message => ({ ...message, time: new Date(message.time) }));
        this.expiresAt = response.expiresAt ? new Date(response.expiresAt) : null;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = err?.error?.detail || 'This share link is unavailable.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    if (this.previousTheme) {
      document.body.classList.add(this.previousTheme);
    }
  }

  trackMessage(index: number): number {
    return index;
  }

  private forceDarkTheme(): void {
    this.previousTheme = document.body.classList.contains('light-theme') ? 'light-theme'
      : document.body.classList.contains('dark-theme') ? 'dark-theme'
        : null;
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}
