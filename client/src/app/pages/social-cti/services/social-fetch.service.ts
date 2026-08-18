import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { social_online_presence_hit } from '../models/social.models';
import { social_stealer_log } from '../models/social.models';
import { ApiEnvelope } from '../models/social-usability.models';
@Injectable({ providedIn: 'root' })
export class SocialFetchService {
  constructor(private api: ApiService) {}

  crawlProfile(platform: string, username: string, url: string, type: string, command = 'crawl'): Observable<{ items?: unknown[]; error?: string; idle?: boolean }> {
    return timer(0, 3000).pipe(switchMap(() => this.api.post<{ result?: { profile?: unknown; items?: unknown[] }; error?: string; status?: string }>('social/profile', { platform, username, url, type, command })),
      map(response => ({
        pending: response?.status === 'pending',
        idle: response?.status === 'idle',
        items: (response?.result?.items ?? (response?.result?.profile ? [response.result.profile] : [])) as unknown[],
        error: response?.error,
      })),
      filter(result => !result.pending),
      take(1),
      map(result => result.idle ? { idle: true } : { items: result.items, error: result.error }),
      catchError(() => of<{ items?: unknown[]; error?: string; idle?: boolean }>({ items: [], error: 'crawl_failed' })));
  }

  fetchStealerLogsByIdentity(query: string): Observable<social_stealer_log[]> {
    const payload = { daterange: '', q: '', url: '', user: query, ioc: `m_search_all:${query}`, type: 'c', page: 1, category: '', fullsearch: false };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map(response => response?.Result ?? response?.result?.Result ?? response?.data?.Result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  fetchPlatformStealerLogs(username: string, domain: string): Observable<social_stealer_log[]> {
    const payload = { daterange: '', q: '', url: domain || '', user: username, ioc: domain ? `m_username:${username} AND m_domain:${domain}` : `m_search_all:${username}`, type: 'c', page: 1, category: '', fullsearch: false };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map(response => response?.Result ?? response?.result?.Result ?? response?.data?.Result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  fetchWantedList(query: string): Observable<any[]> {
    return this.api.post<any>('dynamic/wanted', { text: { query } }).pipe(map(response => response?.cards_data ?? response?.data?.cards_data ?? response?.result?.cards_data ?? response?.result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch wanted list'))));
  }

  fetchProfileMetadataTokens(tokens: string[], username: string, platform?: string): Observable<social_online_presence_hit[]> {
    const payload: { tokens: string[]; username: string; platform?: string } = { tokens, username };
    if (platform) {
      payload.platform = platform;
    }
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<{ results?: social_online_presence_hit[] }>>('social/metadata', payload)),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => response.result?.results ?? []));
  }
}
