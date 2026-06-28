import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, retry, switchMap, take, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { PlatformResult, ProfileDetails, ScanEvent, SocialImage, SocialPost, SocialStoredProfile } from '../../../../shared/model/social/social-scan.models';
import { SocialNormalizationUtil } from '../../social-graph/utils/social-normalization.util';
interface ApiEnvelope<T> {
    status?: string;
    message?: any;
    result?: T;
}
@Injectable({
  providedIn: 'root'
})
export class SocialScanService {
  constructor(private api: ApiService) { }

  private extractMetadata(data: any): Partial<PlatformResult> {
    if (!data) {
      return { allMetadata: {} };
    }
    const platformData = data;
    if (!platformData?.ids) {
      return { allMetadata: platformData };
    }
    const ids = platformData.ids;
    const result: Partial<PlatformResult> = { allMetadata: ids };
    result.description = ids.bio || ids.description;
    const followers = ids.follower_count ?? ids.followers;
    if (followers !== undefined && !isNaN(parseInt(followers, 10))) {
      result.followers = parseInt(followers, 10);
    }
    const dateStr = ids.created_at || ids.joining_date;
    if (dateStr) {
      try {
        result.joiningDate = new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      catch (_) {
        // Ignore invalid date strings and keep the raw metadata.
      }
    }
    return result;
  }

  private pollForResult<TResponse, TResult>( opts: { request: () => Observable<ApiEnvelope<TResponse>>; isReady: (res: ApiEnvelope<TResponse>) => boolean; mapResult: (res: ApiEnvelope<TResponse>) => TResult; onPending?: (res: any) => void; intervalMs?: number; initialDelayMs?: number; } ): Observable<TResult> {
    const initialDelayMs = opts.initialDelayMs ?? 1000;
    const intervalMs = opts.intervalMs ?? 2000;
    return timer(initialDelayMs, intervalMs).pipe(switchMap(() => opts.request()), map(res => {
      if (res?.status === 'error') {
        throw res.message || 'error';
      }
      return res;
    }), tap(res => {
      if (!opts.isReady(res)) {
        opts.onPending?.(res);
      }
    }), filter(res => opts.isReady(res)), take(1), map(res => opts.mapResult(res)), catchError(err => throwError(() => err)));
  }

  private emitPendingProgress(subscriber: any, res: any): void {
    if (res?.step) {
      subscriber.next({
        type: 'progress',
        payload: { progress: res.progress || 0, step: res.step }
      });
    }
  }

  private capitalizePlatform(platform: string): string {
    const value = String(platform || '');
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  private inferPlatformName(item: any, username: string): string {
    let platform = item?.metadata?.platform || '';
    if (platform.toLowerCase() === username.toLowerCase()) {
      try {
        const url = new URL(item.metadata.url);
        const hostname = url.hostname.replace(/^www\./, '');
        const parts = hostname.split('.');
        if (parts.length > 2 && hostname.toLowerCase().startsWith(username.toLowerCase().replace(/_/g, ''))) {
          platform = parts.slice(1).join('.');
        }
        else if (parts.length >= 2) {
          platform = parts[0];
        }
      }
      catch {
        // Ignore malformed URLs and fall back to the current platform value.
      }
    }
    return platform;
  }

  private buildPlatformResult(item: any, keyUsername: string, rawPlatform: string): PlatformResult {
    const capitalizedPlatform = this.capitalizePlatform(rawPlatform);
    const extractedData = this.extractMetadata(item.data);
    const rawStatus = item?.metadata?.status ?? item?.data?.status;
    const normalizedStatus = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : rawStatus;
    const platformResult = {
      keyUsername,
      platform: capitalizedPlatform,
      username: item.metadata.username,
      url: item.metadata.url,
      isSelected: false,
      status: normalizedStatus,
      ...extractedData
    } as PlatformResult;
    if (!platformResult.allMetadata || Object.keys(platformResult.allMetadata).length === 0) {
      platformResult.allMetadata = item.metadata;
      platformResult.allMetadata['platform'] = capitalizedPlatform;
    }
    return platformResult;
  }

  private mapScanItems(items: any[], keyUsername: string, resolvePlatform: (item: any) => string): PlatformResult[] {
    return items.reduce((acc: PlatformResult[], item: any) => {
      acc.push(this.buildPlatformResult(item, keyUsername, resolvePlatform(item)));
      return acc;
    }, []);
  }

  private runScanFlow( opts: { submitStep: string; request: () => Observable<any>; mapResult: (res: any) => PlatformResult[]; initialDelayMs: number; intervalMs: number; } ): Observable<ScanEvent> {
    return new Observable(subscriber => {
      subscriber.next({ type: 'progress', payload: { progress: 10, step: opts.submitStep } });
      const pollingSub = this.pollForResult<{
                data?: any[];
                result?: any;
                step?: string;
                progress?: number;
            }, PlatformResult[]>({
              request: opts.request,
              isReady: (res) => !!res && 'result' in (res as any),
              mapResult: opts.mapResult,
              onPending: (res: any) => {
                this.emitPendingProgress(subscriber, res);
              },
              initialDelayMs: opts.initialDelayMs,
              intervalMs: opts.intervalMs
            }).subscribe({
              next: (platforms) => {
                subscriber.next({ type: 'progress', payload: { progress: 90, step: 'Processing results...' } });
                subscriber.next({ type: 'complete', payload: platforms });
                subscriber.complete();
              },
              error: (err) => {
                subscriber.error(err);
              }
            });
      return () => {
        pollingSub.unsubscribe();
      };
    });
  }

  performScan(username: string): Observable<ScanEvent> {
    return this.runScanFlow({
      submitStep: 'Submitting job to API...',
      request: () => this.api.post<any>('social/recon', { query: username }),
      mapResult: (res) => this.mapScanItems(res.result || [], username, (item: any) => this.inferPlatformName(item, username)),
      initialDelayMs: 1000,
      intervalMs: 2000
    });
  }

  performImageScan(base64Image: string): Observable<ScanEvent> {
    const username = 'Image Scan Result';
    return this.runScanFlow({
      submitStep: 'Submitting image to API...',
      request: () => this.api.post<any>('social/recon/image', { image_base64: base64Image }),
      mapResult: (res) => this.mapScanItems(res.result || [], username, (item: any) => item?.metadata?.platform || ''),
      initialDelayMs: 2000,
      intervalMs: 3000
    });
  }

  saveSocialProfiles(profileUsername: string, profiles: PlatformResult[], replace = false): Observable<any> {
    return this.api.post<any>('social/data', { profile_username: profileUsername, profiles, replace });
  }

  fetchStoredSocialProfiles(): Observable<SocialStoredProfile[]> {
    return this.api.get<ApiEnvelope<SocialStoredProfile[]>>('social/data').pipe(map(res => Array.isArray(res?.result) ? res.result : []));
  }

  fetchStoredSocialProfile(profileUsername: string): Observable<SocialStoredProfile> {
    return this.api.get<SocialStoredProfile>(`social/data/${encodeURIComponent(profileUsername)}`);
  }

  deleteStoredSocialProfiles(profileUsername: string): Observable<any> {
    return this.api.delete<any>(`social/data/${encodeURIComponent(profileUsername)}`);
  }

  fetchProfileInfo(platform: string, username: string): Observable<{
        profile: ProfileDetails;
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{
                profile: ProfileDetails;
            }>>('social/profile', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const result = res.result as any;
        const profile = Array.isArray(result) ? result[0] : result?.profile ?? result ?? {};
        return { profile: profile as ProfileDetails };
      },
    }).pipe(retry(3));
  }

