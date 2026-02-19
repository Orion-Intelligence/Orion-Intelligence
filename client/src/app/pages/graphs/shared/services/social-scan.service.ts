import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, retry, switchMap, take, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { PlatformResult, ProfileDetails, ScanEvent, SocialImage, SocialPost } from '../../../../shared/model/social/social-scan.models';

type ApiEnvelope<T> = {
  status?: 'success' | 'error' | string;
  message?: any;
  result?: T;
};

@Injectable({
  providedIn: 'root'
})
export class SocialScanService {
  constructor(private api: ApiService) {}

  private extractMetadata(platformName: string, data: any): Partial<PlatformResult>
  {
    if (!data) {
      return { allMetadata: {} };
    }

    const platformData = data;

    if (!platformData || !platformData.ids) {
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
      try
      {
        result.joiningDate = new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      catch (e)
      {
      }
    }

    return result;
  }

  private pollForResult<TResponse, TResult>(opts: { request: () => Observable<ApiEnvelope<TResponse>>; isReady: (res: ApiEnvelope<TResponse>) => boolean; mapResult: (res: ApiEnvelope<TResponse>) => TResult; onPending?: (res: any) => void; intervalMs?: number; initialDelayMs?: number; }): Observable<TResult>
  {
    const initialDelayMs = opts.initialDelayMs ?? 1000;
    const intervalMs = opts.intervalMs ?? 2000;

    return timer(initialDelayMs, intervalMs).pipe(
      switchMap(() => opts.request()),
      map(res => {
        if (res?.status === 'error') {
          throw res.message || 'error';
        }
        return res;
      }),
      tap(res => {
        if (!opts.isReady(res)) {
          opts.onPending?.(res);
        }
      }),
      filter(res => opts.isReady(res)),
      take(1),
      map(res => opts.mapResult(res)),
      catchError(err => throwError(() => err))
    );
  }

  private emitPendingProgress(subscriber: any, res: any): void {
    if (res && res.step) {
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
      try
      {
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
      catch
      {
      }
    }

    return platform;
  }

  private buildPlatformResult(item: any, keyUsername: string, rawPlatform: string): PlatformResult {
    const capitalizedPlatform = this.capitalizePlatform(rawPlatform);
    const extractedData = this.extractMetadata(capitalizedPlatform, item.data);

    const platformResult = {
      keyUsername,
      platform: capitalizedPlatform,
      username: item.metadata.username,
      url: item.metadata.url,
      isSelected: false,
      status: item.metadata.status,
      ...extractedData
    } as PlatformResult;

    if (!platformResult.allMetadata || Object.keys(platformResult.allMetadata).length === 0) {
      platformResult.allMetadata = item.metadata;
      platformResult.allMetadata['platform'] = capitalizedPlatform;
    }

    return platformResult;
  }

  private mapScanItems(
    items: any[],
    keyUsername: string,
    resolvePlatform: (item: any) => string
  ): PlatformResult[] {
    return items.reduce((acc: PlatformResult[], item: any) => {
      acc.push(this.buildPlatformResult(item, keyUsername, resolvePlatform(item)));
      return acc;
    }, []);
  }

  private runScanFlow(opts: {
    submitStep: string;
    request: () => Observable<any>;
    mapResult: (res: any) => PlatformResult[];
    initialDelayMs: number;
    intervalMs: number;
  }): Observable<ScanEvent> {
    return new Observable(subscriber => {
      subscriber.next({ type: 'progress', payload: { progress: 10, step: opts.submitStep } });

      const pollingSub = this.pollForResult<
        { data?: any[] } | any,
        PlatformResult[] >({
        request: opts.request,
        isReady: (res) => !!res && 'result' in (res as any),
        mapResult: opts.mapResult,
        onPending: (res: any) => this.emitPendingProgress(subscriber, res),
        initialDelayMs: opts.initialDelayMs,
        intervalMs: opts.intervalMs
      }).subscribe({
        next: (platforms) => {
          subscriber.next({ type: 'progress', payload: { progress: 90, step: 'Processing results...' } });
          subscriber.next({ type: 'complete', payload: platforms });
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });

      return () => pollingSub.unsubscribe();
    });
  }

  performScan(username: string): Observable<ScanEvent>
  {
    return this.runScanFlow({
      submitStep: 'Submitting job to API...',
      request: () => this.api.post<any>('social/recon', { query: username }),
      mapResult: (res) => this.mapScanItems((res as any).result || [], username, (item: any) => this.inferPlatformName(item, username)),
      initialDelayMs: 1000,
      intervalMs: 2000
    });
  }

  performImageScan(base64Image: string): Observable<ScanEvent>
  {
    const username = 'Image Scan Result';
    return this.runScanFlow({
      submitStep: 'Submitting image to API...',
      request: () => this.api.post<any>('social/recon/image', { image_base64: base64Image }),
      mapResult: (res) => this.mapScanItems((res as any).result || [], username, (item: any) => item?.metadata?.platform || ''),
      initialDelayMs: 2000,
      intervalMs: 3000
    });
  }

  fetchProfileInfo(platform: string, username: string): Observable<{ profile: ProfileDetails }>
  {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{ profile: ProfileDetails }>>('social/profile', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ profile: (res.result as any)?.profile ?? {} as ProfileDetails }),
    }).pipe(retry(3));
  }

  fetchPlatformImages(platform: string, username: string): Observable<{ images: SocialImage[] }>
  {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{ images: SocialImage[] }>>('social/online/images', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ images: (res.result as any)?.images ?? [] }),
    }).pipe(retry(3));
  }

  fetchSocialPosts(platform: string, username: string): Observable<{ posts: SocialPost[] }>
  {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<SocialPost[] | { posts: SocialPost[] }>>('social/posts', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const result = res.result;
        const posts = Array.isArray(result) ? result : (result as any)?.posts;
        return { posts: Array.isArray(posts) ? posts : [] };
      },
    }).pipe(retry(3));
  }

  fetchFollowers(platform: string, username: string): Observable<{ followers: string[] }>
  {
    return this.pollForResult({
      request: () => this.api.post<any>('social/followers', { platform, username, max_followers: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ followers: (res.result as any)?.followers ?? [] }),
    }).pipe(retry(3));
  }

  fetchFollowing(platform: string, username: string): Observable<{ following: string[] }>
  {
    return this.pollForResult({
      request: () => this.api.post<any>('social/following', { platform, username, max_following: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ following: (res.result as any)?.following ?? [] }),
    }).pipe(retry(3));
  }

}
