import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ExtensionState = 'ready' | 'signin' | 'install';

interface ExtensionPresence {
  source?: string;
  type?: string;
  loggedIn?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SocialExtensionService {
  detect(): Observable<ExtensionState> {
    return new Observable<ExtensionState>(subscriber => {
      let settled = false;
      const finish = (state: ExtensionState) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next(state);
        subscriber.complete();
      };
      const marker = () => (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-orion-extension') : null);

      fetch('/api/extension/session', { credentials: 'include', cache: 'no-store' }).then(response => {
        if (response.ok) {
          finish('ready');
        }
      }).catch(() => void 0);

      const onMessage = (event: MessageEvent) => {
        const data = event.data as ExtensionPresence;
        if (event.source !== window || !data || data.source !== 'orion-extension' || data.type !== 'presence') {
          return;
        }
        finish(data.loggedIn ? 'ready' : 'signin');
      };

      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'orion-app', type: 'ping' }, '*');
      const timer = setTimeout(() => finish(marker() ? 'signin' : 'install'), 2000);

      return () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
      };
    });
  }

  openExtension(): void {
    window.postMessage({ source: 'orion-app', type: 'open' }, '*');
  }

  crawlProfile(platform: string, url: string): Observable<Record<string, unknown> | null> {
    return new Observable<Record<string, unknown> | null>(subscriber => {
      let settled = false;
      const finish = (profile: Record<string, unknown> | null) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next(profile);
        subscriber.complete();
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data as { source?: string; type?: string; items?: Record<string, unknown>[] };
        if (event.source !== window || !data || data.source !== 'orion-extension' || data.type !== 'crawl-result') {
          return;
        }
        finish(data.items?.[0] ?? null);
      };

      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'orion-app', type: 'crawl', platform, url }, '*');
      const timer = setTimeout(() => finish(null), 30000);

      return () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
      };
    });
  }

  downloadUrl(browser: 'chrome' | 'firefox'): string {
    return `/api/social/extensions/download/${browser}`;
  }
}
