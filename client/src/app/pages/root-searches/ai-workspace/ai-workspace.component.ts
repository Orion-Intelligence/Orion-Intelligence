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

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, BotMessageActionsComponent, MessageScrollRailComponent, AiChatSidebarComponent, MarkdownPipe, ProfileComponent, TranslatePipe],
  templateUrl: './ai-workspace.component.html',
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private readonly localNewChatSessionId = 'new-chat';
  private activeChatRequest?: Subscription;
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;

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

    const sendToSession = (sessionId: string) => {
      this.messageDraft = '';
      this.queueComposerResize();

      this.isSending.set(true);
      this.nexusStep.set('Thinking');

      let reply = '';
      let finished = false;
      const fail = (errorText = 'Something went wrong. Try again.') => {
        if (finished) {
          return;
        }
        finished = true;
        this.messages = [...this.messages, this.createErrorMessage(text, errorText)];
        this.isSending.set(false);
        this.nexusStep.set('');
        this.activeChatRequest = undefined;
        this.scrollToBottom();
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
        this.messages = [
          ...this.messages,
          { id: crypto.randomUUID(), sender: 'user', text, time: now },
          { id: crypto.randomUUID(), sender: 'bot', text: reply, time: now },
        ];

        this.chatSessions = this.sortChatSessions(this.chatSessions.map(session =>
          session.sessionId === sessionId
            ? { ...session, updatedAt: now.toISOString(), messageCount: this.messages.length, messages: this.messages }
            : session));

        this.isSending.set(false);
        this.nexusStep.set('');
        this.activeChatRequest = undefined;
        this.scrollToBottom();
      };

      this.activeChatRequest = this.nexusChatService.streamNexusChat({ message: text, session_id: sessionId, session_type: 'persistent', tool: 'open_chat' }).subscribe({
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
      this.isSending.set(true);
      this.nexusStep.set('Starting chat');
      this.nexusChatService.createChat(this.chatTitleFromPrompt(text)).subscribe({
        next: (session) => {
          const mappedSession = this.mapSession(session);

          this.chatSessions = this.sortChatSessions([
            mappedSession,
            ...this.chatSessions.filter(chat =>
              chat.sessionId !== localSessionId && chat.sessionId !== mappedSession.sessionId),
          ]);
          this.activeSessionId = mappedSession.sessionId;
          this.messages = [];

          sendToSession(mappedSession.sessionId);
        },
        error: () => {
          this.messages = [...this.messages, this.createErrorMessage(text)];
          this.isSending.set(false);
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
      sendToSession(this.activeSessionId);
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
    this.isSending.set(false);
    this.nexusStep.set('');
    this.scrollToBottom();
  }

  startNewChat(): void {
    if (this.isSending()) {
      return;
    }

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

    this.detachActiveNexusRequest();

    this.isSending.set(false);
    this.nexusStep.set('');

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
        this.createLocalNewChat();
      },
      error: () => {
        this.chatSessions = [];
        this.messages = [];
        this.activeSessionId = null;
        this.isLoadingHistory.set(false);
        this.createLocalNewChat();
      },
    });
  }

  private loadChat(sessionId: string): void {
    this.isLoadingHistory.set(true);

    this.nexusChatService.getChat(sessionId).subscribe({
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
        this.cancelMessageEdit();
        this.queueComposerResize();
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingHistory.set(false);
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
    if (this.isSending()) {
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
