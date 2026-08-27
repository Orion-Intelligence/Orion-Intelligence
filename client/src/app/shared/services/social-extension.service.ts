import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExtensionPresence, ExtensionState } from '../model/extension/extension.model';

const EXTENSION_STORE_URL = 'https://addons.mozilla.org/en-US/firefox/addon/orion-social/';

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

      const finish = (state: ExtensionState) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next(state);
        subscriber.complete();
      };
      const resolveState = () => {
        // No presence has arrived this probe -> indeterminate, not "not installed".
        // A slow round-trip (e.g. the page is busy crawling) must never flash the install/connect gate.
        if (!installed) {
          // No presence this probe. The content script stamps the page on load, so its absence means the
          // extension is genuinely removed -> conclude 'install' fast (no long loader on an obvious case).
          // If it IS stamped, the extension is present but slow to answer -> stay indeterminate ('checking').
          const stamped = typeof document !== 'undefined'
            && document.documentElement?.getAttribute('data-orion-extension') === 'installed';
          finish(stamped ? 'checking' : 'install');
          return;
        }
        finish(connected ? 'ready' : 'signin');
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data as ExtensionPresence;
        if (event.source !== window || !data || data.source !== 'orion-extension' || data.type !== 'presence') {
          return;
        }
        installed = true;
        connected = data.connected === true;
        resolveState();
      };

      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'orion-app', type: 'ping' }, '*');
      const presenceTimer = setTimeout(resolveState, 1000);
      const hardTimer = setTimeout(resolveState, 1500);

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

  storeUrl(_browser: 'chrome' | 'firefox'): string {
    return EXTENSION_STORE_URL;
  }

  private isSupportedBrowser(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    if (/Firefox\//.test(navigator.userAgent)) {
      return true;
    }
    const brands = (navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData?.brands;
    if (!brands?.length) {
      return false;
    }
    const names = brands.map(entry => entry.brand);
    return names.some(name => /chromium/i.test(name)) && !names.some(name => /google chrome|opera|edge|brave|vivaldi|yandex|samsung/i.test(name));
  }
}
