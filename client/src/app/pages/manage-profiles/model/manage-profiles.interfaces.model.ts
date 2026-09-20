import { SocialAdDetectionResult, SocialHateSpeechDetectedPost, SocialHateSpeechResult } from './manage-profiles.model';

export interface PendingSessionDelete {
  platform: string;
  sessionId: string;
}

export type ManageProfilesExtensionState = 'checking' | 'ready' | 'signin' | 'install' | 'update' | 'unsupported';
export type ManageProfilesTab = 'personas' | 'sessions' | 'profiles' | 'assignments' | 'results' | 'hate_monitoring';
export type ManageProfilesModalMode = 'persona' | 'profile' | 'hate_profile';
export type ManageProfilesConfirmationAction = 'persona' | 'profile' | 'assignment' | '';
export type ManageProfilePopupMode = 'persona' | 'profile';
export type ManageProfilePopupSaveEvent = 'persona' | 'profile';

export interface ManageProfilesTabEntry {
  key: ManageProfilesTab;
  label: string;
  description?: string;
}

export type ManageProfileResultsActivity = 'ad_detection' | 'posting' | 'hate_speech';
export type ManageProfileResultsView = 'ads' | 'posts';
export type ManageProfilePostSource = 'published' | 'crawled';

export interface ManageProfilePostRow extends SocialHateSpeechDetectedPost {
  key: string;
  profileId: string;
  profileLabel: string;
  dateTime: string;
  source: ManageProfilePostSource;
  imageUrl: string;
}

export interface ManageProfileResultRow {
  key: string;
  runId: string;
  profileId: string;
  activity: ManageProfileResultsActivity;
  activityLabel: string;
  profileLabel: string;
  title: string;
  dateTime: string;
  running: boolean;
  isManual: boolean;
  error: boolean;
  sessionExpired: boolean;
  errorReason: string;
  step: string;
  postUrl: string;
  postText: string;
  imageUrl: string;
  ads: SocialAdDetectionResult['ads'];
  posts: SocialHateSpeechResult['posts'];
}
