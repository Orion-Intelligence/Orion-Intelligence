import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { chatBotAnimation } from '../../animations/chat.bot.animation';
type ChatApiResponse = {
  result?: string;
  reply?: string;
  message?: string;
  text?: string;
  [k: string]: unknown;
};

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css'],
  animations: [chatBotAnimation]
})
export class ChatWidgetComponent implements OnInit {
  @Input() reportText: string | undefined;
  chatMessages: { id: string; sender: 'user' | 'bot' | 'error'; text: string; time: Date; retryPayload?: { message: string; report?: string }; }[] = [];
  isBotTyping = false;
  newMessage = '';
  chatOpen = false;
  private sessionId = '';

  constructor(private api: ApiService, private authService: AuthService, private dashboardService: DashboardService) {
  }

  ngOnInit(): void {

    this.authService.getUsername$().subscribe(u => {
      this.sessionId = (u || '').trim() || crypto.randomUUID();
      if (this.chatMessages.length === 0) {
        this.chatMessages.push({
          id: this.sessionId,
          sender: 'bot',
          text: 'Hi there! How can I help you today?',
          time: new Date()
        });
      }
    });
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    const text = this.newMessage.trim();
    if (!text) return;

    this.chatMessages.push({ id: this.sessionId, sender: 'user', text, time: new Date() });
    this.newMessage = '';
    this.isBotTyping = true;
    this.aiSuggest(text);
  }

  aiSuggest(userMessage: string): void {
    if (this.authService.getRole() !== 'admin') {
      this.showErrorMessage(userMessage);
      return;
    }

    const payload = {
      session_id: this.sessionId,
      message: userMessage,
      report: this.reportText
    };

    this.api.post<ChatApiResponse>('nlp/chat/report', payload).subscribe({
      next: (response) => {
        const reply =
          (response?.result ?? response?.reply ?? response?.message ?? response?.text ?? '').toString().trim();

        if (!reply) {
          this.showErrorMessage(userMessage);
        } else {
          this.chatMessages.push({ id: this.sessionId, sender: 'bot', text: reply, time: new Date() });
        }
        this.isBotTyping = false;
      },
      error: () => {
        this.showErrorMessage(userMessage);
        this.isBotTyping = false;
      }
    });
  }

  private showErrorMessage(originalMessage: string): void {
    this.chatMessages.push({
      id: this.sessionId,
      sender: 'error',
      text: 'Something went wrong. Please try again.',
      time: new Date(),
      retryPayload: { message: originalMessage, report: this.reportText }
    });
  }
  retryMessage(payload: { message: string; report?: string }): void {
    this.isBotTyping = true;
    this.aiSuggest(payload.message);
  }


  openChat() {
    if (this.authService.getRole() !== 'admin') {
      this.dashboardService.showSubscription.set(true);
      return;
    }
    this.chatOpen = true
  }
  closeChat() {
    this.chatOpen = false;
  }
  trackByIndex(index: number): number {
    return index;
  }
  pushButton(btn: HTMLButtonElement) {
    btn.classList.add('chat-bot-push-anim');
    setTimeout(() => btn.classList.remove('chat-bot-push-anim'), 150);
  }
}
