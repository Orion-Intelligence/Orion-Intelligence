export type SocialPlatform = 'facebook' | 'x';
export type SocialAgeGroup = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
export type SocialGender = 'male' | 'female' | 'unspecified';
export type SocialConnectionStatus = 'pending' | 'connected' | 'failed' | 'disconnected';
export type SocialAssignmentStatus = 'assigned' | 'unassigned';

export interface SocialPersona {
  persona_id: string;
  name: string;
  age_group: SocialAgeGroup;
  gender: SocialGender;
  country?: string | null;
  city?: string | null;
  interests: string[];
  adult_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialProfile {
  profile_id: string;
  platform: SocialPlatform;
  profile_name?: string | null;
  profile_username?: string | null;
  assigned_persona_id?: string | null;
  connection_status: SocialConnectionStatus;
  assignment_status: SocialAssignmentStatus;
  session_data?: Record<string, unknown> | null;
  last_session_check?: string | null;
  login_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPersonaListResponse {
  personas: SocialPersona[];
}

export interface SocialProfileListResponse {
  profiles: SocialProfile[];
}

export interface SocialPersonaCreateRequest {
  name: string;
  age_group: SocialAgeGroup;
  gender: SocialGender;
  country?: string | null;
  city?: string | null;
  interests: string[];
}

export type SocialPersonaUpdateRequest = Partial<SocialPersonaCreateRequest>;

export interface SocialProfileConnectRequest {
  platform: SocialPlatform;
  profile_name?: string | null;
  profile_username?: string | null;
}

export interface SocialProfileUpdateRequest {
  profile_name?: string | null;
  profile_username?: string | null;
  connection_status?: SocialConnectionStatus | null;
}

export interface SocialProfileAssignmentRequest {
  persona_id: string;
  profile_id: string;
}

export interface SocialProfileAssignmentResponse {
  message: string;
  profile: SocialProfile;
}
