import { Injectable } from '@angular/core';
import { PlatformResult, ScanEvent, CustomEntity } from '../../shared/model/social/social-scan.models';
import { Observable, timer, throwError } from 'rxjs';
import { switchMap, map, filter, take, catchError, tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

type ApiEnvelope<T> = {
  status?: 'success' | 'error' | string;
  message?: any;
  result?: T;
};

@Injectable({
  providedIn: 'root'
})
export class SocialScanService {
  private useMockData = true;

  constructor(private api: ApiService) {}

  private extractMetadata(platformName: string, data: any): Partial<PlatformResult> {
    if (!data) return { allMetadata: {} };
    
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
      try {
        result.joiningDate = new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {}
    }

    return result;
  }

  private pollForResult<TResponse, TResult>(opts: {
    request: () => Observable<ApiEnvelope<TResponse>>;
    isReady: (res: ApiEnvelope<TResponse>) => boolean;
    mapResult: (res: ApiEnvelope<TResponse>) => TResult;
    onPending?: (res: any) => void;
    intervalMs?: number;
    initialDelayMs?: number;
  }): Observable<TResult> {
    const initialDelayMs = opts.initialDelayMs ?? 1000;
    const intervalMs = opts.intervalMs ?? 2000;

    return timer(initialDelayMs, intervalMs).pipe(
      switchMap(() => opts.request()),
      map(res => {
        if (res?.status === 'error') throw res.message || 'error';
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

  performScan(username: string): Observable<ScanEvent> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        const steps = [
          { progress: 10, step: 'Initiating scan...' },
          { progress: 25, step: 'Querying social platforms...' },
          { progress: 50, step: `maigret:Github:${username}` },
          { progress: 75, step: 'Analyzing data...' },
          { progress: 90, step: 'Finalizing results...' }
        ];

        let stepIndex = 0;
        let intervalId: any;
        let finalTimeoutId: any;

        const runStep = () => {
          if (subscriber.closed) {
            clearInterval(intervalId);
            clearTimeout(finalTimeoutId);
            return;
          }

          if (stepIndex < steps.length) {
            const step = steps[stepIndex];
            subscriber.next({
              type: 'progress',
              payload: { progress: step.progress, step: step.step }
            });
            stepIndex++;
          } else {
            clearInterval(intervalId);
            finalTimeoutId = setTimeout(() => {
              const responseData = MOCK_API_RESPONSE.result;
              const platforms: PlatformResult[] = responseData
                .map(item => {
                  const extractedData = this.extractMetadata(item.metadata.platform, item.data);
                  const platformResult = {
                    platform: item.metadata.platform,
                    username: item.metadata.username,
                    url: item.metadata.url,
                    isSelected: false,
                    ...extractedData
                  } as PlatformResult;

                  if (!platformResult.allMetadata || Object.keys(platformResult.allMetadata).length === 0) {
                      platformResult.allMetadata = item.metadata;
                  }

                  if (item.metadata.platform.toLowerCase() === 'gitlab') {
                    platformResult.email = `${item.metadata.username}@example.com`;
                  }

                  return platformResult;
                });

              subscriber.next({ type: 'complete', payload: platforms });
              subscriber.complete();
            }, 500);
          }
        };

        intervalId = setInterval(runStep, 800);

        return () => {
          clearInterval(intervalId);
          clearTimeout(finalTimeoutId);
        };
      });
    }

    return new Observable(subscriber => {
      subscriber.next({ type: 'progress', payload: { progress: 10, step: 'Submitting job to API...' } });

      const pollingSub = this.pollForResult<
        { data?: any[] } | any,
        PlatformResult[]
      >({
        request: () => this.api.post<any>('social/recon', { query: username }),
        isReady: (res) => !!(res as any)?.result,
        mapResult: (res) =>
          (res as any).result
            .map((item: any): PlatformResult => {
              const extractedData = this.extractMetadata(item.metadata.platform, item.data);
              const platformResult = {
                platform: item.metadata.platform,
                username: item.metadata.username,
                url: item.metadata.url,
                isSelected: false,
                ...extractedData
              } as PlatformResult;
              
              if (!platformResult.allMetadata || Object.keys(platformResult.allMetadata).length === 0) {
                  platformResult.allMetadata = item.metadata;
              }

              return platformResult;
            }),
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

  addEntity(entity: { type: 'wallet' | 'email' | 'domain'; value: string; label: string }): Observable<CustomEntity> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          const resp = MOCK_ADD_ENTITY_RESPONSE(entity);
          subscriber.next(resp.result);
          subscriber.complete();
        }, 1500);
      });
    }

    return this.pollForResult<CustomEntity | any, CustomEntity>({
      request: () => this.api.post<any>('social/entity', entity),
      isReady: (res) => !!(res as any)?.result,
      mapResult: (res) => (res as any).result as CustomEntity,
      initialDelayMs: 1000,
      intervalMs: 2000
    });
  }
}

