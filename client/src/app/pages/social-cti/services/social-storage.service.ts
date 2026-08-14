import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { ApiEnvelope, Job, PlatformResult, SocialProfilesState, SocialSidebarState, SocialStoredProfile } from '../models/social-scan.models';

@Injectable({ providedIn: 'root' })
export class SocialStorageService {
  private readonly api = inject(ApiService);

  readonly sidebarState: SocialSidebarState = { homeMenuSearchTerm: signal(''), jobs: signal<Job[]>([]), isHomeMenuCollapsed: signal(false), activeUsername: signal<string | null>(null) };
  readonly profilesState: SocialProfilesState = { scanResults: signal(new Map<string, PlatformResult[]>()) };
  readonly activeUsername = computed(() => {
    const usernames = Array.from(this.profilesState.scanResults().keys());
    const selectedUsername = this.sidebarState.activeUsername();
    return usernames.find(username => username.toLowerCase() === selectedUsername?.toLowerCase())
      ?? usernames[0]
      ?? null;
  });

  loadProfiles(): Observable<void> {
    return this.api.get<ApiEnvelope<SocialStoredProfile[]>>('social/data').pipe(map(response => Array.isArray(response?.result) ? response.result : []),
      tap(documents => this.setStoredSocialProfiles(documents)),
      map(() => undefined),);
  }

  saveProfiles(username: string, profiles: PlatformResult[], replace = false, status = 'complete'): Observable<unknown> {
    return this.api.post('social/data', { profile_username: username, profiles, replace, status });
  }

  deleteProfiles(username: string): Observable<unknown> {
    return this.api.delete(`social/data/${encodeURIComponent(username)}`);
  }

  private setStoredSocialProfiles(documents: SocialStoredProfile[]): void {
    const storedDocuments = documents.filter(document => !!document.profile_username);
    this.sidebarState.jobs.update(currentJobs => {
      const runningJobs = currentJobs.filter(job => job.status === 'queued' || job.status === 'in_progress');
      const runningUsernames = new Set(runningJobs.map(job => job.username));
      return [
        ...runningJobs,
        ...storedDocuments
          .filter(document => !runningUsernames.has(document.profile_username))
          .map(document => this.createStoredJob(document)),
      ];
    });
    this.profilesState.scanResults.set(new Map(storedDocuments.map(document => [document.profile_username, document.profiles || []])));

    const selectedUsername = this.sidebarState.activeUsername();
    if (!selectedUsername || !this.profilesState.scanResults().has(selectedUsername)) {
      this.sidebarState.activeUsername.set(storedDocuments[0]?.profile_username ?? null);
    }
  }

  private createStoredJob(document: SocialStoredProfile): Job {
    if (document.status === 'pending') {
      return { id: `stored-${document.profile_username}`, username: document.profile_username, status: 'in_progress', progress: 5, step: 'Resuming' };
    }
    if (document.status === 'failed') {
      return { id: `stored-${document.profile_username}`, username: document.profile_username, status: 'failed', progress: 0, step: 'Scan failed' };
    }
    return {
      id: `stored-${document.profile_username}`,
      username: document.profile_username,
      status: 'completed',
      progress: 100,
      step: `${document.count ?? document.profiles.length} profiles`,
    };
  }
}
