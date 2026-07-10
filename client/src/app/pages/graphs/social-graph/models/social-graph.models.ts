import type { DestroyRef } from '@angular/core';
import type { Subject } from 'rxjs';
import type { Job, ManagedPlatform, PlatformResult, SocialGraphState } from '../../../../shared/model/social/social-scan.models';
import type { SocialService } from '../services/social.service';

export interface FeedUser {
  username: string;
  platforms: PlatformResult[];
  allPlatforms: PlatformResult[];
}

export type FetchTabKey = 'details' | 'posts' | 'extension' | 'extensionDetails' | 'extensionPosts' | 'videos' | 'shorts' | 'images' | 'connections' | 'followers' | 'following' | 'onlinePresence' | 'stealerLogs';
export type PostContentTabKey = Extract<FetchTabKey, 'posts' | 'videos' | 'shorts'>;
export type FetchMergeMode = 'prepend' | 'append' | 'update';
export type PostFetchMergeMode = FetchMergeMode;
export type ImageFetchMergeMode = FetchMergeMode;

export interface PostCursorFetchRequest {
  platformData: PlatformResult;
  tabKey: PostContentTabKey;
  cursorId?: string;
  limit?: number;
  commentOffset?: number;
  maxComments?: number;
  mergeMode: PostFetchMergeMode;
  commentsOnly?: boolean;
  remoteFetch?: boolean;
}

export interface ImageCursorFetchRequest {
  platformData: PlatformResult;
  limit?: number;
  mergeMode: ImageFetchMergeMode;
}

export interface FetchTab {
  key: FetchTabKey;
  label: string;
  icon: string;
}

export interface SocialExtensionStatus {
  online: number;
  backend_url?: string;
  error?: string;
  detail?: string;
  extensions: Array<{
    extension_id: string;
    status: string;
    platforms: string[];
    commands: string[];
    connected_at: string;
    last_seen_at: string;
    active_job_id: string | null;
  }>;
}

export interface OnlinePresenceFetchRequest {
  platformData: PlatformResult;
  token: string;
}

export type SocialPlatformCapabilityKey = FetchTabKey | 'comments';

export interface SocialPlatformCapability {
  allow?: string[];
  disallow?: SocialPlatformCapabilityKey[];
}

export type SocialPlatformCapabilityMap = Record<string, SocialPlatformCapability>;

export type NotificationType = 'scanning' | 'busy';

export interface NotificationData {
  type: NotificationType;
  message: string;
  icon: string;
  style: string;
}

export interface DeleteConfirmationData {
  message: string;
}

export type FetchStateKey = 'profile' | 'posts' | 'videos' | 'shorts' | 'platformImages' | 'extensionProfile' | 'extensionPosts' | 'followers' | 'following' | 'onlinePresence' | 'stealerLogs';

export type UpdateStateFn = (updater: (state: SocialGraphState) => void) => void;

export interface ScanJobOptions {
  jobs: () => Job[];
  updateState: UpdateStateFn;
  state: SocialService;
  destroyRef: DestroyRef;
  cancelScanSubjects: Map<string, Subject<void>>;
  persistProfiles?: (profileUsername: string, profiles: PlatformResult[]) => void;
}

export type ManagedPlatformRow = ManagedPlatform & {
  draftUsername: string;
  initialUsername: string;
};
