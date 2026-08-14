import type { PlatformResult } from './social-scan.models';
import type { FetchMergeMode, FetchTabKey, PostContentTabKey, SocialPlatformCapabilityKey } from '../enums/social-graph.enums';

export interface FeedUser {
  username: string;
  platforms: PlatformResult[];
  allPlatforms: PlatformResult[];
}

export interface PostCursorFetchRequest {
  platformData: PlatformResult;
  tabKey: PostContentTabKey;
  cursorId?: string;
  commentOffset?: number;
  maxComments?: number;
  mergeMode: FetchMergeMode;
  commentsOnly?: boolean;
}

export interface FetchTab {
  key: FetchTabKey;
  label: string;
  icon: string;
}

interface SocialPlatformCapability {
  allow?: string[];
  disallow?: SocialPlatformCapabilityKey[];
}

export type SocialPlatformCapabilityMap = Record<string, SocialPlatformCapability>;

export interface NotificationData {
  message: string;
  icon: string;
  style: string;
}
