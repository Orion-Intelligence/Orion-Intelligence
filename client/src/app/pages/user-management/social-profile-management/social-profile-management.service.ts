import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { SocialPersona, SocialPersonaCreateRequest, SocialPersonaListResponse, SocialPersonaUpdateRequest, SocialProfile, SocialProfileAssignmentRequest, SocialProfileAssignmentResponse, SocialProfileConnectRequest, SocialProfileListResponse, SocialProfileUpdateRequest, } from '../../../shared/model/profile/social-profile-management.model';

@Injectable({ providedIn: 'root' })
export class SocialProfileManagementService {
  constructor(private apiService: ApiService) {}

  getPersonas(): Observable<SocialPersonaListResponse> {
    return this.apiService.get<SocialPersonaListResponse>('social-profile-management/personas');
  }

  createPersona(payload: SocialPersonaCreateRequest): Observable<SocialPersona> {
    return this.apiService.post<SocialPersona>('social-profile-management/personas', payload);
  }

  updatePersona(personaId: string, payload: SocialPersonaUpdateRequest): Observable<SocialPersona> {
    return this.apiService.put<SocialPersona>(`social-profile-management/personas/${personaId}`, payload);
  }

  deletePersona(personaId: string): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`social-profile-management/personas/${personaId}`);
  }

  getProfiles(): Observable<SocialProfileListResponse> {
    return this.apiService.get<SocialProfileListResponse>('social-profile-management/profiles');
  }

  connectProfile(payload: SocialProfileConnectRequest): Observable<SocialProfile> {
    return this.apiService.post<SocialProfile>('social-profile-management/profiles/connect', payload);
  }

  reconnectProfile(profileId: string): Observable<SocialProfile> {
    return this.apiService.post<SocialProfile>(`social-profile-management/profiles/${profileId}/connect`, {});
  }

  updateProfile(profileId: string, payload: SocialProfileUpdateRequest): Observable<SocialProfile> {
    return this.apiService.put<SocialProfile>(`social-profile-management/profiles/${profileId}`, payload);
  }

  deleteProfile(profileId: string): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`social-profile-management/profiles/${profileId}`);
  }

  assignProfile(payload: SocialProfileAssignmentRequest): Observable<SocialProfileAssignmentResponse> {
    return this.apiService.post<SocialProfileAssignmentResponse>('social-profile-management/assignments', payload);
  }

  removeAssignment(profileId: string): Observable<SocialProfileAssignmentResponse> {
    return this.apiService.delete<SocialProfileAssignmentResponse>(`social-profile-management/assignments/${profileId}`);
  }
}
