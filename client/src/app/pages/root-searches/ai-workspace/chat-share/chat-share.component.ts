import { CommonModule, DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../shared/services/api.service';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { MessageScrollRailComponent } from '../message-scroll-rail/message-scroll-rail.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

type SharedChatMessage = {
  sender: 'user' | 'bot';
  text: string;
  time: Date;
};

@Component({
  selector: 'app-chat-share',
  standalone: true,
  imports: [CommonModule, DatePipe, MessageScrollRailComponent, MarkdownPipe, TranslatePipe],
  templateUrl: './chat-share.component.html',
})
export class ChatShareComponent implements OnInit, OnDestroy {
  private previousTheme: 'light-theme' | 'dark-theme' | null = null;
  private previousTitle = '';

  messages: SharedChatMessage[] = [];
  expiresAt: Date | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService, private readonly title: Title) { }

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();
    this.title.setTitle('Shared Chat');
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
    if (this.previousTitle) {
      this.title.setTitle(this.previousTitle);
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
