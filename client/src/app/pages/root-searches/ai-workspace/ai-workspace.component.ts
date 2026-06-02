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
import { ResultRowHelperService } from '../../../shared/services/result-row-helper.service';
import { NexusChatService } from './nexus-chat.service';
import { BotMessageActionsComponent } from './bot-message-actions/bot-message-actions.component';
import { MessageScrollRailComponent } from './message-scroll-rail/message-scroll-rail.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
type ChatHistoryMessage = {
  sender: AiWorkspaceMessage['sender'];
  text: string;
  time: string;
};

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, BotMessageActionsComponent, MessageScrollRailComponent, MarkdownPipe],
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
  protected readonly maxComposerTokens = 300;

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
    this.detachActiveNexusRequest();
    this.stoppedRequestIds.clear();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.detachActiveNexusRequest();
  }

  sendMessage(): void {
    if (this.isSending()) {
      return;
    }

    const text = this.messageDraft.trim();
    if (!text || this.countMessageTokens(text) > this.maxComposerTokens) {
      return;
    }

    this.cancelMessageEdit();
    this.detachActiveNexusRequest();
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

    this.activeChatRequest = this.nexusChatService.streamNexusChat(payload, { recoverable: true }).subscribe({
      next: (chunk) => {
        if (requestId !== this.chatRequestId) {
          return;
        }
        if (chunk.status) {
          this.nexusStep.set(chunk.status);
        }
        if (chunk.error) {
          reply = chunk.response || chunk.delta || 'Something went wrong. Try again.';
          this.isStreamingReply.set(false);
          this.streamingMessageId.set(null);
          this.messages = botMessage ? this.messages.filter(message => message.id !== botMessage?.id) : this.messages;
          this.messages = [...this.messages, this.createErrorMessage(text, reply)];
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
    this.persistChatHistory();
    this.scrollToBottom();
  }

  startNewChat(): void {
    if (this.isSending() || this.isStreamingReply()) {
      return;
    }
    this.chatRequestId += 1;
    this.stoppedRequestIds.clear();
    this.detachActiveNexusRequest();
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
    if (!text || index === -1 || this.countMessageTokens(text) > this.maxComposerTokens) {
      return;
    }

    this.chatRequestId += 1;
    this.detachActiveNexusRequest();
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

  protected get messageDraftTokenCount(): number {
    return this.countMessageTokens(this.messageDraft);
  }

  protected get messageDraftTokenOverflow(): number {
    return Math.max(0, this.messageDraftTokenCount - this.maxComposerTokens);
  }

  protected get isMessageDraftOverLimit(): boolean {
    return this.messageDraftTokenOverflow > 0;
  }

  protected get editDraftTokenCount(): number {
    return this.countMessageTokens(this.editDraft);
  }

  protected get editDraftTokenOverflow(): number {
    return Math.max(0, this.editDraftTokenCount - this.maxComposerTokens);
  }

  protected get isEditDraftOverLimit(): boolean {
    return this.editDraftTokenOverflow > 0;
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

  private detachActiveNexusRequest(): void {
    this.activeChatRequest?.unsubscribe();
    this.activeChatRequest = undefined;
  }

  private createErrorMessage(text: string, errorText = 'Something went wrong. Try again.'): AiWorkspaceMessage {
    return {
      id: crypto.randomUUID(),
      sender: 'error',
      text: errorText.trim() || 'Something went wrong. Try again.',
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
          .filter((message) => message.sender === 'user' || message.sender === 'bot' || message.sender === 'error')
          .map((message) => ({
            id: crypto.randomUUID(),
            sender: message.sender,
            text: message.text,
            time: new Date(message.time),
          }));
        this.messages = this.addMissingAiFailureMessages(messages);
        this.isLoadingHistory.set(false);
        this.scrollToBottom();
        this.resumeActiveNexusStream();
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
      const nextSender = messages[index + 1]?.sender;
      if (message.sender === 'user' && index < messages.length - 1 && nextSender !== 'bot' && nextSender !== 'error') {
        result.push(this.createErrorMessage(message.text));
      }
    });
    return result;
  }

  private buildChatHistoryPayload(): ChatHistoryMessage[] {
    const filtered = this.messages.filter((message) => this.shouldPersistHistoryMessage(message));
    let userOverflow = 0;
    let botOverflow = 0;

    for (const message of filtered) {
      if (message.sender === 'user') {
        userOverflow += 1;
      }
      else if (message.sender === 'bot') {
        botOverflow += 1;
      }
    }

    userOverflow = Math.max(0, userOverflow - 100);
    botOverflow = Math.max(0, botOverflow - 100);

    const kept: AiWorkspaceMessage[] = [];
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

  private shouldPersistHistoryMessage(message: AiWorkspaceMessage): boolean {
    if (message.sender === 'user' || message.sender === 'bot') {
      return true;
    }
    return message.sender === 'error' && message.text.trim() === 'Message canceled.';
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

  private resumeActiveNexusStream(): void {
    if (this.activeChatRequest || this.messages.at(-1)?.sender !== 'user') {
      return;
    }

    const requestId = ++this.chatRequestId;
    let reply = '';
    let receivedReply = false;
    const retryPayload = this.messages.at(-1)?.sender === 'user' ? this.messages.at(-1)!.text : '';
    let botMessage: AiWorkspaceMessage | undefined;
    this.isSending.set(true);
    this.isStreamingReply.set(false);
    this.streamingMessageId.set(null);
    this.nexusStep.set('');

    const updateReply = (value: string) => {
      if (requestId !== this.chatRequestId) {
        return;
      }
      receivedReply = true;
      if (!botMessage) {
        botMessage = this.createMessage('bot', '');
        this.messages = [...this.messages, botMessage];
        this.isStreamingReply.set(true);
        this.streamingMessageId.set(botMessage.id);
      }
      this.messages = this.messages.map(message => message.id === botMessage?.id ? { ...message, text: value } : message);
    };
    this.activeChatRequest = this.nexusChatService.resumeNexusChat().subscribe({
      next: (chunk) => {
        if (requestId !== this.chatRequestId) {
          return;
        }
        if (chunk.status) {
          this.nexusStep.set(chunk.status);
        }
        if (chunk.error) {
          reply = chunk.response || chunk.delta || 'Something went wrong. Try again.';
          this.isStreamingReply.set(false);
          this.streamingMessageId.set(null);
          this.messages = botMessage ? this.messages.filter(message => message.id !== botMessage?.id) : this.messages;
          if (retryPayload) {
            this.messages = [...this.messages, this.createErrorMessage(retryPayload, reply)];
          }
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
        if (requestId !== this.chatRequestId) {
          return;
        }
        this.activeChatRequest = undefined;
        this.isSending.set(false);
        this.isStreamingReply.set(false);
        this.streamingMessageId.set(null);
        this.nexusStep.set('');
        if (receivedReply && reply.trim()) {
          this.persistChatHistory();
        }
        this.scrollToBottom();
      },
      error: () => {
        if (requestId !== this.chatRequestId) {
          return;
        }
        this.activeChatRequest = undefined;
        this.isSending.set(false);
        this.isStreamingReply.set(false);
        this.streamingMessageId.set(null);
        this.nexusStep.set('');
        this.scrollToBottom();
      },
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

  private countMessageTokens(value: string): number {
    return value.trim().match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g)?.length ?? 0;
  }

}
