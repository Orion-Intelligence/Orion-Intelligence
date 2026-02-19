import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, filter, map, retry, switchMap, take, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { CustomEntity, PlatformResult, ProfileDetails, ScanEvent, SocialImage, SocialPost } from '../../../../shared/model/social/social-scan.models';

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

  performScan(username: string): Observable<ScanEvent>
  {
    return new Observable(subscriber => {
      subscriber.next({ type: 'progress', payload: { progress: 10, step: 'Submitting job to API...' } });

      const pollingSub = this.pollForResult<
        { data?: any[] } | any,
        PlatformResult[] >({
        request: () => this.api.post<any>('social/recon', { query: username }),
        isReady: (res) => !!res && 'result' in (res as any),
        mapResult: (res) => ((res as any).result || []).reduce((acc: PlatformResult[], item: any) => {
          let platform = item.metadata.platform;

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
            catch (e)
            {
            }
          }

          const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
          const extractedData = this.extractMetadata(capitalizedPlatform, item.data);

          const platformResult = {
            keyUsername: username,
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

          acc.push(platformResult);
          return acc;
        }, []),
        onPending: (res: any) => {
          if (res && res.step) {
            subscriber.next({
              type: 'progress',
              payload: { progress: res.progress || 0, step: res.step }
            });
          }
        },
        initialDelayMs: 1000,
        intervalMs: 2000
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

  performImageScan(base64Image: string): Observable<ScanEvent>
  {
    return new Observable(subscriber => {
      subscriber.next({ type: 'progress', payload: { progress: 10, step: 'Submitting image to API...' } });

      const pollingSub = this.pollForResult<
        { data?: any[] } | any,
        PlatformResult[] >({
        request: () => this.api.post<any>('social/recon/image', { image_base64: base64Image }),
        isReady: (res) => !!res && 'result' in (res as any),
        mapResult: (res) => {
          const username = 'Image Scan Result';
          return ((res as any).result || []).reduce((acc: PlatformResult[], item: any) => {
            const capitalizedPlatform = item.metadata.platform.charAt(0).toUpperCase() + item.metadata.platform.slice(1);
            const extractedData = this.extractMetadata(capitalizedPlatform, item.data);

            const platformResult = {
              keyUsername: username,
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

            acc.push(platformResult);
            return acc;
          }, []);
        },
        onPending: (res: any) => {
          if (res && res.step) {
            subscriber.next({
              type: 'progress',
              payload: { progress: res.progress || 0, step: res.step }
            });
          }
        },
        initialDelayMs: 2000,
        intervalMs: 3000
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

  addEntity(entity: { type: 'wallet' | 'email' | 'domain'; value: string; label: string }): Observable<CustomEntity>
  {
    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<CustomEntity | { entity: CustomEntity }>>('social/entity', entity),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => {
        const raw = (res.result as any)?.entity ?? res.result ?? {};
        return {
          id: raw.id ?? `entity-${entity.type}-${Date.now()}`,
          type: raw.type ?? entity.type,
          label: raw.label ?? entity.label,
          value: raw.value ?? entity.value,
          onGraph: raw.onGraph ?? true,
          status: raw.status ?? 'added'
        } as CustomEntity;
      },
    }).pipe(retry(3));
  }
}
