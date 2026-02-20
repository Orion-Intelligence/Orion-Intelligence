import { isPlatformBrowser, NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { popupAnimation, overlayAnimation } from '../../animations/popup.animations';
import { finalize } from 'rxjs';
import { ensureStylesheet } from '../../utils/stylesheet-loader.util';
@Component({
  selector: 'app-support',
  imports: [NgIf, NgClass, FormsModule],
  templateUrl: './support.component.html',
  animations: [popupAnimation, overlayAnimation],
})
export class SupportComponent implements OnInit, OnDestroy {
    @Output() closePopup = new EventEmitter<void>();
    isTailwindReady = false;
    isSubmitting = false;
    submitAttempted = false;
    errorMessage: string | null = null;

    private readonly twId = 'tailwind-support-styles';
    private tailwindLinkEl: HTMLLinkElement | null = null;
    private ownsTailwindLink = false;

    supportModel = { email: '', subject: '', message: '' };

    constructor( @Inject(PLATFORM_ID) private readonly platformId: object, private apiService: ApiService, private messageNotificationService: MessageNotificationService ) { }

    ngOnInit(): void {
      if (!isPlatformBrowser(this.platformId)) {
        this.isTailwindReady = true;
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
      this.submitAttempted = true;
      this.errorMessage = null;
      if (!this.supportModel.email ||
            !this.supportModel.subject ||
            !this.supportModel.message) {
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(this.supportModel.email)) {
        return;
      }
      if (this.isSubmitting) {
        return;
      }
      this.isSubmitting = true;
      this.apiService.post('support', this.supportModel).pipe(finalize(() => this.isSubmitting = false)).subscribe({
        next: () => {
          this.messageNotificationService.show('Message sent successfully!', 'success');
          this.close();
        },
        error: (err) => {
          const mess = this.getErrorMessage(err);
          this.errorMessage = mess;
          this.messageNotificationService.show(mess, 'fail');
        }
      });
    }

    private resetForm() {
      this.submitAttempted = false;
      this.errorMessage = null;
      this.supportModel = {
        email: '',
        subject: '',
        message: ''
      };
    }

    private getErrorMessage(err: unknown): string {
      const error = err as {
            error?: {
                detail?: string;
                message?: string;
            };
        } | null | undefined;
      return error?.error?.detail || error?.error?.message || 'Failed to send message';
    }

    private loadTailwindStyles(): void {
      const stylesheet = ensureStylesheet(this.twId, 'tailwind-social.css', () => {
        this.isTailwindReady = true; 
      });
      this.tailwindLinkEl = stylesheet.linkEl;
      this.ownsTailwindLink = stylesheet.ownsLink;
    }
}
