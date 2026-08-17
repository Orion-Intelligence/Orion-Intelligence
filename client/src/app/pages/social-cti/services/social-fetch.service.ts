import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { social_online_presence_hit, social_post } from '../models/social.models';
import { social_stealer_log } from '../models/social.models';
import { ApiEnvelope } from '../models/social-usability.models';
@Injectable({ providedIn: 'root' })
export class SocialFetchService {
  constructor(private api: ApiService) {}



  fetchSocialPosts(platform: string, username: string, hashId?: string, maxPosts = 5, socialDataType = 'posts', maxComments = 10, commentOffset = 0): Observable<{ posts: social_post[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<social_post[] | { posts: social_post[] }>>('social/posts', { platform, username, max_posts: maxPosts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ posts: Array.isArray(response.result) ? response.result : response.result?.posts ?? [] })));
  }

  fetchSocialVideos(platform: string, username: string, hashId?: string, maxVideos = 5, socialDataType = 'videos', maxComments = 10, commentOffset = 0): Observable<{ videos: social_post[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<social_post[] | { videos: social_post[] }>>('social/videos', { platform, username, max_videos: maxVideos, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ videos: Array.isArray(response.result) ? response.result : response.result?.videos ?? [] })));
  }

  fetchSocialShorts(platform: string, username: string, hashId?: string, maxShorts = 5, socialDataType = 'shorts', maxComments = 10, commentOffset = 0): Observable<{ shorts: social_post[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<social_post[] | { shorts: social_post[] }>>('social/shorts', { platform, username, max_shorts: maxShorts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ shorts: Array.isArray(response.result) ? response.result : response.result?.shorts ?? [] })));
  }

  fetchSocialPostComments(platform: string, username: string, tabKey: 'posts' | 'videos' | 'shorts', hashId?: string, commentOffset = 0, maxComments = 10): Observable<{ posts?: social_post[]; videos?: social_post[]; shorts?: social_post[] }> {
    if (tabKey === 'videos') {
      return this.fetchSocialVideos(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    if (tabKey === 'shorts') {
      return this.fetchSocialShorts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    return this.fetchSocialPosts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
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
