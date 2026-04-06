import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProxyService {
  static isOnionHost(hostname: string): boolean {
    return /^(?:[a-z0-9-]+\.)*[a-z2-7]{16,56}\.onion$/i.test(hostname);
  }

  static buildExternalNavigationUrl(url?: string | null, currentHost = typeof window !== 'undefined' ? window.location.hostname : ''): string {
    if (!url) {
      return '';
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const leadingHost = trimmed.split('/')[0] || '';
    const normalized = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : ProxyService.isOnionHost(leadingHost) ? `http://${trimmed}` : `https://${trimmed}`;

    try {
      const parsed = new URL(normalized);
      if (ProxyService.isOnionHost(parsed.hostname) && !ProxyService.isOnionHost(currentHost)) {
        return `/tor2web?url=${encodeURIComponent(parsed.toString())}`;
      }
      return parsed.toString();
    }
    catch {
      return normalized;
    }
  }

  isOnionHost(hostname: string): boolean {
    return ProxyService.isOnionHost(hostname);
  }

  buildExternalNavigationUrl(url?: string | null, currentHost = typeof window !== 'undefined' ? window.location.hostname : ''): string {
    return ProxyService.buildExternalNavigationUrl(url, currentHost);
  }
}
