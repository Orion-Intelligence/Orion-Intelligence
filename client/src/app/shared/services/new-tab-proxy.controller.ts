import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProxyController {
  private isInitialized = false;
  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (event.button !== 0 || event.defaultPrevented) {
      return;
    }

    const rawTarget = event.target;
    const eventTarget = rawTarget instanceof Element
      ? rawTarget
      : rawTarget instanceof Node
        ? rawTarget.parentElement
        : null;
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
    try {
      return new URL(rawUrl, window.location.href).toString();
    }
    catch {
      return rawUrl;
    }
  }
}
