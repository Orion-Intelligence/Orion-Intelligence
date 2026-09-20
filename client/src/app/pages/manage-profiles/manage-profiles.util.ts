import { RESULTS_ACTIVITY_LABELS, RESULTS_FALLBACK_PROFILE_LABEL, RESULTS_RUNNING_TITLES } from './constants/manage-profiles.constants';
import { ManageProfilePostRow, ManageProfilePostSource, ManageProfileResultRow, ManageProfileResultsActivity } from './model/manage-profiles.interfaces.model';
import { PlatformEntry, SocialAdDetectionResult, SocialHateSpeechDetectedPost, SocialHateSpeechResult, SocialPostResult, SocialProfile, SocialProfileActiveRun, SocialProfileResultsOverview } from './model/manage-profiles.model';
import { getOwnProperty } from '../../shared/utils/type-guards.util';

export function safePlatform(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function platformLabel(platforms: PlatformEntry[], platform: string): string {
  return platforms.find(entry => safePlatform(entry.platform) === safePlatform(platform))?.platform ?? platform;
}

export function profileDisplayName(profile: SocialProfile): string {
  if (profile.profile_name?.trim()) {
    return profile.profile_name;
  }
  return profile.profile_username?.trim() ? profile.profile_username : RESULTS_FALLBACK_PROFILE_LABEL;
}

export function profileOptionLabel(platforms: PlatformEntry[], profile: SocialProfile): string {
  return `${platformLabel(platforms, profile.platform)} - ${profileDisplayName(profile)}`;
}

export function profileLabel(profiles: SocialProfile[], platforms: PlatformEntry[], profileId: string, platform = ''): string {
  const profile = profiles.find(entry => entry.profile_id === profileId);
  if (!profile) {
    return platform ? platformLabel(platforms, platform) : RESULTS_FALLBACK_PROFILE_LABEL;
  }
  return profileOptionLabel(platforms, profile);
}

export function profileName(profiles: SocialProfile[], profileId: string): string {
  const profile = profiles.find(entry => entry.profile_id === profileId);
  return profile ? profileDisplayName(profile) : RESULTS_FALLBACK_PROFILE_LABEL;
}

export function activityLabel(activity: ManageProfileResultsActivity): string {
  return getOwnProperty(RESULTS_ACTIVITY_LABELS, activity) ?? '';
}

export function emptyResultRow(): ManageProfileResultRow {
  return { key: '', runId: '', profileId: '', activity: 'posting', activityLabel: '', profileLabel: '', title: '', dateTime: '', running: false, isManual: false, error: false, sessionExpired: false, errorReason: '', step: '', postUrl: '', postText: '', imageUrl: '', ads: [], posts: [] };
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function runResultRow(run: SocialProfileActiveRun, profiles: SocialProfile[], platforms: PlatformEntry[]): ManageProfileResultRow {
  const activity = (run.activity || 'posting') as ManageProfileResultsActivity;
  return {
    ...emptyResultRow(),
    key: `run-${run.run_id}`,
    runId: run.run_id,
    profileId: run.profile_id,
    activity,
    activityLabel: activityLabel(activity),
    profileLabel: profileLabel(profiles, platforms, run.profile_id, run.platform),
    title: getOwnProperty(RESULTS_RUNNING_TITLES, activity) ?? '',
    dateTime: run.started_at,
    running: true,
    isManual: !!run.is_manual,
    step: run.step || '',
  };
}

export function postResultRow(result: SocialPostResult, index: number, profiles: SocialProfile[], platforms: PlatformEntry[]): ManageProfileResultRow {
  return {
    ...emptyResultRow(),
    key: `post-${index}`,
    profileId: result.profile_id,
    activity: 'posting',
    activityLabel: activityLabel('posting'),
    profileLabel: profileLabel(profiles, platforms, result.profile_id),
    title: result.error ? 'Post failed' : 'Post published',
    dateTime: result.date_time,
    isManual: !!result.is_manual,
    error: !!result.error,
    sessionExpired: !!result.session_expired,
    errorReason: result.error_reason || '',
    postUrl: result.post_url || '',
    postText: result.post_text ?? '',
    imageUrl: result.image_url ?? '',
  };
}

export function adResultRow(result: SocialAdDetectionResult, index: number, profiles: SocialProfile[], platforms: PlatformEntry[]): ManageProfileResultRow {
  return {
    ...emptyResultRow(),
    key: `ad-${index}`,
    profileId: result.profile_id,
    activity: 'ad_detection',
    activityLabel: activityLabel('ad_detection'),
    profileLabel: profileLabel(profiles, platforms, result.profile_id),
    title: pluralize(result.total_detected_ads, 'ad detected', 'ads detected'),
    dateTime: result.date_time,
    isManual: !!result.is_manual,
    error: !!result.error,
    sessionExpired: !!result.session_expired,
    errorReason: result.error_reason || '',
    ads: result.ads || [],
  };
}

export function hateSpeechResultRow(result: SocialHateSpeechResult, index: number, profiles: SocialProfile[], platforms: PlatformEntry[]): ManageProfileResultRow {
  return {
    ...emptyResultRow(),
    key: `hate-${index}`,
    profileId: result.profile_id,
    activity: 'hate_speech',
    activityLabel: activityLabel('hate_speech'),
    profileLabel: profileLabel(profiles, platforms, result.profile_id),
    title: `${pluralize(result.hate_posts_count, 'hate speech detected', 'hate speeches detected')} out of ${result.total_posts}`,
    dateTime: result.date_time,
    isManual: !!result.is_manual,
    error: !!result.error,
    sessionExpired: !!result.session_expired,
    errorReason: result.error_reason || '',
    posts: result.posts || [],
  };
}

export function sortNewestFirst<T extends { dateTime: string }>(rows: T[]): T[] {
  return [...rows].sort((first, second) => new Date(second.dateTime).getTime() - new Date(first.dateTime).getTime());
}

export function buildResultRows(response: SocialProfileResultsOverview | null | undefined, profiles: SocialProfile[], platforms: PlatformEntry[]): { running: ManageProfileResultRow[]; finished: ManageProfileResultRow[] } {
  const running = (response?.active_runs ?? []).map(run => runResultRow(run, profiles, platforms));
  const finished = sortNewestFirst([
    ...(response?.post_results ?? []).map((result, index) => postResultRow(result, index, profiles, platforms)),
    ...(response?.ad_detection_results ?? []).map((result, index) => adResultRow(result, index, profiles, platforms)),
    ...(response?.hate_speech_results ?? []).map((result, index) => hateSpeechResultRow(result, index, profiles, platforms)),
  ]);
  return { running, finished };
}

export function flattenPostRows(rows: ManageProfileResultRow[], profiles: SocialProfile[]): ManageProfilePostRow[] {
  const seen = new Set<string>();
  const posts: ManageProfilePostRow[] = [];
  const push = (row: ManageProfileResultRow, post: SocialHateSpeechDetectedPost, source: ManageProfilePostSource, imageUrl: string): void => {
    const dedupeKey = `${row.profileId}|${post.url || row.key}`;
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    posts.push({ ...post, key: `${row.key}-${posts.length}`, profileId: row.profileId, profileLabel: row.profileLabel, dateTime: String(post.detected_at || row.dateTime), source, imageUrl });
  };
  for (const row of rows) {
    if (row.running || row.error) {
      continue;
    }
    if (row.activity === 'posting') {
      push(row, { url: row.postUrl, author: profileName(profiles, row.profileId), content_text: row.postText, is_hate_speech: false, label: '', detected_at: row.dateTime }, 'published', row.imageUrl);
    }
    if (row.activity === 'hate_speech') {
      for (const post of row.posts) {
        push(row, post, 'crawled', '');
      }
    }
  }
  return sortNewestFirst(posts);
}
