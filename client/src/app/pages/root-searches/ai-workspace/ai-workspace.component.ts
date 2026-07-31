import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from '../../../services/core/app/app.service';
import { AiWorkspaceMessage } from '../../../shared/model/chat/ai-workspace-message.model';
import { AiWorkspacePrompt } from '../../../shared/constants/shared-enums';
import { ResultRowHelperService } from '../../../shared/services/result-row-helper.service';
import { NexusChatService } from './nexus-chat.service';
import { BotMessageActionsComponent } from './bot-message-actions/bot-message-actions.component';
import { MessageScrollRailComponent } from './message-scroll-rail/message-scroll-rail.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AiChatSession } from '../../../shared/model/nexus/ai-chat-session.model';
import { AiChatSidebarComponent } from './ai-chat-sidebar/ai-chat-sidebar.component';
import { ProfileComponent } from '../../../shared/partials/profile/profile.component';

interface PendingNexusStream {
  requestId: string;
  sessionId: string;
  message: string;
  baselineMessageCount: number;
}

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, BotMessageActionsComponent, MessageScrollRailComponent, AiChatSidebarComponent, MarkdownPipe, ProfileComponent, TranslatePipe],
  templateUrl: './ai-workspace.component.html',
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private readonly localNewChatSessionId = 'new-chat';
  private readonly pendingStreamStorageKey = 'orion.nexus.pending-stream';
  private activeChatRequest?: Subscription;
  private chatHistoryRequest?: Subscription;
  private resumedRequestId: string | null = null;
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;

  protected activeRequestSessionId: string | null = null;
  protected readonly quickPrompts = Object.values(AiWorkspacePrompt);
  protected readonly isSending = signal(false);
  protected readonly isLoadingHistory = signal(true);
  protected readonly copiedMessageId = signal<string | null>(null);
  protected readonly nexusStep = signal('');
  protected readonly maxComposerTokens = 300;

  messageDraft = '';
  editingMessageId: string | null = null;
  editDraft = '';
  messages: AiWorkspaceMessage[] = [];
  composerExpanded = false;
  composerRows = 1;
  composerScrollable = false;
  activeSessionId: string | null = null;
  chatSessions: AiChatSession[] = [];

  constructor(protected readonly appService: AppService, private readonly router: Router, private readonly nexusChatService: NexusChatService, private readonly resultRowHelper: ResultRowHelperService, private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadBackendChatSessions();
  }

  ngOnDestroy(): void {
    this.detachActiveNexusRequest();
    this.chatHistoryRequest?.unsubscribe();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.detachActiveNexusRequest();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    this.router.navigate(['/dashboard/home']).then();
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
    const requestId = this.resumedRequestId || crypto.randomUUID();
    this.resumedRequestId = null;

    const sendToSession = (sessionId: string, sessionMessages: AiWorkspaceMessage[]) => {
      const baselineMessageCount = sessionMessages.length;
      this.messageDraft = '';
      this.queueComposerResize();

      this.isSending.set(true);
      this.activeRequestSessionId = sessionId;
      this.nexusStep.set('Thinking');
      const requestMessages: AiWorkspaceMessage[] = [
        ...sessionMessages,
        { id: `pending-user-${requestId}`, sender: 'user', text, time: new Date() },
      ];
      this.updateSessionMessages(sessionId, requestMessages);
      this.writePendingStream({ requestId, sessionId, message: text, baselineMessageCount });
      if (this.activeSessionId === sessionId) {
        this.scrollToBottom();
      }

      let reply = '';
      let finished = false;
      const finishRequest = () => {
        this.clearPendingStream();
        this.isSending.set(false);
        this.nexusStep.set('');
        if (this.activeRequestSessionId === sessionId) {
          this.activeRequestSessionId = null;
        }
        this.activeChatRequest = undefined;
      };
      const fail = (errorText = 'Something went wrong. Try again.') => {
        if (finished) {
          return;
        }
        finished = true;
        this.updateSessionMessages(sessionId, [...requestMessages, this.createErrorMessage(text, errorText)]);
        finishRequest();
        if (this.activeSessionId === sessionId) {
          this.scrollToBottom();
        }
      };
      const complete = () => {
        if (finished) {
          return;
        }
        if (!reply.trim()) {
          fail('Nexus returned no response. Try again.');
          return;
        }
        finished = true;
        const now = new Date();
        const completedMessages: AiWorkspaceMessage[] = [
          ...requestMessages,
          { id: crypto.randomUUID(), sender: 'bot', text: reply, time: now },
        ];

        this.updateSessionMessages(sessionId, completedMessages, now.toISOString());
        finishRequest();
        if (this.activeSessionId === sessionId) {
          this.scrollToBottom();
        }
      };

      this.activeChatRequest = this.nexusChatService.streamNexusChat({ message: text, request_id: requestId, session_id: sessionId, session_type: 'persistent', tool: 'open_chat' }).subscribe({
        next: (chunk) => {
          if (chunk.status) {
            this.nexusStep.set(chunk.status);
            this.cdr.detectChanges();
          }
          if (chunk.error) {
            fail(chunk.response || 'Something went wrong. Try again.');
            return;
          }
          if (chunk.delta) {
            reply += chunk.delta;
          }
          if (chunk.response) {
            reply = chunk.response;
          }
        },
        complete,
        error: () => fail(),
      });
    };

    const createSessionAndSend = (localSessionId?: string) => {
      const sourceSessionId = localSessionId ?? this.activeSessionId;
      const sourceMessages = [...this.messages];
      this.isSending.set(true);
      this.activeRequestSessionId = sourceSessionId;
      this.nexusStep.set('Starting chat');
      this.nexusChatService.createChat(this.chatTitleFromPrompt(text)).subscribe({
        next: (session) => {
          const mappedSession = this.mapSession(session);
          const sourceStillSelected = this.activeSessionId === sourceSessionId;

          this.chatSessions = this.sortChatSessions([
            mappedSession,
            ...this.chatSessions.filter(chat =>
              chat.sessionId !== localSessionId && chat.sessionId !== mappedSession.sessionId),
          ]);
          if (sourceStillSelected) {
            this.activeSessionId = mappedSession.sessionId;
            this.messages = sourceMessages;
          }

          sendToSession(mappedSession.sessionId, sourceMessages);
        },
        error: () => {
          if (this.activeSessionId === sourceSessionId) {
            this.messages = [...sourceMessages, this.createErrorMessage(text)];
          }
          this.isSending.set(false);
          this.activeRequestSessionId = null;
          this.nexusStep.set('');
        },
      });
    };

    if (this.activeSessionId) {
      const activeSession = this.chatSessions.find(chat => chat.sessionId === this.activeSessionId);
      if (activeSession?.sessionId === this.localNewChatSessionId) {
        createSessionAndSend(activeSession.sessionId);
        return;
      }
      sendToSession(this.activeSessionId, [...this.messages]);
      return;
    }

    createSessionAndSend();
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
    this.cancelActiveNexusRequest();
    this.clearPendingStream();
    this.isSending.set(false);
    this.activeRequestSessionId = null;
    this.nexusStep.set('');
    this.scrollToBottom();
  }

  startNewChat(): void {
    const emptyChat = this.chatSessions.find(chat => chat.messageCount === 0 && chat.messages.length === 0);
    if (emptyChat) {
      this.activeSessionId = emptyChat.sessionId;
      this.messages = [];
      this.messageDraft = '';
      this.cancelMessageEdit();
      this.queueComposerResize();
      this.scrollToBottom();
      return;
    }

    if (!this.isSending()) {
      this.detachActiveNexusRequest();
      this.nexusStep.set('');
    }

    this.createLocalNewChat();
  }

  private createLocalNewChat(): void {
    const newChatSession: AiChatSession = {
      sessionId: this.localNewChatSessionId,
      title: 'New Chat',
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      isPinned: false,
      pinnedAt: null,
      messages: [],
    };
    this.chatSessions = this.sortChatSessions([
      newChatSession,
      ...this.chatSessions.filter(chat => chat.sessionId !== this.localNewChatSessionId),
    ]);
    this.activeSessionId = newChatSession.sessionId;
    this.messages = [];
    this.messageDraft = '';

    this.cancelMessageEdit();
    this.queueComposerResize();
    this.scrollToBottom();
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

    this.detachActiveNexusRequest();
    this.isSending.set(false);
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

  protected get isActiveChatSending(): boolean {
    return this.isSending() && this.activeSessionId === this.activeRequestSessionId;
  }

  protected get isAnotherChatSending(): boolean {
    return this.isSending() && this.activeSessionId !== this.activeRequestSessionId;
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

  private cancelActiveNexusRequest(): void {
    if (this.activeChatRequest || this.isSending()) {
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

  private updateSessionMessages(sessionId: string, messages: AiWorkspaceMessage[], updatedAt = new Date().toISOString()): void {
    this.chatSessions = this.sortChatSessions(this.chatSessions.map(session =>
      session.sessionId === sessionId
        ? { ...session, updatedAt, messageCount: messages.length, messages }
        : session));
    if (this.activeSessionId === sessionId) {
      this.messages = messages;
    }
  }

  private writePendingStream(pending: PendingNexusStream): void {
    try {
      sessionStorage.setItem(this.pendingStreamStorageKey, JSON.stringify(pending));
    }
    catch {
      // Reconnection is unavailable when browser session storage is blocked.
    }
  }

  private readPendingStream(): PendingNexusStream | null {
    try {
      const value = sessionStorage.getItem(this.pendingStreamStorageKey);
      if (!value) {
        return null;
      }
      const pending = JSON.parse(value) as Partial<PendingNexusStream>;
      if (!pending.requestId || !pending.sessionId || !pending.message || typeof pending.baselineMessageCount !== 'number') {
        this.clearPendingStream();
        return null;
      }
      return pending as PendingNexusStream;
    }
    catch {
      this.clearPendingStream();
      return null;
    }
  }

  private clearPendingStream(): void {
    try {
      sessionStorage.removeItem(this.pendingStreamStorageKey);
    }
    catch {
      // Nothing to clear when browser session storage is blocked.
    }
  }

  private resumePendingStream(): boolean {
    const pending = this.readPendingStream();
    if (!pending) {
      return false;
    }

    const existingSession = this.chatSessions.find(session => session.sessionId === pending.sessionId);
    if (existingSession && existingSession.messageCount >= pending.baselineMessageCount + 2) {
      this.clearPendingStream();
      this.loadChat(pending.sessionId);
      return true;
    }

    if (!existingSession) {
      this.chatSessions = this.sortChatSessions([{
        sessionId: pending.sessionId,
        title: this.chatTitleFromPrompt(pending.message),
        updatedAt: new Date().toISOString(),
        messageCount: pending.baselineMessageCount,
        isPinned: false,
        pinnedAt: null,
        messages: [],
      }, ...this.chatSessions]);
    }
    this.activeSessionId = pending.sessionId;

    const resume = () => {
      this.resumedRequestId = pending.requestId;
      this.messageDraft = pending.message;
      this.sendMessage();
    };
    this.nexusChatService.getChat(pending.sessionId).subscribe({
      next: (chat) => {
        this.messages = chat.messages.map(message => this.mapMessage(message));
        if (this.messages.length >= pending.baselineMessageCount + 2) {
          this.clearPendingStream();
          this.loadChat(pending.sessionId);
          return;
        }
        resume();
      },
      error: () => {
        this.messages = [];
        resume();
      },
    });
    return true;
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

  private countMessageTokens(value: string): number {
    return value.trim().match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g)?.length ?? 0;
  }

  private mapSession(session: any): AiChatSession {
    return {
      sessionId: session.session_id || session.id,
      title: session.title,
      updatedAt: session.updated_at,
      messageCount: session.message_count ?? 0,
      isPinned: session.is_pinned ?? false,
      pinnedAt: session.pinned_at ?? null,
      messages: [],
    };
  }

  private mapMessage(message: any): AiWorkspaceMessage {
    return {
      id: message.id,
      sender: message.sender === 'bot' ? 'bot' : 'user',
      text: message.text,
      time: new Date(message.created_at),
    };
  }

  private loadBackendChatSessions(): void {
    this.isLoadingHistory.set(true);

    this.nexusChatService.listChats().subscribe({
      next: (sessions) => {
        this.chatSessions = this.sortChatSessions(sessions
          .map(session => this.mapSession(session))
          .filter(session => session.messageCount > 0));
        this.activeSessionId = null;
        this.messages = [];

        this.isLoadingHistory.set(false);
        if (!this.resumePendingStream()) {
          this.createLocalNewChat();
        }
      },
      error: () => {
        this.chatSessions = [];
        this.messages = [];
        this.activeSessionId = null;
        this.isLoadingHistory.set(false);
        if (!this.resumePendingStream()) {
          this.createLocalNewChat();
        }
      },
    });
  }

  private loadChat(sessionId: string): void {
    this.chatHistoryRequest?.unsubscribe();
    this.isLoadingHistory.set(true);

    this.chatHistoryRequest = this.nexusChatService.getChat(sessionId).subscribe({
      next: (chat) => {
        const chatSessionId = chat.session_id;

        this.activeSessionId = chatSessionId;
        this.messages = chat.messages.map(message => this.mapMessage(message));

        const updatedSession: AiChatSession = {
          ...this.mapSession(chat),
          messages: this.messages,
        };
        this.chatSessions = this.sortChatSessions(this.chatSessions.some(session => session.sessionId === chatSessionId)
          ? this.chatSessions.map(session => session.sessionId === chatSessionId ? { ...session, ...updatedSession } : session)
          : [updatedSession, ...this.chatSessions]);
        this.isLoadingHistory.set(false);
        this.chatHistoryRequest = undefined;
        this.cancelMessageEdit();
        this.queueComposerResize();
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.chatHistoryRequest = undefined;
      },
    });
  }

  private sortChatSessions(chats: AiChatSession[]): AiChatSession[] {
    return [...chats].sort((a, b) => {
      const aIsEmpty = a.messageCount === 0 && a.messages.length === 0;
      const bIsEmpty = b.messageCount === 0 && b.messages.length === 0;
      if (aIsEmpty !== bIsEmpty) {
        return aIsEmpty ? -1 : 1;
      }

      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (a.isPinned && b.isPinned) {
        return new Date(b.pinnedAt || b.updatedAt).getTime() -
          new Date(a.pinnedAt || a.updatedAt).getTime();
      }

      return new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime();
    });
  }

  private chatTitleFromPrompt(prompt: string): string {
    const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim();
    return normalizedPrompt.length > 48
      ? `${normalizedPrompt.slice(0, 47).trimEnd()}…`
      : normalizedPrompt;
  }

  selectChat(session: AiChatSession): void {
    if (this.isSending() && session.sessionId === this.activeRequestSessionId) {
      this.chatHistoryRequest?.unsubscribe();
      this.chatHistoryRequest = undefined;
      this.activeSessionId = session.sessionId;
      this.messages = [...session.messages];
      this.isLoadingHistory.set(false);
      this.cancelMessageEdit();
      this.queueComposerResize();
      this.scrollToBottom();
      return;
    }

    if (this.activeSessionId === session.sessionId) {
      return;
    }

    if (session.sessionId === this.localNewChatSessionId) {
      this.activeSessionId = session.sessionId;
      this.messages = [];
      this.cancelMessageEdit();
      this.queueComposerResize();
      this.scrollToBottom();
      return;
    }

    this.loadChat(session.sessionId);
  }

  onSidebarSessionUpdated(session: AiChatSession): void {
    this.chatSessions = this.sortChatSessions(this.chatSessions.map(chat => chat.sessionId === session.sessionId ? { ...chat, ...session } : chat));
  }

  onSidebarSessionDeleted(sessionId: string): void {
    this.chatSessions = this.chatSessions.filter(chat => chat.sessionId !== sessionId);
    if (this.activeSessionId !== sessionId) {
      return;
    }
    const nextChat = this.chatSessions[0];
    if (nextChat) {
      this.selectChat(nextChat);
    }
    else {
      this.activeSessionId = null;
      this.messages = [];
      this.messageDraft = '';
    }
  }
}
