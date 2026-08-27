import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExtensionPresence, ExtensionState } from '../model/extension/extension.model';

const LATEST_TTL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class SocialExtensionService {
  private latest = '';
  private latestAt = 0;
  private installedVersion = '';

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
      let deadlineReached = false;
      let latestSettled = false;

      const finish = (state: ExtensionState) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next(state);
        subscriber.complete();
      };
      const resolveState = () => {
        if (connected && this.outdated(this.installedVersion)) {
          finish('update');
          return;
        }
        finish(connected ? 'ready' : installed ? 'signin' : 'install');
      };
      const resolveWhenProbesSettle = () => {
        if (deadlineReached && latestSettled) {
          resolveState();
        }
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data as ExtensionPresence;
        if (event.source !== window || !data || data.source !== 'orion-extension' || data.type !== 'presence') {
          return;
        }
        installed = true;
        connected = data.connected === true;
        if (typeof data.version === 'string' && data.version) {
          this.installedVersion = data.version;
        }
        if (connected && latestSettled) {
          resolveState();
        }
        resolveWhenProbesSettle();
      };

      void this.refreshLatest().finally(() => {
        latestSettled = true;
        resolveWhenProbesSettle();
      });
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

  async refreshLatest(): Promise<void> {
    if (this.latest && Date.now() - this.latestAt < LATEST_TTL_MS) {
      return;
    }

    try {
      const response = await fetch('/api/social/extensions/version', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const body = await response.json() as { chrome?: string; firefox?: string };
      const value = /firefox/i.test(navigator.userAgent) ? body?.firefox : body?.chrome;
      if (typeof value === 'string' && value) {
        this.latest = value;
        this.latestAt = Date.now();
      }
    }
    catch {
      void 0;
    }
  }

  latestVersion(): string {
    return this.latest;
  }

  private outdated(installed: string): boolean {
    if (!installed || !this.latest) {
      return false;
    }

    const current = installed.split('.').map(part => Number.parseInt(part, 10) || 0);
    const target = this.latest.split('.').map(part => Number.parseInt(part, 10) || 0);
    for (let i = 0; i < Math.max(current.length, target.length); i += 1) {
      const diff = (current[i] ?? 0) - (target[i] ?? 0);
      if (diff !== 0) {
        return diff < 0;
      }
    }
    return false;
  }

  downloadUrl(browser: 'chrome' | 'firefox'): string {
    return browser === 'firefox'
      ? '/extensions/orion-extension-firefox.xpi'
      : '/extensions/orion-extension-chromium.crx';
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
