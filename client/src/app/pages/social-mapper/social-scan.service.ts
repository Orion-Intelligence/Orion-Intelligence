import { Injectable } from '@angular/core';
import { PlatformResult, ScanEvent, CustomEntity, ProfileDetails, SocialImage, SocialPost } from '../../shared/model/social/social-scan.models';
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
  private useMockData = false;

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
                    keyUsername: username,
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
      
      const platformsToScan = ['instagram', 'facebook', 'behance', 'vimeo', 'twitter', 'tiktok'];

      const pollingSub = this.pollForResult<
        { data?: any[] } | any,
        PlatformResult[]
      >({
        request: () => this.api.post<any>('social/recon', { query: username, platforms: platformsToScan }),
        isReady: (res) => !!(res as any)?.result,
        mapResult: (res) =>
          (res as any).result.reduce((acc: PlatformResult[], item: any) => {
            let platform = item.metadata.platform;

            // Heuristic to correct platform name when API returns username as platform
            if (platform.toLowerCase() === username.toLowerCase()) {
              try {
                const url = new URL(item.metadata.url);
                const hostname = url.hostname.replace(/^www\./, '');
                const parts = hostname.split('.');
                
                if (parts.length > 2 && hostname.toLowerCase().startsWith(username.toLowerCase().replace(/_/g, ''))) {
                    platform = parts.slice(1).join('.');
                } else if (parts.length >= 2) {
                    platform = parts[0];
                }
              } catch (e) {
                  console.error('Error parsing URL for platform name:', e);
              }
            }
            
            // Filter out platforms not in our target list
            if (!platformsToScan.includes(platform.toLowerCase())) {
                return acc; // Skip this item
            }

            const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
            const extractedData = this.extractMetadata(capitalizedPlatform, item.data);

            const platformResult = {
              keyUsername: username,
              platform: capitalizedPlatform,
              username: item.metadata.username,
              url: item.metadata.url,
              isSelected: false,
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

  fetchProfileInfo(platform: string, username: string): Observable<{ profile: ProfileDetails }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          const mock = MOCK_PROFILE_RESPONSES[platform.toLowerCase()];
          if (mock) {
            subscriber.next(mock);
          } else {
            subscriber.next({ profile: {} }); 
          }
          subscriber.complete();
        }, 1000);
      });
    }
    
    return this.api.post<{ profile: ProfileDetails }>('social/profile', { platform, username });
  }
  
  fetchSocialImages(username: string): Observable<{ images: SocialImage[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          subscriber.next({ images: MOCK_IMAGE_SEARCH_RESPONSE.result.images });
          subscriber.complete();
        }, 1500);
      });
    }

    return this.api.post<ApiEnvelope<{ images: SocialImage[] } & any>>('social/duckduckgo/images', { username }).pipe(
      map(response => ({ images: response.result?.images ?? [] }))
    );
  }

  fetchSocialPosts(platform: string, username: string): Observable<{ posts: SocialPost[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          subscriber.next({ posts: MOCK_POSTS_RESPONSE.result });
          subscriber.complete();
        }, 1500);
      });
    }

    return this.api.post<ApiEnvelope<SocialPost[]>>('social/posts', { platform, username }).pipe(
      map(response => ({ posts: response.result ?? [] }))
    );
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

