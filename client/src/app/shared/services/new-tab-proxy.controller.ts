import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewTabProxyController {
  private isInitialized = false;
  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (event.button !== 0 || event.defaultPrevented) {
      return;
    }

    const eventTarget = event.target as Element | null;
    const anchor = eventTarget?.closest?.('a[target="_blank"][href]') as HTMLAnchorElement | null;
    if (!anchor) {
      return;
    }

    const href = anchor.href?.trim();
    if (!href || href.startsWith('javascript:')) {
      return;
    }

    event.preventDefault();
    this.open(href);
  };

  initialize(): void {
    if (this.isInitialized || typeof document === 'undefined') {
      return;
    }

    document.addEventListener('click', this.handleDocumentClick, true);
    this.isInitialized = true;
  }

  open(url?: string | null): void {
    const targetUrl = this.resolveTargetUrl(url);
    if (!targetUrl || typeof window === 'undefined') {
      return;
    }

    const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (openedWindow) {
      openedWindow.opener = null;
    }
  }

  private resolveTargetUrl(url?: string | null): string {
    const rawUrl = String(url || '').trim();
    if (!rawUrl || typeof window === 'undefined') {
      return '';
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl, window.location.href);
    }
    catch {
      return rawUrl;
    }

    if (parsedUrl.hostname.endsWith('.onion')) {
      return `${window.location.origin}/tor2web?url=${encodeURIComponent(parsedUrl.toString())}`;
    }

    return parsedUrl.toString();
  }
}
