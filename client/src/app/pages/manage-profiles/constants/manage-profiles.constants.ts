import type { UiDropdownOption } from '../../../shared/partials/ui-dropdown/ui-dropdown.component';
import type { ManageProfileResultsActivity, ManageProfileResultsView, ManageProfilesTabEntry } from '../model/manage-profiles.interfaces.model';

export const MANAGE_PROFILES_TABS: ManageProfilesTabEntry[] = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'personas', label: 'Personas' },
  { key: 'profiles', label: 'Accounts' },
  { key: 'assignments', label: 'Persona Monitoring', description: 'Monitor posts and ads using a persona assigned to a profile.' },
  { key: 'hate_monitoring', label: 'Profile Monitoring', description: 'Monitor a real social media profile for hate speech.' },
  { key: 'results', label: 'Results' },
];

export const PROFILE_PURPOSE_OPTIONS: UiDropdownOption[] = [ { key: 'posting', label: 'Posting' }, { key: 'ad_monitoring', label: 'Ad Monitoring' } ];

export const MAX_SESSIONS_PER_PLATFORM = 10;

export const SHIMMER_ROWS = [1, 2, 3, 4, 5];

export const RESULTS_REFRESH_INTERVAL_MS = 5000;

export const RESULTS_VIEW_OPTIONS: (UiDropdownOption & { key: ManageProfileResultsView })[] = [ { key: 'ads', label: 'Ads' }, { key: 'posts', label: 'Posts' }, { key: 'hate_speech', label: 'Profile Monitoring' } ];

export const RESULTS_DEFAULT_VIEW: ManageProfileResultsView = 'ads';

export const RESULTS_ACTIVITY_LABELS: Record<ManageProfileResultsActivity, string> = { ad_detection: 'Ad Detection', posting: 'Posting', hate_speech: 'Hate Speech' };

export const RESULTS_RUNNING_TITLES: Record<ManageProfileResultsActivity, string> = { ad_detection: 'Scanning for ads', posting: 'Publishing post', hate_speech: 'Scanning for hate speech' };

export const RESULTS_FALLBACK_PROFILE_LABEL = 'Account';
