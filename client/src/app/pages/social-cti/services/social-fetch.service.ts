import { Injectable } from '@angular/core';
import { EMPTY, Observable, of, throwError, timer } from 'rxjs';
import { catchError, expand, filter, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { social_online_presence_hit } from '../models/social.models';
import { social_stealer_log } from '../models/social.models';
import { ApiEnvelope } from '../models/social-usability.models';
@Injectable({ providedIn: 'root' })
export class SocialFetchService {
  constructor(private api: ApiService) {}

  crawlProfile(platform: string, username: string, url: string, type: string, command = 'crawl', cursor = ''): Observable<{ items?: unknown[]; error?: string; idle?: boolean; next_cursor?: string; has_more?: boolean; login_url?: string }> {
    return timer(0, 3000).pipe(switchMap(() => this.api.post<{ result?: { profile?: unknown; items?: unknown[]; next_cursor?: string; has_more?: boolean }; error?: string; status?: string; login_url?: string }>('social/profile', { platform, username, url, type, command, cursor })),
      map(response => ({
        pending: response?.status === 'pending',
        idle: response?.status === 'idle',
        items: (response?.result?.items ?? (response?.result?.profile ? [response.result.profile] : [])) as unknown[],
        next_cursor: response?.result?.next_cursor,
        has_more: response?.result?.has_more,
        error: response?.error,
        login_url: response?.login_url,
      })),
      filter(result => !result.pending),
      take(1),
      map(result => result.idle ? { idle: true } : { items: result.items, next_cursor: result.next_cursor, has_more: result.has_more, error: result.error, login_url: result.login_url }),
      catchError(() => of<{ items?: unknown[]; error?: string; idle?: boolean; next_cursor?: string; has_more?: boolean; login_url?: string }>({ items: [], error: 'crawl_failed' })));
  }

  cancelProfileCrawl(platform: string, username: string, type: string): Observable<unknown> {
    return this.api.post('social/profile', { platform, username, url: '', type, command: 'cancel' }).pipe(catchError(() => of(null)));
  }

  searchConnections(platform: string, username: string, query: string): Observable<unknown[]> {
    return this.api.post<ApiEnvelope<{ items?: unknown[] }>>('social/connections', { platform, username, query })
      .pipe(map(response => response?.result?.items ?? []), catchError(() => of<unknown[]>([])));
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

  fetchPhoneLookup(query: string): Observable<any> {
    const request = () => this.api.post<any>('phone/universal_search', { text: { query } });
    return request().pipe(expand(response => response?.status === 'pending' || response?.status === 'processing' ? timer(3000).pipe(switchMap(() => request())) : EMPTY),
      filter(response => response?.status !== 'pending' && response?.status !== 'processing'),
      take(1),
      map(response => {
        if (response?.status === 'error') {
          throw new Error(response?.message || response?.error_message || 'Phone lookup failed');
        }
        return response?.result ?? response;
      }),
      catchError(() => throwError(() => new Error('Failed to fetch phone intelligence'))));
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
