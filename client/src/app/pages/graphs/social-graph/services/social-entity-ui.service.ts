import { Injectable } from '@angular/core';

import { CustomEntity } from '../../../../shared/model/social/social-scan.models';

@Injectable({
  providedIn: 'root'
})
export class SocialEntityUiService {
  private static readonly CONNECTION_PLATFORMS = new Set(['instagram', 'facebook', 'youtube', 'twitter']);
  private static readonly FOLLOW_PLATFORMS = new Set(['instagram', 'twitter', 'behance', 'behnace', 'facebook']);

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
      case 'domain-scan': return 'bi bi-globe2 text-sky-400';
      case 'subdomains-scan': return 'bi bi-diagram-3 text-sky-400';
      case 'dns-scan': return 'bi bi-broadcast text-sky-400';
      case 'wayback-scan': return 'bi bi-clock-history text-sky-400';
      case 'email-breach': return 'bi bi-person-badge text-indigo-400';
      case 'social-scanner': return 'bi bi-people text-indigo-400';
      case 'wanted-list': return 'bi bi-person-exclamation text-indigo-400';
      case 'national-identity': return 'bi bi-card-text text-indigo-400';
      case 'playstore-scanner': return 'bi bi-google-play text-indigo-400';
      case 'software-scanner': return 'bi bi-window text-indigo-400';
      case 'phone': return 'bi bi-telephone text-indigo-400';
      case 'ioc-extract': return 'bi bi-file-earmark-code text-indigo-400';
      case 'apk-scan': return 'bi bi-android2 text-indigo-400';
      case 'crypto-scanner': return 'bi bi-currency-bitcoin text-green-400';
      default: return 'bi bi-circle text-slate-400';
    }
  }

  pruneAnimatedProgressMap<T extends { id: string }>(items: T[], current: Record<string, number>): Record<string, number> | null {
    const activeIds = new Set(items.map(item => item.id));
    const next: Record<string, number> = {};
    let changed = false;

    for (const key of Object.keys(current)) {
      if (activeIds.has(key)) {
        next[key] = current[key];
      }
      else {
        changed = true;
      }
    }

    return changed ? next : null;
  }

  normalizeUsernames(usernames: string[] | null | undefined): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const name of usernames || []) {
      const trimmed = String(name || '').trim();
      if (!trimmed) {
        continue;
      }

      const normalized = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
      if (!normalized) {
        continue;
      }

      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(normalized);
    }

    return result;
  }

  normalizePlatformName(platformName: string | null | undefined): string {
    return String(platformName || '').trim().toLowerCase();
  }

  supportsPostConnections(platformName: string | null | undefined): boolean {
    return SocialEntityUiService.CONNECTION_PLATFORMS.has(this.normalizePlatformName(platformName));
  }

  supportsFollowersFollowing(platformName: string | null | undefined): boolean {
    return SocialEntityUiService.FOLLOW_PLATFORMS.has(this.normalizePlatformName(platformName));
  }

  parseTokens(input: string): string[] {
    return String(input || '')
      .split(/[,\n\r\t]+|\s+/)
      .map(token => token.trim())
      .filter(Boolean);
  }

  toTitleCase(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
