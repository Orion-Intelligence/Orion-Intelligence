import type { WritableSignal } from '@angular/core';
import type { SocialResultSource } from '../enums/social-graph.enums';
export interface ApiEnvelope<T> {
    status?: string;
    message?: unknown;
    result?: T;
    error_code?: string;
    login_url?: string;
    error_platform?: string;
}
export interface Job {
    id: string;
    username: string;
    displayName?: string;
    status: 'queued' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    step: string;
}
export interface ProfileDetails {
    real_name?: string;
    bio?: string;
    total_posts?: string;
    total_followers?: string;
    total_following?: string;
    profile_url?: string;
    location?: string;
    total_likes?: string;
}
export interface SocialImage {
    image_url: string;
    thumbnail: string;
    title: string;
    source: string;
    source_url?: string;
}
export interface SocialPostComment {
    sender_name?: string;
    date?: string;
    likes?: string;
    text: string;
}
export interface SocialPostHateSpeech {
    is_hate_speech: boolean;
    label: string;
    confidence: number;
    explanation?: string | null;
    model?: string;
}
export interface SocialPost {
    hash_id?: string;
    post_url: string;
    datetime: string;
    caption: string;
    author?: string;
    source?: string;
    likes: string;
    comments: string;
    collected_comments_count?: string;
    comment_items?: string[];
    comment_details?: SocialPostComment[];
    shares: string;
    views: string;
    media_type: string;
    media_url: string;
    hate_speech?: SocialPostHateSpeech | null;
}
export interface SocialOnlinePresenceResult {
    query: string;
    total_found: number;
    timestamp?: string;
    results: {
        title?: string;
        url?: string;
        snippet?: string;
        timestamp?: string;
    }[];
}
export interface SocialStealerLogRecord {
    [key: string]: any;
}
export interface SocialStoredProfile {
    user_id?: string;
    profile_username: string;
    profiles: PlatformResult[];
    count?: number;
    status?: string;
    updated_at?: string;
}
export interface PlatformResult {
    keyUsername: string;
    platform: string;
    platformKey?: string;
    username: string;
    url: string;
    timestamp?: string;
    isSelected: boolean;
    status?: 'active' | 'suggested' | 'informational';
    resultSource?: SocialResultSource;
    description?: string;
    followers?: number;
    joiningDate?: string;
    email?: string;
    allMetadata: Record<string, any>;
    profileDetails?: ProfileDetails | null;
    posts?: SocialPost[] | null;
    videos?: SocialPost[] | null;
    shorts?: SocialPost[] | null;
    post_connections?: string[] | null;
    images?: SocialImage[] | null;
    followers_list?: string[] | null;
    following_list?: string[] | null;
    onlinePresence?: SocialOnlinePresenceResult | null;
    stealerLogs?: SocialStealerLogRecord[] | null;
}
export type ManagedPlatform = PlatformResult & {
    stableKey: string;
    matches: boolean;
};
export interface ManageProfilesModalData {
    username: string;
    platforms: PlatformResult[];
}
export type ScanEvent = {
    type: 'progress';
    payload: Partial<Job>;
} | {
    type: 'complete';
    payload: PlatformResult[];
};
export interface SocialSidebarState {
    homeMenuSearchTerm: WritableSignal<string>;
    jobs: WritableSignal<Job[]>;
    isHomeMenuCollapsed: WritableSignal<boolean>;
    activeUsername: WritableSignal<string | null>;
}
export interface SocialProfilesState {
    scanResults: WritableSignal<Map<string, PlatformResult[]>>;
}
