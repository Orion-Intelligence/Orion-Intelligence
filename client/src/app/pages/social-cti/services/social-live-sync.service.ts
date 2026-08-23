import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import type { social_profile, social_resource } from '../models/social.models';
import type { CrawlResultState, CrawlResultView } from '../models/social-usability.models';
import type { FetchTabKey } from '../enums/social-graph.enums';
import { SocialFetchService } from './social-fetch.service';
import { SocialStorageService } from './social-storage.service';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { crawlKey, getPlatformCardId, getProfileGroupKey, isSamePlatform, mergeResourcesById, resourceKey } from '../utils/social-profile.util';

@Injectable()
export class SocialLiveSyncService {
  private readonly fetchService = inject(SocialFetchService);
  private readonly storageService = inject(SocialStorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly maxSyncItems = 5000;

  readonly crawlResults = signal<Record<string, CrawlResultState>>({});
  readonly liveStop = new Set<string>();
  readonly stoppedPlatformIds = new Set<string>();

  crawlResultFor(platformData: social_profile, type: FetchTabKey): CrawlResultView {
    const state = this.crawlResults()[crawlKey(platformData, type)] ?? {};
    const collection = (platformData.resources ?? []).find(entry => entry.id === type);
    return { loading: state.loading, error: state.error, items: collection?.resources ?? state.items, login_url: state.login_url, count: state.count, log: state.log, lastSynced: collection?.last_synced };
  }

  stopSync(platformData: social_profile, type: FetchTabKey): void {
    const key = crawlKey(platformData, type);
    this.liveStop.add(key);
    this.crawlResults.update(current => ({ ...current, [key]: { ...current[key], loading: false } }));
    this.setSectionStatus(platformData, type, 'completed');
    this.fetchService.cancelProfileCrawl(platformData.meta.platform, platformData.meta.username, type).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  async startLiveFetch(platformData: social_profile, type: FetchTabKey, mode: 'all' | 'catchup'): Promise<void> {
    const cardId = getPlatformCardId(platformData);
    const key = crawlKey(platformData, type);
    if (this.crawlResults()[key]?.loading) {
      return;
    }
    const stopKey = key;
    this.liveStop.delete(stopKey);
    this.stoppedPlatformIds.delete(cardId);
    const existing = (this.findPlatform(platformData)?.resources ?? platformData.resources ?? []).find(entry => entry.id === type);
    const seen = new Set((existing?.resources ?? []).map(item => resourceKey(item as social_resource)));
    const hadPrior = seen.size > 0;
    this.crawlResults.update(current => ({ ...current, [key]: { loading: true, count: seen.size, log: '' } }));
    this.setSectionStatus(platformData, type, 'fetching');
    const url = buildSocialProfileUrl(platformData.meta.platform, platformData.meta.username, platformData.meta.url);
    const stopped = () => this.liveStop.has(stopKey) || this.stoppedPlatformIds.has(cardId);
    const runPage = async (cursor: string): Promise<{ items: social_resource[]; next?: string; more: boolean } | 'error' | null> => {
      let result;
      try {
        result = await firstValueFrom(this.fetchService.crawlProfile(platformData.meta.platform, platformData.meta.username, url, type, 'crawl', cursor));
      }
      catch {
        return null;
      }
      if (!result || result.idle) {
        return null;
      }
      if (result.error) {
        return 'error';
      }
      return { items: (result.items ?? []) as social_resource[], next: result.next_cursor, more: !!result.has_more };
    };

    let cursor = '';
    let stamped = false;
    while (!stopped()) {
      const page = await runPage(cursor);
      if (page === null) {
        break;
      }
      if (page === 'error') {
        this.crawlResults.update(current => ({ ...current, [key]: { loading: false, error: 'crawl_failed' } }));
        this.setSectionStatus(platformData, type, 'failed');
        return;
      }
      if (stopped()) {
        break;
      }
      const fresh = page.items.filter(item => {
        const itemKey = resourceKey(item); if (seen.has(itemKey)) {
          return false;
        } seen.add(itemKey); return true;
      });
      if (page.items.length) {
        this.storeLive(platformData, type, page.items);
        if (!stamped) {
          this.markSynced(platformData, type);
          stamped = true;
        }
      }
      const last = page.items[page.items.length - 1];
      this.crawlResults.update(current => ({ ...current, [key]: { loading: true, count: seen.size, log: last ? this.resourceLabel(last) : current[key]?.log } }));
      if (seen.size >= this.maxSyncItems) {
        break;
      }
      if (mode === 'catchup' && hadPrior && fresh.length === 0) {
        break;
      }
      if (!page.more || !page.next) {
        break;
      }
      cursor = page.next;
    }

    this.setSectionStatus(platformData, type, 'completed');
    this.crawlResults.update(current => ({ ...current, [key]: { loading: false, count: seen.size } }));
  }

  setSectionStatus(platformData: social_profile, section: string, status: string): void {
    let updatedProfiles: social_profile[] | null = null;
    const groupKey = getProfileGroupKey(this.storageService.state.scanResults(), platformData);
    this.storageService.state.scanResults.update(results => {
      const currentProfiles = results.get(groupKey);
      if (!currentProfiles) {
        return results;
      }
      let changed = false;
      const nextProfiles = currentProfiles.map(platform => {
        if (!isSamePlatform(platform, platformData) || (platform.section_status ?? {})[section] === status) {
          return platform;
        }
        changed = true;
        return { ...platform, section_status: { ...platform.section_status, [section]: status } };
      });
      if (!changed) {
        return results;
      }
      updatedProfiles = nextProfiles;
      return new Map(results).set(groupKey, nextProfiles);
    });
    if (updatedProfiles) {
      this.storageService.saveProfiles(groupKey, updatedProfiles, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  clearFetchingStatus(platformData: social_profile): void {
    let updatedProfiles: social_profile[] | null = null;
    const groupKey = getProfileGroupKey(this.storageService.state.scanResults(), platformData);
    this.storageService.state.scanResults.update(results => {
      const currentProfiles = results.get(groupKey);
      if (!currentProfiles) {
        return results;
      }
      let changed = false;
      const nextProfiles = currentProfiles.map(platform => {
        if (!isSamePlatform(platform, platformData)) {
          return platform;
        }
        const status = { ...(platform.section_status ?? {}) };
        for (const section of Object.keys(status)) {
          if (status[section] === 'fetching') {
            delete status[section];
            changed = true;
          }
        }
        return changed ? { ...platform, section_status: status } : platform;
      });
      if (!changed) {
        return results;
      }
      updatedProfiles = nextProfiles;
      return new Map(results).set(groupKey, nextProfiles);
    });
    if (updatedProfiles) {
      this.storageService.saveProfiles(groupKey, updatedProfiles, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  private storeLive(platformData: social_profile, type: FetchTabKey, resources: social_resource[]): void {
    let updatedProfiles: social_profile[] | null = null;
    const groupKey = getProfileGroupKey(this.storageService.state.scanResults(), platformData);
    this.storageService.state.scanResults.update(results => {
      const currentProfiles = results.get(groupKey);
      if (!currentProfiles) {
        return results;
      }
      updatedProfiles = currentProfiles.map(platform => {
        if (!isSamePlatform(platform, platformData)) {
          return platform;
        }
        const others = (platform.resources ?? []).filter(entry => entry.id !== type);
        const previous = (platform.resources ?? []).find(entry => entry.id === type);
        const merged = mergeResourcesById(previous?.resources ?? [], resources);
        return { ...platform, resources: [...others, { ...previous, id: type, is_parsed: true, resources: merged }] };
      });
      return new Map(results).set(groupKey, updatedProfiles);
    });
    if (updatedProfiles) {
      this.storageService.saveProfiles(groupKey, updatedProfiles, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  private markSynced(platformData: social_profile, type: FetchTabKey): void {
    let updatedProfiles: social_profile[] | null = null;
    const groupKey = getProfileGroupKey(this.storageService.state.scanResults(), platformData);
    const stamp = new Date().toISOString();
    this.storageService.state.scanResults.update(results => {
      const currentProfiles = results.get(groupKey);
      if (!currentProfiles) {
        return results;
      }
      updatedProfiles = currentProfiles.map(platform => {
        if (!isSamePlatform(platform, platformData)) {
          return platform;
        }
        const others = (platform.resources ?? []).filter(entry => entry.id !== type);
        const previous = (platform.resources ?? []).find(entry => entry.id === type);
        return { ...platform, resources: [...others, { ...previous, id: type, is_parsed: true, resources: previous?.resources ?? [], last_synced: stamp }] };
      });
      return new Map(results).set(groupKey, updatedProfiles);
    });
    if (updatedProfiles) {
      this.storageService.saveProfiles(groupKey, updatedProfiles, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  private resourceLabel(item: social_resource): string {
    const record = item as unknown as Record<string, unknown>;
    const pick = (...keys: string[]): string => {
      for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
      return '';
    };
    return pick('title', 'caption', 'name', 'real_name', 'display_name', 'author', 'username') || 'item';
  }

  private findPlatform(platformData: social_profile): social_profile | undefined {
    for (const [, profiles] of this.storageService.state.scanResults()) {
      const match = profiles.find(platform => isSamePlatform(platform, platformData));
      if (match) {
        return match;
      }
    }
    return undefined;
  }
}
