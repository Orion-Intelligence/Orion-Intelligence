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

  downloadUrl(browser: 'chrome' | 'firefox'): string {
    return `/api/social/extensions/download/${browser}`;
  }
}
