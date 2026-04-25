import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { chatBotAnimation } from '../../../../shared/animations/chat.bot.animation';
import { overlayFadeAnimation } from '../../../../shared/animations/chat.overlay.animation';
import { SubscriptionService } from '../../../../services/dashboard/subscription.service';
import { AppService } from '../../../../services/core/app/app.service';
import { NexusChatService } from '../nexus-chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  animations: [chatBotAnimation, overlayFadeAnimation]
})
export class ChatWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private userNearBottom = true;
  private io?: IntersectionObserver;
  private mo?: MutationObserver;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('bottomSentinel') bottomSentinel!: ElementRef<HTMLElement>;
  chatMessages: { id: string; sender: 'user' | 'bot' | 'error'; text: string; time: Date; retryPayload?: { message: string; report?: string; }; }[] = [];
  isBotTyping = false;
  botStep = '';
  newMessage = '';
  chatOpen = false;
  readonly reportText = input<string>();

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
    this.io?.disconnect();
    this.mo?.disconnect();
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    if (this.isBotTyping) {
      return;
    }
    const text = this.newMessage.trim();
    if (!text) {
      return;
    }
    this.chatMessages.push({ id: crypto.randomUUID(), sender: 'user', text, time: new Date() });
    this.newMessage = '';
    this.isBotTyping = true;
    this.botStep = '';
    this.scrollToNewMessage();
    this.aiSuggest(text);
  }

  aiSuggest(userMessage: string): void {
    if (!this.subscriptionService.accountExpirable()) {
      this.showErrorMessage(userMessage);
      this.isBotTyping = false;
      this.scrollToNewMessage();
      return;
    }
    const payload = {
      message: userMessage,
      report: this.reportText()
    };
    this.nexusChatService.pollNexusReportChat(payload).subscribe({
      next: (response) => {
        if (this.nexusChatService.isNexusPending(response)) {
          this.botStep = this.nexusChatService.getNexusStep(response);
          this.scrollToNewMessage();
          return;
        }

        const reply = this.nexusChatService.getNexusChatReply(response);
        if (!reply || (typeof response.message === 'string' && response.message.includes('went wrong'))) {
          this.showErrorMessage(userMessage);
        }
        else {
          this.chatMessages.push({ id: crypto.randomUUID(), sender: 'bot', text: reply, time: new Date() });
        }
        this.isBotTyping = false;
        this.botStep = '';
        this.scrollToNewMessage();
      },
      error: () => {
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
      retryPayload: { message: originalMessage, report: this.reportText() }
    });
  }

  retryMessage( payload: { message: string; report?: string; } ): void {
    this.isBotTyping = true;
    this.botStep = '';
    this.scrollToNewMessage();
    this.aiSuggest(payload.message);
  }

  openChat() {
    if (!this.subscriptionService.accountExpirable()) {
      this.dashboardService.showSubscription.set(true);
      return;
    }
    this.chatOpen = true;
    this.cdr.detectChanges();
    this.setupObserversIfPossible();
    this.scrollToBottom(true);
  }

  closeChat() {
    this.chatOpen = false;
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

  private isAtBottom(threshold = 4): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) {
      return true;
    }
    return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold;
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
