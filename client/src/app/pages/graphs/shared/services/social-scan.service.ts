import { Injectable } from '@angular/core';
import { Observable, throwError, timer, EMPTY } from 'rxjs';
import { catchError, expand, filter, map, retry, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { PlatformResult, ProfileDetails, ScanEvent, SocialImage, SocialPost, YoutubeVideo, YoutubeShort } from '../../../../shared/model/social/social-scan.models';
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

  private extractMetadata(platformName: string, data: any): Partial<PlatformResult> {
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
    const extractedData = this.extractMetadata(capitalizedPlatform, item.data);
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

  fetchProfileInfo(platform: string, username: string): Observable<{
      profile: ProfileDetails;
  }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<any>>('social/profile', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const card = (res.result as any)?.cards?.[0] ?? {};
        const profile: ProfileDetails = {
          real_name: card.m_title || card.m_sender_name || undefined,
          bio: card.m_bio || undefined,
          profile_url: card.m_message_sharable_link || card.m_channel_url || undefined,
          avatar_url: card.m_profile_pic_url || undefined,
          cover_url: card.m_profile_cover_pic_url || undefined,
          total_likes: card.m_likes,
          total_posts: undefined,
          total_followers: undefined,
          total_following: undefined,
          location: undefined,
        };
        return { profile };
      },
    }).pipe(retry(3));
  }

  fetchPlatformImages(platform: string, username: string): Observable<{
        images: SocialImage[];
    }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{
                images: SocialImage[];
            }>>('social/online/images', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ images: (res.result as any)?.images ?? [] }),
    }).pipe(retry(3));
  }

  fetchSocialPosts(platform: string, username: string): Observable<{
      posts: SocialPost[];
  }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<any>>('social/posts', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const result = res.result;
        const rawPosts = Array.isArray(result) ? result : (result as any)?.posts;
        const posts = Array.isArray(rawPosts) ? rawPosts.map(card => this.mapRawPostCard(card)) : [];
        return { posts };
      },
    }).pipe(retry(3));
  }

  private mapRawPostCard(card: any): SocialPost {

    const mediaUrl = Array.isArray(card.m_post_pic_url) && card.m_post_pic_url.length > 0
      ? card.m_post_pic_url[0]
      : '';
    return {
      post_url: card.m_post_url || card.m_message_sharable_link || card.m_channel_url || '',
      datetime: card.m_post_time || card.m_message_date || '',
      caption: card.m_title || '',
      likes: card.m_likes ?? card.m_post_likes ?? '0',
      comments: card.m_comment_count ?? card.m_post_comments_count ?? '0',
      shares: card.m_retweets ?? card.m_post_shares ?? '0',
      views: card.m_views ?? card.m_post_views ?? '0',
      media_type: mediaUrl ? 'image' : '',
      media_url: mediaUrl
    };
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

  fetchYouTubeVideos(platform: string, username: string): Observable<{
      youtube_videos: YoutubeVideo[];
  }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<any>>('social/videos', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const result = res.result;
        const rawCards: any[] = Array.isArray(result) ? result : (result as any)?.posts ?? [];
        const youtube_videos = rawCards
          .filter((card: any) => this.isYouTubeVideoCard(card))
          .map((card: any) => this.mapRawVideoCard(card));
        return { youtube_videos };
      },
    }).pipe(retry(3));
  }

  fetchYouTubeShorts(platform: string, username: string): Observable<{
      youtube_shorts: YoutubeShort[];
  }> {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<any>>('social/shorts', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const result = res.result;
        const rawCards: any[] = Array.isArray(result) ? result : (result as any)?.posts ?? [];
        const youtube_shorts = rawCards
          .filter((card: any) => this.isYouTubeShortCard(card))
          .map((card: any) => this.mapRawShortCard(card));
        return { youtube_shorts };
      },
    }).pipe(retry(3));
  }

  /** Returns true if the card represents a standard YouTube video (not a Short).
   * Real response: videos have m_content_type = ["social_collector", "youtube_video", "video"]
   * Shorts have m_content_type = ["social_collector", "youtube_video", "short"]
   * Both share "youtube_video", so we use "short" / "video" as the tiebreaker.
   */
  private isYouTubeVideoCard(card: any): boolean {
    const contentTypes: string[] = Array.isArray(card.m_content_type) ? card.m_content_type : [];
    if (contentTypes.includes('short')) {
      return false; 
    }      // definitely a Short
    if (contentTypes.includes('video')) {
      return true; 
    }       // has 'video' but not 'short'
    // URL-based fallback when m_content_type is missing
    const url = String(card.m_post_url || card.m_message_sharable_link || '');
    return url.includes('/watch?') && !url.includes('/shorts/');
  }

  /** Returns true if the card represents a YouTube Short.
   * Real response: shorts have m_content_type = ["social_collector", "youtube_video", "short"]
   */
  private isYouTubeShortCard(card: any): boolean {
    const contentTypes: string[] = Array.isArray(card.m_content_type) ? card.m_content_type : [];
    if (contentTypes.includes('short')) {
      return true; 
    }       // has 'short' = definitely a Short
    if (contentTypes.includes('video')) {
      return false; 
    }      // has 'video' but not 'short'
    // URL-based fallback when m_content_type is missing
    const url = String(card.m_post_url || card.m_message_sharable_link || '');
    return url.includes('/shorts/');
  }

  /** Extracts a named value from the structured m_content string (e.g. "VIEWS: 3,600,000"). */
  private extractContentField(content: string | null | undefined, fieldName: string): string {
    if (!content) {
      return ''; 
    }
    const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'im');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private mapRawVideoCard(card: any): YoutubeVideo {
    // Thumbnail: m_post_pic_url may be an array or null
    const picUrl = Array.isArray(card.m_post_pic_url) && card.m_post_pic_url.length > 0
      ? card.m_post_pic_url[0]
      : (card.m_thumbnail_url || '');
    // Top comments: m_commenters is a string array
    const topComments: string[] = Array.isArray(card.m_commenters) ? card.m_commenters.filter(Boolean) : [];
    // m_subscriber can be an integer (e.g. 23300000) or null — != null handles both 0 and non-null
    const subscribersRaw = card.m_subscriber != null
      ? String(card.m_subscriber)
      : this.extractContentField(card.m_content, 'SUBSCRIBERS');
    return {
      video_url: card.m_post_url || card.m_message_sharable_link || card.m_channel_url || '',
      title: card.m_title || '',
      datetime: card.m_post_time || card.m_message_date || '',
      views: String(card.m_views ?? card.m_post_views ?? '0'),
      likes: String(card.m_likes ?? card.m_post_likes ?? '0'),
      comments: String(card.m_comment_count ?? card.m_post_comments_count ?? '0'),
      thumbnail_url: picUrl,
      duration: card.m_duration || undefined,
      channel_url: card.m_channel_url || undefined,
      subscribers: subscribersRaw || undefined,
      top_comments: topComments.length > 0 ? topComments : undefined,
    };
  }

  private mapRawShortCard(card: any): YoutubeShort {
    const picUrl = Array.isArray(card.m_post_pic_url) && card.m_post_pic_url.length > 0
      ? card.m_post_pic_url[0]
      : (card.m_thumbnail_url || '');
    const topComments: string[] = Array.isArray(card.m_commenters) ? card.m_commenters.filter(Boolean) : [];
    // m_subscriber can be an integer (e.g. 23300000) or null
    const subscribersRaw = card.m_subscriber != null
      ? String(card.m_subscriber)
      : this.extractContentField(card.m_content, 'SUBSCRIBERS');
    return {
      short_url: card.m_post_url || card.m_message_sharable_link || '',
      title: card.m_title || '',
      datetime: card.m_post_time || card.m_message_date || '',
      views: String(card.m_views ?? card.m_post_views ?? '0'),
      likes: String(card.m_likes ?? card.m_post_likes ?? '0'),
      comments: String(card.m_comment_count ?? card.m_post_comments_count ?? '0'),
      thumbnail_url: picUrl,
      channel_url: card.m_channel_url || undefined,
      subscribers: subscribersRaw || undefined,
      top_comments: topComments.length > 0 ? topComments : undefined,
    };
  }

  fetchProfileBreachData(username?: string, email?: string): Observable<any> {
    const payload = { text: { username: username || '', email: email || '' } };
    return this.api.post<any>('dynamic/user', payload).pipe(expand((res) => this.shouldContinueDynamicPolling(res)
      ? timer(2000).pipe(switchMap(() => this.api.post<any>('dynamic/user', payload)))
      : EMPTY),
    takeWhile((res) => this.shouldContinueDynamicPolling(res), true),
    map((res) => {
      if (!res || this.shouldContinueDynamicPolling(res)) {
        return { cards_data: [] };
      }
      const normalized = (res && typeof res === 'object')
        ? (res.data ?? res.result ?? res)
        : res;
      const cards = Array.isArray(normalized?.cards_data)
        ? normalized.cards_data
        : Array.isArray(normalized?.result)
          ? normalized.result
          : [];
      return { cards_data: cards };
    }),
    catchError(() => throwError(() => new Error('Failed to fetch breach data'))));
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

  private shouldContinueDynamicPolling(res: any): boolean {
    const topStatus = (res?.status || '').toLowerCase();
    const nestedStatus = (res?.result?.status || '').toLowerCase();
    const isPending = ['pending', 'processing', 'running', 'busy'].includes(topStatus) ||
      ['pending', 'processing', 'running', 'busy'].includes(nestedStatus);
    const isFailedPending = (topStatus === 'pending' || nestedStatus === 'pending') &&
      ((res?.result?.progress ?? res?.progress) === 0) &&
      ((res?.result?.step ?? res?.step) === 'failed');
    return isPending && !isFailedPending;
  }
}