const MOCK_API_RESPONSE = {
  "job_id": "-6312931872938911216",
  "result": [
    {
      "metadata": {
        "platform": "Allmylinks",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://allmylinks.com/msmannan00",
        "timestamp": "2026-02-07 17:39:29"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Artstation",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://www.artstation.com/msmannan00",
        "timestamp": "2026-02-07 17:39:29"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Audiojungle",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://audiojungle.net/user/msmannan00",
        "timestamp": "2026-02-07 17:39:29"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Bitbucket",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://bitbucket.org/msmannan00",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": {
        "url": "https://bitbucket.org/msmannan00/",
        "status": "Claimed",
        "ids": {
          "uid": "23fc0670-24ee-42a3-b73c-a9b703e5dde9",
          "id": "557058:0a9b74fa-e1e6-4467-91cc-476f8b9dce35",
          "fullname": "Abdul Mannan",
          "nickname": "msmannan00",
          "image": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:0a9b74fa-e1e6-4467-91cc-476f8b9dce35/4f35ad7f-8c83-4580-bd22-5ad5911c7bc0/128",
          "created_at": "2015-07-30T16:28:27.546733+00:00",
          "is_service": "False",
          "is_active": "True"
        },
        "tags": [
          "coding"
        ],
        "http_status": 200
      }
    },
    {
      "metadata": {
        "platform": "Cgtrader",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://www.cgtrader.com/msmannan00",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Crowdin",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://crowdin.com/profile/msmannan00",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Discord",
        "username": "discord.com",
        "social_handle": "discord.com",
        "url": "https://discord.com",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Hub",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://hub.docker.com/u/msmannan00",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Dribbble",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://dribbble.com/msmannan00",
        "timestamp": "2026-02-07 17:39:36"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Gitlab",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://gitlab.com/msmannan00",
        "timestamp": "2026-02-07 17:39:40"
      },
      "data": {
        "url": "https://gitlab.com/msmannan00",
        "status": "Claimed",
        "ids": {
          "uid": "8975435",
          "fullname": "Abdul Mannan",
          "username": "msmannan00",
          "state": "active",
          "image": "https://secure.gravatar.com/avatar/a5d3bdb9fe75e12435af244203af574f6000ef6b8f3c80efbced24ca541418fe?s=80&d=identicon",
          "gravatar_url": "https://gravatar.com/a5d3bdb9fe75e12435af244203af574f",
          "gravatar_username": "msmannan00",
          "gravatar_email_md5_hash": "a5d3bdb9fe75e12435af244203af574f"
        },
        "tags": [
          "coding"
        ],
        "http_status": 200
      }
    },
    {
      "metadata": {
        "platform": "En",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "http://en.gravatar.com/msmannan00",
        "timestamp": "2026-02-07 17:39:40"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Medium",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://medium.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:40"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Replit",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://replit.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:40"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Tiktok",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://www.tiktok.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:51"
      },
      "data": {}
    },
    {
      "metadata": {
        "platform": "Themeforest",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://themeforest.net/user/msmannan00",
        "timestamp": "2026-02-07 17:39:51"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Pinterest",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://www.pinterest.com/msmannan00",
        "timestamp": "2026-02-07 17:39:56"
      },
      "data": {}
    }
  ]
};

const MOCK_ADD_ENTITY_RESPONSE = (entity: { type: 'wallet' | 'email' | 'domain'; value: string; label: string }) => ({
  job_id: `-mock-${entity.type}-${self.crypto.randomUUID()}`,
  result: {
    id: `custom-${entity.type}-${self.crypto.randomUUID()}`,
    type: entity.type,
    label: entity.label,
    value: entity.value,
    onGraph: false,
    status: 'added'
  } as CustomEntity
});