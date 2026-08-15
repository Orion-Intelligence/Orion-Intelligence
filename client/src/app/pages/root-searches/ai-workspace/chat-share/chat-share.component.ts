import { CommonModule, DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../shared/services/api.service';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { MessageScrollRailComponent } from '../message-scroll-rail/message-scroll-rail.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { HeaderComponent } from '../../../../shared/partials/header/login-header/header.component';
import { TranslationService } from '../../../../shared/services/translation.service';

type SharedChatMessage = {
  sender: 'user' | 'bot';
  text: string;
  time: Date;
};

@Component({
  selector: 'app-chat-share',
  standalone: true,
  imports: [CommonModule, DatePipe, HeaderComponent, MessageScrollRailComponent, MarkdownPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './chat-share.component.html',
})
export class ChatShareComponent implements OnInit, OnDestroy {
  private previousTitle = '';

  messages: SharedChatMessage[] = [];
  expiresAt: Date | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService, private readonly title: Title, private readonly translationService: TranslationService) { }

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();
    this.title.setTitle(this.translationService.translate('Shared Chat'));
    const shareId = this.route.snapshot.paramMap.get('shareId') || '';
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!shareId || !token) {
      this.errorMessage = this.translationService.translate('Invalid share link.');
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
        this.errorMessage = err?.error?.detail || this.translationService.translate('This share link is unavailable.');
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.previousTitle) {
      this.title.setTitle(this.previousTitle);
    }
  }

  trackMessage(index: number): number {
    return index;
  }
}
