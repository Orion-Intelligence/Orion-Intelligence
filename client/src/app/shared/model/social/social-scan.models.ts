import { WritableSignal } from '@angular/core';
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
}
export interface SocialPost {
    post_url: string;
    datetime: string;
    caption: string;
    likes: string;
    comments: string;
    shares: string;
    views: string;
    media_type: string;
    media_url: string;
}
export interface PlatformResult {
    keyUsername: string;
    platform: string;
    username: string;
    url: string;
    timestamp?: string;
    isSelected: boolean;
    status?: 'active' | 'suggested' | 'informational';
    description?: string;
    followers?: number;
    joiningDate?: string;
    email?: string;
    allMetadata: Record<string, any>;
    profileDetails?: ProfileDetails | null;
    posts?: SocialPost[] | null;
    post_connections?: string[] | null;
    images?: SocialImage[] | null;
    followers_list?: string[] | null;
    following_list?: string[] | null;
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
export interface TabState {
    homeMenuSearchTerm: WritableSignal<string>;
    jobs: WritableSignal<Job[]>;
    scanResults: WritableSignal<Map<string, PlatformResult[]>>;
    isHomeMenuCollapsed: WritableSignal<boolean>;
}
export type SerializableTabState = {
    [K in keyof TabState]: ReturnType<TabState[K]>;
};
export interface Tab {
    id: string;
    name: string;
    state: TabState;
}
