import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExtensionPresence, ExtensionSession, ExtensionState } from '../model/extension/extension.model';

@Injectable({ providedIn: 'root' })
export class SocialExtensionService {
  detect(): Observable<ExtensionState> {
    return new Observable<ExtensionState>(subscriber => {
      if (!this.isSupportedBrowser()) {
        subscriber.next('unsupported');
        subscriber.complete();
        return;
      }

      let settled = false;
      let installed = false;
      let connected = false;
      let sessionSettled = false;
      let deadlineReached = false;

      const marker = () => (typeof document !== 'undefined' ? !!document.documentElement.getAttribute('data-orion-extension') : false);
      const finish = (state: ExtensionState) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next(state);
        subscriber.complete();
      };
      const resolveState = () => finish(connected ? 'ready' : installed || marker() ? 'signin' : 'install');
      const resolveWhenProbesSettle = () => {
        if (deadlineReached && sessionSettled) {
          resolveState();
        }
      };

      fetch('/api/extension/session', { credentials: 'include', cache: 'no-store' })
        .then(response => (response.ok ? response.json() : null))
        .then((body: ExtensionSession | null) => {
          if (body) {
            installed = true;
          }
          connected = body?.extension_connected === true;
          if (connected) {
            resolveState();
          }
        })
        .catch(() => void 0)
        .finally(() => {
          sessionSettled = true;
          resolveWhenProbesSettle();
        });

      const onMessage = (event: MessageEvent) => {
        const data = event.data as ExtensionPresence;
        if (event.source !== window || !data || data.source !== 'orion-extension' || data.type !== 'presence') {
          return;
        }
        installed = true;
        resolveWhenProbesSettle();
      };

      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'orion-app', type: 'ping' }, '*');
      const presenceTimer = setTimeout(() => {
        deadlineReached = true;
        resolveWhenProbesSettle();
      }, 2000);
      const hardTimer = setTimeout(resolveState, 3000);

      return () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(presenceTimer);
        clearTimeout(hardTimer);
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

  private isSupportedBrowser(): boolean {
    return typeof navigator !== 'undefined' && /(?:Firefox|Chrome|Chromium)\//.test(navigator.userAgent);
  }
}
