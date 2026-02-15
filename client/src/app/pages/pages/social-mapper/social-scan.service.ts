import { Injectable } from '@angular/core';
import { PlatformResult, ScanEvent, CustomEntity, ProfileDetails, SocialImage, SocialPost } from '../../shared/model/social/social-scan.models';
import { Observable, timer, throwError } from 'rxjs';
import { switchMap, map, filter, take, catchError, tap, retry } from 'rxjs/operators';
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
                    keyUsername: username,
                    platform: item.metadata.platform,
                    username: item.metadata.username,
                    url: item.metadata.url,
                    isSelected: false,
                    status: item.metadata.status,
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
        isReady: (res) => res && 'result' in (res as any),
        mapResult: (res) =>
          ((res as any).result || []).reduce((acc: PlatformResult[], item: any) => {
            let platform = item.metadata.platform;

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

  performImageScan(base64Image: string): Observable<ScanEvent> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        const steps = [
          { progress: 10, step: 'Uploading image...' },
          { progress: 25, step: 'Analyzing image...' },
          { progress: 50, step: 'Finding related profiles...' },
          { progress: 75, step: 'Cross-referencing data...' },
          { progress: 90, step: 'Finalizing results...' }
        ];
  
        let stepIndex = 0;
        const intervalId = setInterval(() => {
          if (subscriber.closed) {
            clearInterval(intervalId);
            return;
          }
  
          if (stepIndex < steps.length) {
            subscriber.next({ type: 'progress', payload: steps[stepIndex] });
            stepIndex++;
          } else {
            clearInterval(intervalId);
            const responseData = MOCK_API_RESPONSE.result;
            const platforms: PlatformResult[] = responseData.map(item => {
              const username = `Image Scan`;
              const extractedData = this.extractMetadata(item.metadata.platform, item.data);
              const platformResult = {
                keyUsername: username,
                platform: item.metadata.platform,
                username: item.metadata.username,
                url: item.metadata.url,
                isSelected: false,
                status: item.metadata.status,
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
          }
        }, 800);
  
        return () => clearInterval(intervalId);
      });
    }
  
    return new Observable(subscriber => {
        subscriber.next({ type: 'progress', payload: { progress: 10, step: 'Submitting image to API...' } });
  
        const pollingSub = this.pollForResult<
          { data?: any[] } | any,
          PlatformResult[]
        >({
          request: () => this.api.post<any>('social/recon/image', { image_base64: base64Image }),
          isReady: (res) => res && 'result' in (res as any),
          mapResult: (res) => {
            const username = `Image Scan Result`;
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
            }, [])
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

    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{ profile: ProfileDetails }>>('social/profile', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ profile: (res.result as any)?.profile ?? {} as ProfileDetails }),
    }).pipe(retry(3));
  }

  fetchPlatformImages(platform: string, username: string): Observable<{ images: SocialImage[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          const images = MOCK_PLATFORM_IMAGES_RESPONSE.result.images.slice(0, Math.floor(Math.random() * 5) + 3);
          subscriber.next({ images });
          subscriber.complete();
        }, 1200);
      });
    }

    return this.pollForResult({
      request: () => this.api.post<ApiEnvelope<{ images: SocialImage[] }>>('social/online/images', { platform, username }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ images: (res.result as any)?.images ?? [] }),
    }).pipe(retry(3));
  }

  fetchSocialPosts(platform: string, username: string): Observable<{ posts: SocialPost[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          subscriber.next({ posts: MOCK_POSTS_RESPONSE.result.posts });
          subscriber.complete();
        }, 1500);
      });
    }

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
  
  fetchFollowers(platform: string, username: string): Observable<{ followers: string[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          subscriber.next({ followers: MOCK_FOLLOWERS_RESPONSE.result.followers });
          subscriber.complete();
        }, 1800);
      });
    }

    return this.pollForResult({
      request: () => this.api.post<any>('social/followers', { platform, username, max_followers: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ followers: (res.result as any)?.followers ?? [] }),
    }).pipe(retry(3));
  }

  fetchFollowing(platform: string, username: string): Observable<{ following: string[] }> {
    if (this.useMockData) {
      return new Observable(subscriber => {
        setTimeout(() => {
          subscriber.next({ following: MOCK_FOLLOWING_RESPONSE.result.following });
          subscriber.complete();
        }, 1800);
      });
    }

    return this.pollForResult({
      request: () => this.api.post<any>('social/following', { platform, username, max_following: 1000 }),
      isReady: (res) => !!res && 'result' in res,
      mapResult: (res) => ({ following: (res.result as any)?.following ?? [] }),
    }).pipe(retry(3));
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

const MOCK_FOLLOWING_RESPONSE = {
  "job_id": "-3391782988347119006",
  "result": {
    "following": [ "reactnative", "pycoders", "joerogan", "tomwarren", "shanselman", "bdsams", "WindowsCentral", "DeepXP", "varunkrish", "BenThePCGuy", "stevesi", "TaimurAsad", "Daniel_Rubino", "gcaughey", "troyhunt", "Tim_Stevens", "WithinRafael", "nixxin", "brandonleblanc", "reckless", "PatrickMoorhead", "JoannaStern", "alex", "USAndMumbai", "USAndIndia", "gokulr", "DA_Stockman", "oasishealthapp", "USAmbIndia", "AnnieJacobsen", "michaelnicollsx", "Interiorarchdes", "GlitchedDeals", "geoffkeighley", "elonmusk", "CaseyDHudson", "gabriel1", "mattiaswikman", "EM_RESUS", "gregjoz", "connormulcahey", "StateOfLinkedIn", "rfkenmore", "julianibarz", "netcapgirl", "stanleytang", "Mononofu", "JustJake", "artenvelope", "davidsven" ],
    "platform": "twitter", "username": "manan", "status": "active"
  }
};

const MOCK_FOLLOWERS_RESPONSE = {
    "job_id": "-3391782988347119007",
    "result": {
        "followers": [ "follower1", "follower2", "follower3", "follower4", "follower5", "follower6", "follower7", "follower8", "follower9", "follower10", "another_user", "test_account", "john_doe", "jane_doe", "user_123", "dev_person", "design_guru", "tech_enthusiast", "social_media_fan", "angular_dev" ],
        "platform": "twitter", "username": "manan", "status": "active"
    }
};

const MOCK_PLATFORM_IMAGES_RESPONSE = {
  "job_id": "7267882239548741175",
  "result": {
    "searched_username": "msmannan00",
    "platform": "tiktok",
    "total_found": 10,
    "images": [
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7544736024065232144&location=0&aid=1988",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.FNuyHkglAtSpU-5vTlH-9AHaNK?pid=Api",
        "title": "mannan420 (@mannan_420) | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7538831037334359318&location=0&aid=1988",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.bp9GZZi5BMZr-ojbzo0KzAHaNK?pid=Api",
        "title": "Gigantic Tits: The Center of Attention | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://p16-sign-sg.tiktokcdn.com/obj/tos-alisg-p-0037/oMAARQAhSinAMDGJUaEkCFyERBeDmgPUuIfGs9?lk3s=81f88b70&x-expires=1741705200&x-signature=TO6YB3kpEpzVis9RZotWSrchUXs=&shp=81f88b70&shcp=-",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.N_VbVnm3Z3nRH0NiHlLubgHaKn?pid=Api",
        "title": "El amigo más discreto 🦖👀 con Diego | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7476959099071122743&location=0&aid=1988",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.YUC2d6dHZ9ohzTdOY0IvcQHaKn?pid=Api",
        "title": "Natasha y el Trend de Erome 🖤 | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7530808936413318418&location=0&aid=1988",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.B-6MFycWeLXYU3S-6vWYvQHaNK?pid=Api",
        "title": "Irritación Abdominal: Consejos de Mammy Chula | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://avatars.githubusercontent.com/u/9531531?v=4?s=400",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.t0Oj-MyKeBrOsjs8yY8s0AAAAA?pid=Api",
        "title": "msmannan00 (عبدالمنان) · GitHub",
        "source": "Bing"
      },
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7559025894099111179&location=0&aid=1988",
        "thumbnail": "https://tse4.mm.bing.net/th/id/OIP.weZvvKsmpUvZV7Jdm-7fhQHaNK?pid=Api",
        "title": "Hari Santri Nasional 2025: Santri Berkontribusi untuk Indonesia | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://preview.redd.it/ms-munchies-v0-oox0c0be6smc1.jpg?width=1283&format=pjpg&auto=webp&s=65ec7e144bd5255cda4949bd8e06d30c5c6c3b43",
        "thumbnail": "https://tse2.explicit.bing.net/th/id/OIP.fewB-YNOuLHwxlTNPuhuzgHaMc?pid=Api",
        "title": "Ms. Munchies : r/tiktokgossip",
        "source": "Bing"
      },
      {
        "image_url": "https://www.tiktok.com/api/img/?itemId=7513464179085446418&location=0&aid=1988",
        "thumbnail": "https://tse3.mm.bing.net/th/id/OIP.pHegp2VwUb7ZflsxIC0CDgHaK0?pid=Api",
        "title": "🌙🌻 Instagram :Samiha_maria. #foryou #fyp #foryoupage #unfrezzm... | TikTok",
        "source": "Bing"
      },
      {
        "image_url": "https://s.yimg.com/ny/api/res/1.2/z3BLorRlb_Fo8oUb76p2rA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD0yMjA4/https://media.zenfs.com/en/usa_today_life_698/1a8f4627c014807c89744074c08fcb3a",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.D9uY6TJMd16nU1_9-b0nIAHaNK?pid=Api",
        "title": "Ms. Shirley, 4, is a TikTok sensation. Some fans are worried, and her ...",
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
        "timestamp": "2026-02-07 17:39:29",
        "status": "active"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Artstation",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://www.artstation.com/msmannan00",
        "timestamp": "2026-02-07 17:39:29",
        "status": "active"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Audiojungle",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://audiojungle.net/user/msmannan00",
        "timestamp": "2026-02-07 17:39:29",
        "status": "active"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Bitbucket",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://bitbucket.org/msmannan00",
        "timestamp": "2026-02-07 17:39:36",
        "status": "active"
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
        "platform": "Bitbucket",
        "username": "msmannan00x",
        "social_handle": "msmannan00x",
        "url": "https://bitbucket.org/msmannan00",
        "timestamp": "2026-02-07 17:39:36",
        "status": "active"
      },
      "data": {
        "url": "https://bitbucket.org/msmannan00/",
        "status": "Claimed",
        "ids": {
          "uid": "23fc0670-24ee-42a3-b73c-a9b703e5dde9",
          "id": "557058:0a9b74fa-e1e6-4467-91cc-476f8b9dce35",
          "fullname": "Abdul Mannan",
          "nickname": "msmannan00x",
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
        "timestamp": "2026-02-07 17:39:36",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Crowdin",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://crowdin.com/profile/msmannan00",
        "timestamp": "2026-02-07 17:39:36",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Discord",
        "username": "discord.com",
        "social_handle": "discord.com",
        "url": "https://discord.com",
        "timestamp": "2026-02-07 17:39:36",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Hub",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://hub.docker.com/u/msmannan00",
        "timestamp": "2026-02-07 17:39:36",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Dribbble",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://dribbble.com/msmannan00",
        "timestamp": "2026-02-07 17:39:36",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Gitlab",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://gitlab.com/msmannan00",
        "timestamp": "2026-02-07 17:39:40",
        "status": "suggested"
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
        "timestamp": "2026-02-07 17:39:40",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Medium",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://medium.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:40",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Replit",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://replit.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:40",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Tiktok",
        "username": "@msmannan00",
        "social_handle": "@msmannan00",
        "url": "https://www.tiktok.com/@msmannan00",
        "timestamp": "2026-02-07 17:39:51",
        "status": "suggested"
      },
      "data": {}
    },
    {
      "metadata": {
        "platform": "Themeforest",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://themeforest.net/user/msmannan00",
        "timestamp": "2026-02-07 17:39:51",
        "status": "suggested"
      },
      "data": null
    },
    {
      "metadata": {
        "platform": "Pinterest",
        "username": "msmannan00",
        "social_handle": "msmannan00",
        "url": "https://www.pinterest.com/msmannan00",
        "timestamp": "2026-02-07 17:39:56",
        "status": "suggested"
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
  "result": {
    "posts": [
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
  }
};
