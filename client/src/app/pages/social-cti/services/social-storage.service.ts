import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { Job, db_social_model, social_profile } from '../models/social.models';
import { ApiEnvelope, socialSelectionKey, social_state } from '../models/social-usability.models';
@Injectable({ providedIn: 'root' })
export class SocialStorageService {
  private readonly api = inject(ApiService);

  readonly state: social_state = { scanResults: signal(new Map<string, social_profile[]>()), selectedKeys: signal(new Set<string>()), jobs: signal<Job[]>([]), homeMenuSearchTerm: signal(''), isHomeMenuCollapsed: signal(false), activeUsername: signal<string | null>(null) };
  readonly activeUsername = computed(() => {
    const usernames = Array.from(this.state.scanResults().keys());
    const selectedUsername = this.state.activeUsername();
    return usernames.find(username => username.toLowerCase() === selectedUsername?.toLowerCase())
      ?? usernames[0]
      ?? null;
  });

  isSelected(ownerUsername: string, platform: social_profile): boolean {
    return this.state.selectedKeys().has(socialSelectionKey(ownerUsername, platform));
  }

  setSelection(ownerUsername: string, selectedProfiles: social_profile[]): void {
    const prefix = `${(ownerUsername || '').toLowerCase()}|`;
    const keys = new Set(this.state.selectedKeys());
    for (const key of Array.from(keys)) {
      if (key.startsWith(prefix)) {
        keys.delete(key);
      }
    }
    for (const platform of selectedProfiles) {
      keys.add(socialSelectionKey(ownerUsername, platform));
    }
    this.state.selectedKeys.set(keys);
  }

  loadProfiles(): Observable<void> {
    return this.api.get<ApiEnvelope<db_social_model[]>>('social/data').pipe(map(response => Array.isArray(response?.result) ? response.result : []),
      tap(documents => this.setStoredSocialProfiles(documents)),
      map(() => undefined),);
  }

  saveProfiles(username: string, profiles: social_profile[], replace = false): Observable<unknown> {
    const prefix = `${(username || '').toLowerCase()}|`;
    const selected = Array.from(this.state.selectedKeys()).filter(key => key.startsWith(prefix));
    return this.api.post('social/data', { profile_username: username, profiles, selected, replace });
  }

  deleteProfiles(username: string): Observable<unknown> {
    return this.api.delete(`social/data/${encodeURIComponent(username)}`);
  }

  private setStoredSocialProfiles(documents: db_social_model[]): void {
    const storedDocuments = documents.filter(document => !!document.profile_username);
    this.state.jobs.update(currentJobs => {
      const runningJobs = currentJobs.filter(job => job.status === 'queued' || job.status === 'in_progress');
      const runningIds = new Set(runningJobs.map(job => job.id));
      return [
        ...runningJobs,
        ...storedDocuments
          .filter(document => !runningIds.has(document.profile_username ?? ''))
          .map(document => this.createStoredJob(document)),
      ];
    });
    this.state.scanResults.set(new Map(storedDocuments.map(document => [document.profile_username ?? '', document.profiles || []])));

    const selectedKeys = new Set<string>();
    for (const document of storedDocuments) {
      if (Array.isArray(document.selected) && document.selected.length > 0) {
        document.selected.forEach((key: string) => selectedKeys.add(key));
      }
      else {
        (document.profiles || []).forEach((platform: social_profile) => {
          if ((platform as { isSelected?: boolean }).isSelected) {
            selectedKeys.add(socialSelectionKey(document.profile_username ?? '', platform));
          }
        });
      }
    }
    this.state.selectedKeys.set(selectedKeys);

    const selectedUsername = this.state.activeUsername();
    if (!selectedUsername || !this.state.scanResults().has(selectedUsername)) {
      this.state.activeUsername.set(storedDocuments[0]?.profile_username ?? null);
    }
  }

  private createStoredJob(document: db_social_model): Job {
    const id = document.profile_username ?? '';
    const status = document.scan?.status;
    if (status === 'pending') {
      return { id, status: 'in_progress', progress: document.scan?.progress ?? 5, step: document.scan?.step ?? 'Resuming' };
    }
    if (status === 'failed' || status === 'cancelled') {
      return { id, status: 'failed', progress: 0, step: status === 'cancelled' ? 'Scan cancelled' : 'Scan failed' };
    }
    return { id, status: 'completed', progress: 100, step: `${document.profiles.length} profiles` };
  }
}
