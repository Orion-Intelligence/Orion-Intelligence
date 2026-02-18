import { isPlatformBrowser, NgIf } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';


@Component({
  selector: 'app-support',
  imports: [NgIf, FormsModule],
  templateUrl: './support.component.html',
})
export class SupportComponent implements OnInit, OnDestroy {
  @Output() closePopup = new EventEmitter<void>();

  isTailwindReady = signal(false);

  private readonly twId = 'tailwind-support-styles';
  private tailwindLinkEl: HTMLLinkElement | null = null;
  private ownsTailwindLink = false;

  supportModel = {
    email: '',
    subject: '',
    message: ''
  };

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private apiService: ApiService,
    private messageNotificationService: MessageNotificationService
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isTailwindReady.set(true);
      return;
    }
    this.loadTailwindStyles();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.ownsTailwindLink) {
      this.tailwindLinkEl?.remove();
      this.tailwindLinkEl = null;
    }
  }

  close() {
    this.resetForm();
    this.closePopup.emit();
  }

  submit() {

    if (!this.supportModel.email ||
      !this.supportModel.subject ||
      !this.supportModel.message) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.supportModel.email)) {
      return;
    }


    this.apiService.post('support', this.supportModel).subscribe({
      next: () => {
        this.messageNotificationService.show("Message sent successfully!");
        this.close();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'Failed to send message';
        this.messageNotificationService.show(mess);
      }
    });
  }

  private resetForm() {
    this.supportModel = {
      email: '',
      subject: '',
      message: ''
    };
  }

  private loadTailwindStyles(): void {
    const existingLink = document.getElementById(this.twId) as HTMLLinkElement | null;
    if (existingLink) {
      this.tailwindLinkEl = existingLink;
      if (existingLink.dataset['ready'] === 'true' || !!existingLink.sheet) {
        this.isTailwindReady.set(true);
        return;
      }
      existingLink.addEventListener('load', () => this.isTailwindReady.set(true), { once: true });
      existingLink.addEventListener('error', () => this.isTailwindReady.set(true), { once: true });
      return;
    }

    const link = document.createElement('link');
    link.id = this.twId;
    link.rel = 'stylesheet';
    link.href = 'tailwind-social.css';
    link.addEventListener('load', () => {
      link.dataset['ready'] = 'true';
      this.isTailwindReady.set(true);
    }, { once: true });
    link.addEventListener('error', () => this.isTailwindReady.set(true), { once: true });
    document.head.appendChild(link);
    this.tailwindLinkEl = link;
    this.ownsTailwindLink = true;
  }
}
