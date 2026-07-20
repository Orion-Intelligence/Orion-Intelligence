import { CommonModule } from '@angular/common';
import { Component, HostListener, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api.service';
import { AiChatSession, NexusChatSession } from '../../../../shared/model/nexus/ai-chat-session.model';
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { SidebarShellComponent } from '../../../graphs/shared/sidebar-shell/sidebar-shell.component';
import { NexusChatService } from '../nexus-chat.service';

@Component({
  selector: 'app-ai-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationPopupComponent, SidebarShellComponent, TooltipDirective, TranslatePipe],
  templateUrl: './ai-chat-sidebar.component.html',
})
export class AiChatSidebarComponent {
  readonly sessions = input<AiChatSession[]>([]);
  readonly activeSessionId = input<string | null>(null);
  readonly isBusy = input(false);
  readonly newChat = output<void>();
  readonly chatSelected = output<AiChatSession>();
  readonly sessionUpdated = output<AiChatSession>();
  readonly sessionDeleted = output<string>();
  openedSessionMenuId: string | null = null;
  deleteChatTarget: AiChatSession | null = null;
  renameChatTarget: AiChatSession | null = null;
  renameChatDraft = '';
  searchOpen = false;
  searchQuery = '';
  sharingSessionId: string | null = null;
  isCollapsed = false;

  constructor(private readonly nexusChatService: NexusChatService, private readonly api: ApiService) { }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    this.closeChatMenu();
  }

  startNewChat(): void {
    if (!this.isBusy()) {
      this.closeChatMenu();
      this.newChat.emit();
    }
  }

  selectChat(chat: AiChatSession): void {
    if (this.isBusy()) {
      return;
    }
    this.closeChatMenu();
    this.chatSelected.emit(chat);
  }

  toggleSearch(event?: Event): void {
    event?.stopPropagation();
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  toggleChatMenu(chat: AiChatSession, event: Event): void {
    event.stopPropagation();
    this.openedSessionMenuId = this.openedSessionMenuId === chat.sessionId ? null : chat.sessionId;
  }

  togglePinChat(chat: AiChatSession, event: Event): void {
    event.stopPropagation();
    this.nexusChatService.pinChatSession(chat.sessionId, !chat.isPinned).subscribe({
      next: updated => {
        this.sessionUpdated.emit(this.updatedSession(chat, updated));
        this.closeChatMenu();
      },
    });
  }

  shareChat(chat: AiChatSession, event: Event): void {
    event.stopPropagation();
    if (this.sharingSessionId) {
      return;
    }
    this.sharingSessionId = chat.sessionId;
    this.nexusChatService.getChat(chat.sessionId).subscribe({
      next: chatDetail => {
        const messages = chatDetail.messages.map(message => ({
          sender: message.sender,
          text: message.text,
          time: message.created_at,
        }));
        if (!messages.length) {
          this.finishSharing();
          return;
        }
        this.api.post<{ path: string }>('profile/chat-shares', { messages, expiresInHours: 168 }).subscribe({
          next: share => {
            window.open(new URL(share.path, window.location.origin).toString(), '_blank', 'noopener');
            this.finishSharing();
          },
          error: () => this.finishSharing(),
        });
      },
      error: () => this.finishSharing(),
    });
  }

  renameChat(chat: AiChatSession, event: Event): void {
    event.stopPropagation();
    this.renameChatTarget = chat;
    this.renameChatDraft = chat.title;
    this.closeChatMenu();
  }

  confirmRenameChat(): void {
    const title = this.renameChatDraft.trim();
    const chat = this.renameChatTarget;
    if (!chat || !title) {
      return;
    }
    this.nexusChatService.renameChatSession(chat.sessionId, title).subscribe({
      next: updated => {
        this.sessionUpdated.emit(this.updatedSession(chat, updated));
        this.closeRenameChatPopup();
      },
    });
  }

  closeRenameChatPopup(): void {
    this.renameChatTarget = null;
    this.renameChatDraft = '';
  }

  onRenameBackdrop(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.dataset?.['role'] === 'backdrop') {
      this.closeRenameChatPopup();
    }
  }

  deleteChat(chat: AiChatSession, event: Event): void {
    event.stopPropagation();
    this.deleteChatTarget = chat;
    this.closeChatMenu();
  }

  confirmDeleteChat(confirmed: boolean): void {
    const chat = this.deleteChatTarget;
    this.deleteChatTarget = null;
    if (!confirmed || !chat) {
      return;
    }
    this.nexusChatService.deleteChatSession(chat.sessionId).subscribe({
      next: () => this.sessionDeleted.emit(chat.sessionId),
    });
  }

  closeChatMenu(): void {
    this.openedSessionMenuId = null;
  }

  get filteredSessions(): AiChatSession[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.sessions();
    }
    return this.sessions().filter(chat => chat.title.toLowerCase().includes(query));
  }

  getChatInitial(chat: AiChatSession): string {
    return (chat.title || 'N').trim().charAt(0).toUpperCase() || 'N';
  }

  getChatTooltip(chat: AiChatSession): string {
    return chat.title || 'Nexus Chat';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeChatMenu();
  }

  private finishSharing(): void {
    this.sharingSessionId = null;
    this.closeChatMenu();
  }

  private updatedSession(current: AiChatSession, updated: NexusChatSession): AiChatSession {
    return {
      ...current,
      sessionId: updated.session_id || current.sessionId,
      title: updated.title || current.title,
      updatedAt: updated.updated_at || current.updatedAt,
      isPinned: updated.is_pinned ?? current.isPinned,
      pinnedAt: updated.pinned_at ?? current.pinnedAt ?? null,
    };
  }
}