  fetchPlatformImages(platform: string, username: string, maxImages = 10): Observable<{
        images: SocialImage[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{
                images: SocialImage[];
            }>>('social/online/images', { platform, username, max_images: maxImages }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ images: (res.result as any)?.images ?? [] }),
    }).pipe(retry(3));
  }

  fetchSocialPosts(platform: string, username: string, hashId?: string, maxPosts = 5, socialDataType = 'posts', maxComments = 10, commentOffset = 0): Observable<{
        posts: SocialPost[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<SocialPost[] | {
                posts: SocialPost[];
            }>>('social/posts', { platform, username, max_posts: maxPosts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ posts: this.normalizeSocialPosts(res.result, 'posts') }),
    }).pipe(retry(3));
  }

  fetchSocialVideos(platform: string, username: string, hashId?: string, maxVideos = 5, socialDataType = 'videos', maxComments = 10, commentOffset = 0): Observable<{
        videos: SocialPost[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<SocialPost[] | {
                videos: SocialPost[];
            }>>('social/videos', { platform, username, max_videos: maxVideos, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ videos: this.normalizeSocialPosts(res.result, 'videos') }),
    }).pipe(retry(3));
  }

  fetchSocialShorts(platform: string, username: string, hashId?: string, maxShorts = 5, socialDataType = 'shorts', maxComments = 10, commentOffset = 0): Observable<{
        shorts: SocialPost[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<SocialPost[] | {
                shorts: SocialPost[];
            }>>('social/shorts', { platform, username, max_shorts: maxShorts, max_comments: maxComments, comment_offset: commentOffset, social_data_type: socialDataType, hash_id: hashId || undefined }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ shorts: this.normalizeSocialPosts(res.result, 'shorts') }),
    }).pipe(retry(3));
  }

  fetchSocialPostComments(platform: string, username: string, tabKey: 'posts' | 'videos' | 'shorts', hashId?: string, commentOffset = 0, maxComments = 10): Observable<{
        posts?: SocialPost[];
        videos?: SocialPost[];
        shorts?: SocialPost[];
    }> {
    if (tabKey === 'videos') {
      return this.fetchSocialVideos(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    if (tabKey === 'shorts') {
      return this.fetchSocialShorts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
    }
    return this.fetchSocialPosts(platform, username, hashId, 1, 'comments', maxComments, commentOffset);
  }

  fetchFollowers(platform: string, username: string): Observable<{
        followers: string[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<any>('social/followers', { platform, username, max_followers: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ followers: (res.result as any)?.followers ?? [] }),
    }).pipe(retry(3));
  }

  fetchFollowing(platform: string, username: string): Observable<{
        following: string[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<any>('social/following', { platform, username, max_following: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ following: (res.result as any)?.following ?? [] }),
    }).pipe(retry(3));
  }

  fetchStealerLogsByIdentity(query: string): Observable<any[]> {
    const payload = {
      daterange: '',
      q: '',
      url: '',
      user: query,
      ioc: `m_search_all:${query}`,
      type: 'c',
      page: 1,
      category: '',
      fullsearch: false
    };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map((res) => {
      return this.extractStealerLogResults(res);
    }),
    catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  fetchPlatformStealerLogs(username: string, domain: string): Observable<any[]> {
    const payload = {
      daterange: '',
      q: '',
      url: domain || '',
      user: username,
      ioc: domain ? `m_username:${username} AND m_domain:${domain}` : `m_search_all:${username}`,
      type: 'c',
      page: 1,
      category: '',
      fullsearch: false
    };
    return this.api.post<any>('search/stealer/ioc', payload).pipe(map((res) => {
      return this.extractStealerLogResults(res);
    }),
    catchError(() => throwError(() => new Error('Failed to fetch stealer logs'))));
  }

  private extractStealerLogResults(res: any): any[] {
    if (Array.isArray(res?.Result)) {
      return res.Result;
    }
    if (Array.isArray(res?.result?.Result)) {
      return res.result.Result;
    }
    if (Array.isArray(res?.data?.Result)) {
      return res.data.Result;
    }
    return [];
  }

  private normalizeSocialPosts(result: any, key: 'posts' | 'videos' | 'shorts'): SocialPost[] {
    const items = Array.isArray(result)
      ? result
      : Array.isArray(result?.[key])
        ? result[key]
        : Array.isArray(result?.data)
          ? result.data
          : [];
    return items.map((post: any) => SocialNormalizationUtil.normalizeSocialPost(post));
  }

  fetchProfileMetadataTokens(tokens: string[], username: string, platform?: string): Observable<{
        query: string;
        total_found: number;
        timestamp?: string;
        results: {
          title?: string;
          url?: string;
          snippet?: string;
          timestamp?: string;
        }[];
    }> {
    const payload: any = { tokens, username };
    if (platform) {
      payload.platform = platform;
    }
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<any>>('social/metadata', payload),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const r = (res as any)?.result ?? {};
        return {
          query: r?.query ?? '',
          total_found: Number(r?.total_found ?? 0),
          timestamp: r?.timestamp,
          results: Array.isArray(r?.results) ? r.results : []
        };
      },
    }).pipe(retry(3));
  }

}