const MOCK_IMAGE_SEARCH_RESPONSE = {
  "job_id": "-960776390597481520",
  "result": {
    "searched_username": "msmannan00",
    "platform": "twitter",
    "total_found": 10,
    "images": [
      {
        "image_url": "https://avatars.githubusercontent.com/u/9531531?v=4?s=400",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.t0Oj-MyKeBrOsjs8yY8s0AAAAA?pid=Api",
        "title": "msmannan00 (عبدالمنان) · GitHub",
        "source": "Bing"
      },
      {
        "image_url": "https://kpopping.com/documents/98/1/1536/240313-STAYC-Twitter-Update-Sieun-documents-3.jpeg?v=95233",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.DLf0ExO6oKL2OJv1Oa-LwAHaJ4?pid=Api",
        "title": "240313 STAYC Twitter Update - Sieun | kpopping",
        "source": "Bing"
      },
      {
        "image_url": "https://images.lifestyleasia.com/wp-content/uploads/sites/7/2023/05/31101520/twitter-2-1600x900.jpeg",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.zmmgRsj6OW3aHj9wd7wmUgHaEK?pid=Api",
        "title": "Twitter is now worth one-third of what Elon Musk paid to buy it",
        "source": "Bing"
      },
      {
        "image_url": "https://www.themobileindian.com/wp-content/uploads/2023/02/Twitter-Blue-in-India.png",
        "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.yptgj-K4Pf8YhPlLdPhuGQHaEK?pid=Api",
        "title": "Twitter Blue subscription service in India launched with different ...",
        "source": "Bing"
      },
      {
        "image_url": "https://cloudfront-us-east-2.images.arcpublishing.com/reuters/2AZAYZLDVNIG3FTA2VZW32SQJ4.jpg",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.S1BNUTgPbzHVcJvGuO5ozAHaE6?pid=Api",
        "title": "Explainer: Will Twitter layoffs violate U.S. law? | Reuters",
        "source": "Bing"
      },
      {
        "image_url": "https://images.hindustantimes.com/tech/img/2023/07/27/1600x900/TWITTER-X-LOGO-25_1690431986418_1690431997459.jpg",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.8YqQ5YBkEUGZCa__RTdLBQHaEK?pid=Api",
        "title": "Twitter, Elon Musk and the X: Legal controversy set to hit the new logo ...",
        "source": "Bing"
      },
      {
        "image_url": "https://static.vecteezy.com/system/resources/previews/031/737/215/original/twitter-new-logo-twitter-icons-new-twitter-logo-x-2023-x-social-media-icon-free-png.png",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.oCJrI2WrveJX_Z92adOVrwHaHa?pid=Api",
        "title": "Twitter new logo . Twitter icons. New twitter logo x 2023. x Social ...",
        "source": "Bing"
      },
      {
        "image_url": "https://kpopping.com/documents/f5/4/1082/230217-8TURN-Haemin-Twitter-Update-documents-1.jpeg?v=ed7e4",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.BUmd3EoGhF9zWDWHNuAeDAHaJ2?pid=Api",
        "title": "230217 8TURN Haemin Twitter Update | kpopping",
        "source": "Bing"
      },
      {
        "image_url": "https://kpopping.com/documents/65/4/1536/230324-FIFTY-FIFTY-Twitter-Update-Saena-documents-2.jpeg?v=95233",
        "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.MG2CwcqL30miv_LdyURrYwHaJ4?pid=Api",
        "title": "230324 FIFTY FIFTY Twitter Update - Saena | kpopping",
        "source": "Bing"
      },
      {
        "image_url": "https://i1.rgstatic.net/ii/profile.image/1027724122533888-1622039933145_Q512/Mohammad-Mannan-8.jpg",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.2194uBO5eTATIWT4nlqLaAHaHa?pid=Api",
        "title": "Al Mannan's Instagram, Twitter & Facebook on IDCrawl",
        "source": "Bing"
      }
    ]
  }
};

const MOCK_PROFILE_RESPONSES: { [key: string]: { profile: ProfileDetails } } = {
  instagram: {
    "profile": {
      "real_name": "عثمان بٹ",
      "bio": "اللهم إني أسألك حسن الخاتمة",
      "total_posts": "0",
      "total_followers": "166",
      "total_following": "727",
      "profile_url": "https://www.instagram.com/usmancout"
    }
  },
  twitter: {
    "profile": {
      "real_name": "Elon Musk",
      "bio": "",
      "location": "",
      "total_posts": "",
      "total_followers": "234.3M",
      "total_following": "1,284",
      "profile_url": "https://x.com/elonmusk"
    }
  },
  facebook: {
    "profile": {
      "real_name": "Saqib Ali Jaspal",
      "bio": "Personal details",
      "location": "",
      "total_posts": "",
      "total_followers": "",
      "total_following": "",
      "profile_url": "https://www.facebook.com/saqibali.jaspal"
    }
  },
  tiktok: {
    "profile": {
      "real_name": "jackyanimations_",
      "bio": "Share many funny animations! Follow me",
      "location": "",
      "total_posts": "",
      "total_followers": "107.6K",
      "total_following": "66",
      "total_likes": "2M",
      "profile_url": "https://www.tiktok.com/@jackyanimations_"
    }
  },
  bitbucket: {
      "profile": {
          "real_name": "Abdul Mannan",
          "bio": "Bitbucket user profile",
          "location": "Earth"
      }
  }
};

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

const MOCK_POSTS_RESPONSE = {
  "job_id": "-8689213933029227004",
  "result": [
    {
      "post_url": "https://www.instagram.com/mannanworld/p/DD9dfuRB4xW/",
      "datetime": "2024-07-15T10:30:00Z",
      "caption": "A great day out with the team!",
      "likes": "3506",
      "comments": "203",
      "shares": "0",
      "views": "0",
      "media_type": "image",
      "media_url": "https://picsum.photos/seed/post1/400/400"
    },
    {
      "post_url": "https://www.instagram.com/mannanworld/p/DB3iqrNhCCS/",
      "datetime": "2024-07-10T18:45:00Z",
      "caption": "Exploring new horizons. #travel",
      "likes": "16000",
      "comments": "2",
      "shares": "0",
      "views": "0",
      "media_type": "image",
      "media_url": "https://picsum.photos/seed/post2/400/400"
    },
    {
      "post_url": "https://www.instagram.com/mannanworld/p/DA5zyxGhXYZ/",
      "datetime": "2024-07-01T12:00:00Z",
      "caption": "Just launched a new project. Check it out!",
      "likes": "8250",
      "comments": "150",
      "shares": "0",
      "views": "0",
      "media_type": "text",
      "media_url": ""
    }
  ]
};