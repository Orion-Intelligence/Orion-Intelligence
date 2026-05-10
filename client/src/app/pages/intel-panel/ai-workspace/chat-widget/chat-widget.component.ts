import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { chatBotAnimation } from '../../../../shared/animations/chat.bot.animation';
import { overlayFadeAnimation } from '../../../../shared/animations/chat.overlay.animation';
import { SubscriptionService } from '../../../../services/dashboard/subscription.service';
import { AppService } from '../../../../services/core/app/app.service';
import { NexusChatService } from '../nexus-chat.service';
import { AiWorkspaceMessage } from '../../../../shared/model/chat/ai-workspace-message.model';
import { BotMessageActionsComponent } from '../bot-message-actions/bot-message-actions.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, BotMessageActionsComponent],
  templateUrl: './chat-widget.component.html',
  animations: [chatBotAnimation, overlayFadeAnimation]
})
export class ChatWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private activeChatRequest?: Subscription;
  private chatRequestId = 0;
  private stoppedRequestIds = new Set<number>();
  private userNearBottom = true;
  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('bottomSentinel') bottomSentinel!: ElementRef<HTMLElement>;
  chatMessages: AiWorkspaceMessage[] = [];
  isBotTyping = false;
  botStep = '';
  newMessage = '';
  chatOpen = false;
  isFullScreen = false;
  composerExpanded = false;
  readonly reportText = input<string>();
  readonly report = input<string>();
  readonly showLauncher = input(true);
  readonly tool = input('default');
  readonly type = input('default');

  constructor(public appService: AppService, private dashboardService: DashboardService, private cdr: ChangeDetectorRef, private zone: NgZone, private subscriptionService: SubscriptionService, private nexusChatService: NexusChatService) { }

  ngOnInit(): void {
    if (this.chatMessages.length === 0) {
      this.chatMessages.push({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: 'Hi there! How can I help you today?',
        time: new Date()
      });
    }
  }

  ngAfterViewInit(): void {
    this.setupObserversIfPossible();
    this.scrollToBottom(true);
  }

  ngOnDestroy(): void {
    this.cancelActiveNexusRequest();
    this.stoppedRequestIds.clear();
    this.io?.disconnect();
    this.mo?.disconnect();
  }

  sendMessage(event?: Event): void {
    event?.preventDefault();
    if (this.isBotTyping) {
      return;
    }
    const text = this.newMessage.trim();
    if (!text) {
      return;
    }
    this.chatMessages.push({ id: crypto.randomUUID(), sender: 'user', text, time: new Date() });
    this.newMessage = '';
    this.queueComposerResize();
    this.isBotTyping = true;
    this.botStep = '';
    this.scrollToNewMessage();
    this.aiSuggest(text);
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.sendMessage(event);
  }

  aiSuggest(userMessage: string): void {
    if (!this.subscriptionService.accountExpirable()) {
      this.showErrorMessage(userMessage);
      this.isBotTyping = false;
      this.scrollToNewMessage();
      return;
    }
    const report = (this.report() || this.reportText() || '').trim();
    const payload = {
      message: report ? `${report}\n\n${userMessage}` : userMessage,
      tool: this.tool() || 'default',
      type: this.type() || 'default'
    };
    const requestId = ++this.chatRequestId;
    this.stoppedRequestIds.delete(requestId);
    let reply = '';
    let botMessage: AiWorkspaceMessage | undefined;
    const updateReply = (value: string) => {
      if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
        return;
      }
      if (!botMessage) {
        botMessage = { id: crypto.randomUUID(), sender: 'bot', text: '', time: new Date() };
        this.chatMessages.push(botMessage);
      }
      botMessage.text = value;
      this.scrollToNewMessage();
    };
    const finishStream = () => {
      if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
        return;
      }
      this.activeChatRequest = undefined;
      this.isBotTyping = false;
      this.botStep = '';
      if (!reply.trim()) {
        this.chatMessages = botMessage ? this.chatMessages.filter(message => message.id !== botMessage?.id) : this.chatMessages;
        this.showErrorMessage(userMessage);
      }
      this.scrollToNewMessage();
    };

    this.activeChatRequest = this.nexusChatService.streamNexusChat(payload).subscribe({
      next: (chunk) => {
        if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
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
        finishStream();
      },
      error: () => {
        if (requestId !== this.chatRequestId || this.stoppedRequestIds.has(requestId)) {
          return;
        }
        this.activeChatRequest = undefined;
        this.chatMessages = botMessage ? this.chatMessages.filter(message => message.id !== botMessage?.id) : this.chatMessages;
        this.showErrorMessage(userMessage);
        this.isBotTyping = false;
        this.botStep = '';
        this.scrollToNewMessage();
      }
    });
  }

  private showErrorMessage(originalMessage: string): void {
    this.chatMessages.push({
      id: crypto.randomUUID(),
      sender: 'error',
      text: 'Something went wrong. try again.',
      time: new Date(),
      retryPayload: originalMessage
    });
  }

  retryMessage( payload: string ): void {
    if (this.isBotTyping) {
      return;
    }
    this.isBotTyping = true;
    this.botStep = '';
    this.scrollToNewMessage();
    this.aiSuggest(payload);
  }

  stopMessageGeneration(): void {
    this.stoppedRequestIds.add(this.chatRequestId);
    this.chatRequestId += 1;
    this.cancelActiveNexusRequest();
    this.chatMessages.push({
      id: crypto.randomUUID(),
      sender: 'error',
      text: 'Message canceled.',
      time: new Date()
    });
    this.isBotTyping = false;
    this.botStep = '';
    this.scrollToNewMessage();
  }

  startNewChat(): void {
    this.chatRequestId += 1;
    this.stoppedRequestIds.clear();
    this.cancelActiveNexusRequest();
    this.isBotTyping = false;
    this.botStep = '';
    this.nexusChatService.clearNexusSession().subscribe({
      next: () => this.resetChatView(),
      error: () => this.resetChatView(),
    });
  }

  openChat() {
    if (!this.subscriptionService.accountExpirable()) {
      this.dashboardService.showSubscription.set(true);
      return;
    }
    this.chatOpen = true;
    this.cdr.detectChanges();
    this.setupObserversIfPossible();
    this.queueComposerResize();
    this.scrollToBottom(true);
  }

  closeChat() {
    this.chatRequestId += 1;
    this.cancelActiveNexusRequest();
    this.isBotTyping = false;
    this.botStep = '';
    this.chatOpen = false;
    this.composerExpanded = false;
    this.io?.disconnect();
    this.mo?.disconnect();
    this.io = undefined;
    this.mo = undefined;
  }

  trackByIndex(index: number): number {
    return index;
  }

  pushButton(btn: HTMLButtonElement) {
    btn.classList.add('chat-bot-push-anim');
    setTimeout(() => {
      btn.classList.remove('chat-bot-push-anim');
    }, 150);
  }

  onMessagesScroll(): void {
    this.userNearBottom = this.isAtBottom(80);
  }

  resizeComposer(): void {
    const textarea = this.composerInput?.nativeElement;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const nextHeight = Math.min(120, Math.max(32, scrollHeight));
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
    this.composerExpanded = nextHeight > 32;
  }

  queueComposerResize(): void {
    requestAnimationFrame(() => this.resizeComposer());
  }

  private isAtBottom(threshold = 4): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) {
      return true;
    }
    return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold;
  }

  private cancelActiveNexusRequest(): void {
    if (this.activeChatRequest || this.isBotTyping) {
      this.nexusChatService.cancelNexusChat();
    }
    this.activeChatRequest?.unsubscribe();
    this.activeChatRequest = undefined;
  }

  private resetChatView(): void {
    this.chatMessages = [{
      id: crypto.randomUUID(),
      sender: 'bot',
      text: 'Hi there! How can I help you today?',
      time: new Date()
    }];
    this.newMessage = '';
    this.composerExpanded = false;
    this.queueComposerResize();
    this.scrollToBottom(true);
  }

  private scrollToNewMessage(): void {
    if (!this.userNearBottom) {
      return;
    }
    this.cdr.detectChanges();
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.scrollToBottom(true);
      });
    });
  }

  private scrollToBottom(_: boolean): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    this.userNearBottom = true;
  }

  private setupObserversIfPossible(): void {
    const rootEl = this.messagesContainer?.nativeElement;
    const sentinelEl = this.bottomSentinel?.nativeElement;
    if (!rootEl || !sentinelEl) {
      return;
    }
    if (!this.io) {
      this.io = new IntersectionObserver(entries => {
        this.userNearBottom = entries.some(e => e.isIntersecting); 
      }, { root: rootEl, threshold: 1 });
      this.io.observe(sentinelEl);
    }
    if (!this.mo) {
      this.mo = new MutationObserver(() => {
        if (this.userNearBottom || this.isBotTyping) {
          this.scrollToBottom(true);
        }
      });
      this.mo.observe(rootEl, { childList: true, subtree: true });
    }
  }
}
