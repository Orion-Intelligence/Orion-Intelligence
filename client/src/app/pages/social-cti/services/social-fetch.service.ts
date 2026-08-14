import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { ApiEnvelope, ProfileDetails, SocialImage, SocialOnlinePresenceResult, SocialPost, SocialStealerLogRecord } from '../models/social-scan.models';

@Injectable({ providedIn: 'root' })
export class SocialFetchService {
  constructor(private api: ApiService) {}

  fetchProfileInfo(platform: string, username: string): Observable<{ profile: ProfileDetails }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<ProfileDetails | { profile: ProfileDetails }>>('social/profile', { platform, username })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => {
        const result = response.result;
        return { profile: ((result as { profile?: ProfileDetails })?.profile ?? result ?? {}) as ProfileDetails };
      }));
  }

  fetchPlatformImages(platform: string, username: string): Observable<{ images: SocialImage[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<{ images: SocialImage[] }>>('social/online/images', { platform, username, max_images: 10 })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ images: response.result?.images ?? [] })));
  }

  fetchSocialPosts(platform: string, username: string, hashId?: string, maxPosts = 5, socialDataType = 'posts', maxComments = 10, commentOffset = 0): Observable<{ posts: SocialPost[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<SocialPost[] | { posts: SocialPost[] }>>('social/posts', { platform, username, max_posts: maxPosts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ posts: Array.isArray(response.result) ? response.result : response.result?.posts ?? [] })));
  }

  fetchSocialVideos(platform: string, username: string, hashId?: string, maxVideos = 5, socialDataType = 'videos', maxComments = 10, commentOffset = 0): Observable<{ videos: SocialPost[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<SocialPost[] | { videos: SocialPost[] }>>('social/videos', { platform, username, max_videos: maxVideos, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ videos: Array.isArray(response.result) ? response.result : response.result?.videos ?? [] })));
  }

  fetchSocialShorts(platform: string, username: string, hashId?: string, maxShorts = 5, socialDataType = 'shorts', maxComments = 10, commentOffset = 0): Observable<{ shorts: SocialPost[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<SocialPost[] | { shorts: SocialPost[] }>>('social/shorts', { platform, username, max_shorts: maxShorts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ shorts: Array.isArray(response.result) ? response.result : response.result?.shorts ?? [] })));
  }

  fetchSocialPostComments(platform: string, username: string, tabKey: 'posts' | 'videos' | 'shorts', hashId?: string, commentOffset = 0, maxComments = 10): Observable<{ posts?: SocialPost[]; videos?: SocialPost[]; shorts?: SocialPost[] }> {
    if (tabKey === 'videos') {
      return this.fetchSocialVideos(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    if (tabKey === 'shorts') {
      return this.fetchSocialShorts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    return this.fetchSocialPosts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
  }

  fetchFollowers(platform: string, username: string): Observable<{ followers: string[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<{ followers: string[] }>>('social/followers', { platform, username, max_followers: 1000 })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ followers: response.result?.followers ?? [] })));
  }

  fetchFollowing(platform: string, username: string): Observable<{ following: string[] }> {
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<{ following: string[] }>>('social/following', { platform, username, max_following: 1000 })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ following: response.result?.following ?? [] })));
  }

  fetchStealerLogsByIdentity(query: string): Observable<SocialStealerLogRecord[]> {
    const payload = { daterange: '', q: '', url: '', user: query, ioc: `m_search_all:${query}`, type: 'c', page: 1, category: '', fullsearch: false };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map(response => response?.Result ?? response?.result?.Result ?? response?.data?.Result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  fetchPlatformStealerLogs(username: string, domain: string): Observable<SocialStealerLogRecord[]> {
    const payload = { daterange: '', q: '', url: domain || '', user: username, ioc: domain ? `m_username:${username} AND m_domain:${domain}` : `m_search_all:${username}`, type: 'c', page: 1, category: '', fullsearch: false };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map(response => response?.Result ?? response?.result?.Result ?? response?.data?.Result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  fetchWantedList(query: string): Observable<any[]> {
    return this.api.post<any>('dynamic/wanted', { text: { query } }).pipe(map(response => response?.cards_data ?? response?.data?.cards_data ?? response?.result?.cards_data ?? response?.result ?? []),
      catchError(() => throwError(() => new Error('Failed to fetch wanted list'))));
  }

  fetchProfileMetadataTokens(tokens: string[], username: string, platform?: string): Observable<SocialOnlinePresenceResult> {
    const payload: { tokens: string[]; username: string; platform?: string } = { tokens, username };
    if (platform) {
      payload.platform = platform;
    }
    return timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<SocialOnlinePresenceResult>>('social/metadata', payload)),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => response.result ?? { query: '', total_found: 0, results: [] }));
  }
}
