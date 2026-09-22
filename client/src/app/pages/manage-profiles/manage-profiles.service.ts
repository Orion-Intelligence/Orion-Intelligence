import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, filter, map, of, switchMap, take, timer } from 'rxjs';
import { PlatformEntry, SessionEntry, SocialPersona, SocialPersonaCreateRequest, SocialPersonaListResponse, SocialPersonaUpdateRequest, SocialProfile, SocialProfileAssignmentRequest, SocialProfileAssignmentResponse, SocialProfileConnectRequest, SocialProfileListResponse, SocialProfileResultsOverview, SocialProfileResultsResponse, SocialProfileUpdateRequest } from './model/manage-profiles.model';
import { SocialExtensionService } from '../../shared/services/social-extension.service';

import { ManageProfilesExtensionState } from './model/manage-profiles.interfaces.model';

@Injectable({ providedIn: 'root' })
export class ManageProfilesService {
  private readonly http = inject(HttpClient);
  private readonly extension = inject(SocialExtensionService);

  detectExtension(): Observable<ManageProfilesExtensionState> {
    return this.extension.detect();
  }

  fetchPlatforms(): Observable<{ items: PlatformEntry[]; error?: string }> {
    return timer(0, 3000).pipe(switchMap(() => this.http.post<{ result?: { items?: PlatformEntry[] }; error?: string; status?: string }>('/api/manage-profiles/platforms', {}, { withCredentials: true })),
      map(response => ({ pending: response?.status === 'pending', items: (response?.result?.items ?? []), error: response?.error })),
      filter(result => !result.pending),
      take(1),
      map(result => ({ items: result.items, error: result.error })),
      catchError(() => of<{ items: PlatformEntry[]; error?: string }>({ items: [], error: 'load_failed' })));
  }

  fetchSession(platform: string, url: string, sessionId = ''): Observable<{ platform?: string; session_id?: string; saved?: boolean; error?: string }> {
    return timer(0, 2500).pipe(switchMap(() => this.http.post<{ result?: { platform?: string; session_id?: string; saved?: boolean }; error?: string; status?: string }>('/api/manage-profiles/session', { platform, url, session_id: sessionId }, { withCredentials: true })),
      map(response => ({ pending: response?.status === 'pending', platform: response?.result?.platform, session_id: response?.result?.session_id, saved: response?.result?.saved, error: response?.error })),
      filter(result => !result.pending),
      take(1),
      map(result => ({ platform: result.platform, session_id: result.session_id, saved: result.saved, error: result.error })),
      catchError(() => of<{ platform?: string; session_id?: string; saved?: boolean; error?: string }>({ error: 'session_failed' })));
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

  downloadSession(platform: string, sessionId: string): Observable<Blob> {
    return this.http.get(`/api/manage-profiles/session/${encodeURIComponent(platform)}/${encodeURIComponent(sessionId)}/download`, { withCredentials: true, responseType: 'blob' });
  }

  uploadSession(platform: string, file: File): Observable<{ platform?: string; session_id?: string; saved?: boolean; error?: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ result?: { platform?: string; session_id?: string; saved?: boolean }; error?: string }>(`/api/manage-profiles/session/${encodeURIComponent(platform)}/upload`, form, { withCredentials: true }).pipe(map(response => ({ platform: response?.result?.platform, session_id: response?.result?.session_id, saved: response?.result?.saved, error: response?.error })),
      catchError(() => of<{ platform?: string; session_id?: string; saved?: boolean; error?: string }>({ error: 'upload_failed' })));
  }

  getPersonas(): Observable<SocialPersonaListResponse> {
    return this.http.get<SocialPersonaListResponse>('/api/manage-profiles/personas', { withCredentials: true });
  }

  createPersona(payload: SocialPersonaCreateRequest): Observable<SocialPersona> {
    return this.http.post<SocialPersona>('/api/manage-profiles/personas', payload, { withCredentials: true });
  }

  updatePersona(personaId: string, payload: SocialPersonaUpdateRequest): Observable<SocialPersona> {
    return this.http.put<SocialPersona>(`/api/manage-profiles/personas/${personaId}`, payload, { withCredentials: true });
  }

  deletePersona(personaId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/manage-profiles/personas/${personaId}`, { withCredentials: true });
  }

  getProfiles(): Observable<SocialProfileListResponse> {
    return this.http.get<SocialProfileListResponse>('/api/manage-profiles/profiles', { withCredentials: true });
  }

  connectProfile(payload: SocialProfileConnectRequest): Observable<SocialProfile> {
    return this.http.post<SocialProfile>('/api/manage-profiles/profiles', payload, { withCredentials: true });
  }

  updateProfile(profileId: string, payload: SocialProfileUpdateRequest): Observable<SocialProfile> {
    return this.http.put<SocialProfile>(`/api/manage-profiles/profiles/${profileId}`, payload, { withCredentials: true });
  }

  deleteProfile(profileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/manage-profiles/profiles/${profileId}`, { withCredentials: true });
  }

  assignProfile(payload: SocialProfileAssignmentRequest): Observable<SocialProfileAssignmentResponse> {
    return this.http.post<SocialProfileAssignmentResponse>('/api/manage-profiles/assignments', payload, { withCredentials: true });
  }

  removeAssignment(profileId: string): Observable<SocialProfileAssignmentResponse> {
    return this.http.delete<SocialProfileAssignmentResponse>(`/api/manage-profiles/assignments/${profileId}`, { withCredentials: true });
  }

  getProfileResults(profileId: string): Observable<SocialProfileResultsResponse> {
    return this.http.get<SocialProfileResultsResponse>(`/api/manage-profiles/results/${profileId}`, { withCredentials: true });
  }

  getResultsOverview(): Observable<SocialProfileResultsOverview> {
    return this.http.get<SocialProfileResultsOverview>('/api/manage-profiles/results', { withCredentials: true });
  }

  clearResults(profileId = '', kind = ''): Observable<void> {
    const params: Record<string, string> = {};
    if (profileId) {
      params.profile_id = profileId;
    }
    if (kind) {
      params.kind = kind;
    }
    return this.http.delete<void>('/api/manage-profiles/results', { withCredentials: true, params });
  }

  deleteResultItem(activity: string, profileId: string, dateTime: string): Observable<void> {
    return this.http.delete<void>('/api/manage-profiles/results/item', { withCredentials: true, params: { activity, profile_id: profileId, date_time: dateTime } });
  }

  stopRun(runId: string): Observable<void> {
    return this.http.post<void>(`/api/manage-profiles/results/runs/${encodeURIComponent(runId)}/stop`, {}, { withCredentials: true });
  }

  triggerPostMonitoring(profileId: string): Observable<void> {
    return this.http.post<void>(`/api/manage-profiles/profiles/${encodeURIComponent(profileId)}/trigger-post-monitoring`, {}, { withCredentials: true });
  }

  triggerAdMonitoring(profileId: string): Observable<void> {
    return this.http.post<void>(`/api/manage-profiles/profiles/${encodeURIComponent(profileId)}/trigger-ad-monitoring`, {}, { withCredentials: true });
  }

  triggerHateSpeechMonitoring(profileId: string): Observable<void> {
    return this.http.post<void>(`/api/manage-profiles/profiles/${encodeURIComponent(profileId)}/trigger-hate-speech-monitoring`, {}, { withCredentials: true });
  }
}
