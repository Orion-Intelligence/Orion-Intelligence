import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, signal } from '@angular/core';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { ResultRowHelperService } from '../../services/result-row-helper.service';

type ShareTarget = 'whatsapp' | 'telegram' | 'x' | 'linkedin' | 'reddit' | 'email';

interface ShareDestination {
  target: ShareTarget;
  label: string;
  icon: string;
  iconShellClass: string;
}

const SHARE_DESTINATIONS: ShareDestination[] = [
  { target: 'whatsapp', label: 'WhatsApp', icon: 'bi-whatsapp', iconShellClass: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200 group-hover:bg-emerald-500/25' },
  { target: 'telegram', label: 'Telegram', icon: 'bi-telegram', iconShellClass: 'border-sky-400/30 bg-sky-500/15 text-sky-200 group-hover:bg-sky-500/25' },
  { target: 'x', label: 'X', icon: 'bi-twitter-x', iconShellClass: 'border-white/15 bg-white/10 text-white group-hover:bg-white/15' },
  { target: 'linkedin', label: 'LinkedIn', icon: 'bi-linkedin', iconShellClass: 'border-blue-400/30 bg-blue-500/15 text-blue-200 group-hover:bg-blue-500/25' },
  { target: 'reddit', label: 'Reddit', icon: 'bi-reddit', iconShellClass: 'border-orange-300/30 bg-orange-400/15 text-orange-100 group-hover:bg-orange-400/25' },
  { target: 'email', label: 'Email', icon: 'bi-envelope-fill', iconShellClass: 'border-amber-300/30 bg-amber-400/15 text-amber-100 group-hover:bg-amber-400/25' },
];

@Component({
  selector: 'app-share-response-dialog',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './share-response-dialog.component.html',
})
export class ShareResponseDialogComponent implements AfterViewInit, OnDestroy {
  protected readonly destinations = SHARE_DESTINATIONS;
  protected readonly copied = signal(false);
  protected readonly visible = signal(false);

  @Input() text = '';
  @Input() title = 'Share';
  @Input() description = 'Send this text or copy it.';
  @Input() emailSubject = 'Shared response';

  constructor(private readonly resultRowHelper: ResultRowHelperService, private readonly host: ElementRef<HTMLElement>, @Inject(DOCUMENT) private readonly document: Document) {}

  ngAfterViewInit(): void {
    this.document.body.appendChild(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
  }

  protected get shareText(): string {
    return this.text.trim();
  }

  protected get characterCount(): number {
    return this.shareText.length;
  }

  open(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.shareText) {
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
    const text = this.shareText;
    if (!text) {
      return;
    }
    this.resultRowHelper.copyToClipboard(text).subscribe((ok) => {
      if (ok) {
        this.copied.set(true);
        window.setTimeout(() => this.copied.set(false), 1400);
      }
    });
  }

  canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as Navigator & { share?: (data: ShareData) => Promise<void>; }).share;
  }

  shareViaNative(): void {
    const text = this.shareText;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void>; };
    if (!text || !nav.share) {
      return;
    }
    void nav.share({ text }).then(() => this.close()).catch(() => undefined);
  }

  shareUrl(target: ShareTarget): string {
    const encoded = encodeURIComponent(this.shareText);
    if (target === 'whatsapp') {
      return `https://wa.me/?text=${encoded}`;
    }
    if (target === 'telegram') {
      return `https://t.me/share/url?url=&text=${encoded}`;
    }
    if (target === 'x') {
      return `https://twitter.com/intent/tweet?text=${encoded}`;
    }
    if (target === 'linkedin') {
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`;
    }
    if (target === 'reddit') {
      return `https://www.reddit.com/submit?title=${encodeURIComponent(this.emailSubject)}&text=${encoded}`;
    }
    return `mailto:?subject=${encodeURIComponent(this.emailSubject)}&body=${encoded}`;
  }
}
