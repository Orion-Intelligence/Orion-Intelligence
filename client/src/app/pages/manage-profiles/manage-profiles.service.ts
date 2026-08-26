import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, filter, map, of, switchMap, take, timer } from 'rxjs';
import { PlatformEntry, SessionEntry } from './model/manage-profiles.model';
import { SocialExtensionService } from '../../shared/services/social-extension.service';

export type ManageProfilesExtensionState = 'ready' | 'signin' | 'install' | 'update' | 'unsupported';

@Injectable({ providedIn: 'root' })
export class ManageProfilesService {
  private readonly http = inject(HttpClient);
  private readonly extension = inject(SocialExtensionService);

  detectExtension(): Observable<ManageProfilesExtensionState> {
    return this.extension.detect();
  }

  fetchPlatforms(): Observable<{ items: PlatformEntry[]; error?: string }> {
    return timer(0, 3000).pipe(switchMap(() => this.http.post<{ result?: { items?: PlatformEntry[] }; error?: string; status?: string }>('/api/manage-profiles/platforms', {}, { withCredentials: true })),
      map(response => ({ pending: response?.status === 'pending', items: (response?.result?.items ?? []) as PlatformEntry[], error: response?.error })),
      filter(result => !result.pending),
      take(1),
      map(result => ({ items: result.items, error: result.error })),
      catchError(() => of<{ items: PlatformEntry[]; error?: string }>({ items: [], error: 'load_failed' })));
  }

  fetchSession(platform: string, url: string, sessionId = ''): Observable<{ platform?: string; saved?: boolean; error?: string }> {
    return timer(0, 2500).pipe(switchMap(() => this.http.post<{ result?: { platform?: string; saved?: boolean }; error?: string; status?: string }>('/api/manage-profiles/session', { platform, url, session_id: sessionId }, { withCredentials: true })),
      map(response => ({ pending: response?.status === 'pending', platform: response?.result?.platform, saved: response?.result?.saved, error: response?.error })),
      filter(result => !result.pending),
      take(1),
      map(result => ({ platform: result.platform, saved: result.saved, error: result.error })),
      catchError(() => of<{ platform?: string; saved?: boolean; error?: string }>({ error: 'session_failed' })));
  }

  verifySession(platform: string, url: string, sessionId: string): Observable<{ verified?: boolean; username?: string; error?: string }> {
    return timer(0, 2500).pipe(switchMap(() => this.http.post<{ result?: { verified?: boolean; username?: string }; error?: string; status?: string }>('/api/manage-profiles/session/verify', { platform, url, session_id: sessionId }, { withCredentials: true })),
      map(response => ({ pending: response?.status === 'pending', verified: response?.result?.verified, username: response?.result?.username, error: response?.error })),
      filter(result => !result.pending),
      take(1),
      map(result => ({ verified: result.verified, username: result.username, error: result.error })),
      catchError(() => of<{ verified?: boolean; username?: string; error?: string }>({ error: 'verify_failed' })));
  }

  loadCapturedSessions(): Observable<Record<string, SessionEntry[]>> {
    return this.http.post<{ result?: { platforms?: Record<string, SessionEntry[]> } }>('/api/manage-profiles/sessions', {}, { withCredentials: true }).pipe(map(response => response?.result?.platforms ?? {}),
      catchError(() => of<Record<string, SessionEntry[]>>({})));
  }

  deleteSession(platform: string, sessionId: string): Observable<void> {
    return this.http.delete(`/api/manage-profiles/session/${encodeURIComponent(platform)}/${encodeURIComponent(sessionId)}`, { withCredentials: true }).pipe(map(() => undefined),
      catchError(() => of(undefined)));
  }
}
