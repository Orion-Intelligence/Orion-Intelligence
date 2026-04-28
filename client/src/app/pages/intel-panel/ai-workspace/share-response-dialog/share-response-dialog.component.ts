import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { ResultRowHelperService } from '../../../../shared/services/result-row-helper.service';

@Component({
  selector: 'app-share-response-dialog',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './share-response-dialog.component.html',
})
export class ShareResponseDialogComponent {
  @Input() text = '';

  protected readonly copied = signal(false);
  protected readonly visible = signal(false);

  constructor(private readonly resultRowHelper: ResultRowHelperService) {}

  open(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.text.trim()) {
      return;
    }
    this.copied.set(false);
    this.visible.set(true);
  }

  close(): void {
    this.copied.set(false);
    this.visible.set(false);
  }

  copyText(): void {
    const text = this.text.trim();
    if (!text) {
      return;
    }
    this.resultRowHelper.copyToClipboard(text).subscribe((ok) => {
      if (ok) {
        this.copied.set(true);
      }
    });
  }

  canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as Navigator & { share?: (data: ShareData) => Promise<void>; }).share;
  }

  shareViaNative(): void {
    const text = this.text.trim();
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void>; };
    if (!text || !nav.share) {
      return;
    }
    void nav.share({ text }).then(() => this.close());
  }

  shareUrl(target: 'whatsapp' | 'telegram' | 'x' | 'email'): string {
    const encoded = encodeURIComponent(this.text);
    if (target === 'whatsapp') {
      return `https://wa.me/?text=${encoded}`;
    }
    if (target === 'telegram') {
      return `https://t.me/share/url?url=&text=${encoded}`;
    }
    if (target === 'x') {
      return `https://twitter.com/intent/tweet?text=${encoded}`;
    }
    return `mailto:?subject=${encodeURIComponent('Nexus response')}&body=${encoded}`;
  }
}
