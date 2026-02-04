
import { Injectable } from '@angular/core';
import { PlatformResult, Job, ScanEvent } from '../../shared/model/social/social-scan.models';
import { Observable, timer, throwError, from } from 'rxjs';
import { switchMap, map, filter, take, catchError, tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SocialScanService {
  private useMockData = false;

  constructor(private api: ApiService) {}

  private extractMetadata(platformName: string, maigretData: any): Partial<PlatformResult> {
    if (!maigretData) return { allMetadata: {} };

    const platformKey = Object.keys(maigretData).find(key => key.toLowerCase() === platformName.toLowerCase());
    const platformData = platformKey ? maigretData[platformKey] : Object.values(maigretData)[0] as any;

    if (!platformData || !platformData.ids) return { allMetadata: {} };

    const ids = platformData.ids;
    const result: Partial<PlatformResult> = {
        allMetadata: ids
    };

    result.description = ids.bio || ids.description;

    const followers = ids.follower_count ?? ids.followers;
    if (followers !== undefined && !isNaN(parseInt(followers, 10))) {
        result.followers = parseInt(followers, 10);
    }

    const dateStr = ids.created_at || ids.joining_date;
    if (dateStr) {
        try {
            result.joiningDate = new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (e) { }
    }
    return result;
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
              const responseData = MOCK_API_RESPONSE.result.data;
              const platforms: PlatformResult[] = responseData
                .filter(item => item.maigret !== null && Object.keys(item.maigret).length > 0)
                .map(item => {
                  const metadata = this.extractMetadata(item.platform, item.maigret);
                  return {
                    platform: item.platform,
                    username: item.username,
                    url: item.url,
                    isSelected: false,
                    ...metadata,
                  } as PlatformResult;
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
    } else {
      return new Observable(subscriber => {
        const progressSteps = [
            { progress: 10, step: 'Submitting job to API...' },
            { progress: 30, step: 'Scan queued, polling for status...' },
            { progress: 60, step: 'Still processing, polling...' },
        ];
        let stepIndex = 0;

        const emitProgress = () => {
            if (stepIndex < progressSteps.length) {
                subscriber.next({ type: 'progress', payload: progressSteps[stepIndex] });
                stepIndex++;
            }
        };

        emitProgress();

        const pollingSub = timer(1000, 2000).pipe(
            switchMap(() => from(this.api.post<any>('social/recon', { username }))),
            map(res => {
                if (res.status === 'error') throw res.message || 'error';
                return res;
            }),
            tap(res => {
                if (!res.result?.data) {
                    emitProgress();
                }
            }),
            filter(res => !!res.result?.data),
            take(1),
            map(res =>
                res.result.data
                    .filter((i: any) => i.maigret !== null)
                    .map((item: any): PlatformResult => {
                      const metadata = this.extractMetadata(item.platform, item.maigret);
                      return {
                        platform: item.platform,
                        username: item.username,
                        url: item.url,
                        isSelected: false,
                        ...metadata,
                      } as PlatformResult;
                    })
            ),
            catchError(err => throwError(() => err))
        ).subscribe({
            next: (platforms) => {
                subscriber.next({ type: 'progress', payload: { progress: 90, step: 'Processing results...' } });
                subscriber.next({ type: 'complete', payload: platforms });
                subscriber.complete();
            },
            error: (err) => {
                subscriber.error(err);
            }
        });

        return () => pollingSub.unsubscribe();
      });
    }
  }
}

const MOCK_API_RESPONSE = {
  "job_id": "-5387221697108712230",
  "result": {
    "status": "success",
    "platform": "recon",
    "data": [
      {
        "platform": "Github",
        "username": "msmannan00",
        "maigret": {
          "GitHub": {
            "url": "https://github.com/msmannan00",
            "status": "Claimed",
            "ids": {
              "uid": "9531531",
              "image": "https://avatars.githubusercontent.com/u/9531531?v=4",
              "created_at": "2014-11-03T13:50:04Z",
              "location": "Pakistan",
              "follower_count": "21",
              "following_count": "1",
              "fullname": "عبدالمنان",
              "public_gists_count": "0",
              "public_repos_count": "25",
              "bio": "Data Intelligence Analyst with a passion for uncovering cybersecurity risks. Skilled in identifying patterns in larger data sets"
            },
            "tags": [
              "coding"
            ],
            "http_status": 200
          },
          "GitHubGist": {
            "url": "https://gist.github.com/msmannan00",
            "status": "Claimed",
            "tags": [
              "coding",
              "sharing"
            ],
            "http_status": 200
          },
          "Libraries": {
            "url": "https://libraries.io/github/msmannan00/",
            "status": "Claimed",
            "ids": {
              "uid": "9531531",
              "username": "msmannan00"
            },
            "tags": [
              "coding",
              "in"
            ],
            "http_status": 200
          }
        },
        "url": "https://www.github.com/msmannan00"
      },
      {
        "platform": "Gitlab",
        "username": "msmannan00",
        "maigret": {
          "GitLab": {
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
        "url": "https://gitlab.com/msmannan00"
      },
      {
        "platform": "Bitbucket",
        "username": "msmannan00",
        "maigret": {
          "BitBucket": {
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
        "url": "https://bitbucket.org/msmannan00"
      },
      {
        "platform": "Discord",
        "username": "discord.com",
        "maigret": null,
        "url": "https://discord.com"
      },
      {
        "platform": "Linkedin",
        "username": "msmannan00",
        "maigret": null,
        "url": "https://linkedin.com/in/msmannan00"
      }
    ]
  }
};
