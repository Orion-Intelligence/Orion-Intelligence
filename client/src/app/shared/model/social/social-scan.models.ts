import { WritableSignal } from '@angular/core';
export interface NetworkNode {
    id: string | number;
    label: string;
    relationshipCount?: number;
    shape: string;
    image?: string;
    icon?: {
        face: string;
        code: string;
        size: number;
        color: string;
    };
    size: number;
    font: {
        color: string;
        size?: number;
    };
    color: {
        border: string;
        background: string;
        highlight?: {
            border: string;
            background: string;
        };
        hover?: {
            border: string;
            background: string;
        };
    };
    title?: string;
    shadow?: boolean | {
        enabled: boolean;
        color: string;
        size: number;
        x: number;
        y: number;
    };
    groupedPlatforms?: PlatformResult[];
    borderWidth?: number;
    borderWidthSelected?: number;
    x?: number;
    y?: number;
    physics?: boolean;
}
export interface NetworkData {
    nodes: NetworkNode[];
    edges: any[];
}
export interface Job {
    id: string;
    username: string;
    displayName?: string;
    status: 'in_progress' | 'completed' | 'failed';
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
export interface CustomEntity {
    id: string;
    type:
    | 'wallet'
    | 'email'
    | 'domain'
    | 'email-breach'
    | 'social-scanner'
    | 'wanted-list'
    | 'national-identity'
    | 'playstore-scanner'
    | 'software-scanner'
    | 'domain-scan'
    | 'subdomains-scan'
    | 'dns-scan'
    | 'wayback-scan'
    | 'ioc-extract'
    | 'apk-scan'
    | 'phone'
    | 'crypto-scanner';
    label: string;
    value: string;
    onGraph: boolean;
    status: 'pending' | 'in_progress' | 'added' | 'failed';
    progress?: number;
    step?: string;
    source?: 'manual' | 'api';
    reportData?: Record<string, any> | null;
}
export interface GraphPlatformBatch {
    all: PlatformResult[];
    visibleCount: number;
}
export interface ProfileLeakSessionData {
    breachCards: any[];
    stealerRows: any[];
}
export interface ProfileMetadataSessionData {
    tokens: string[];
    result: {
        query: string;
        total_found: number;
        timestamp?: string;
        results: any[];
    } | null;
}
export interface TabState {
    searchTerm: WritableSignal<string>;
    homeMenuSearchTerm: WritableSignal<string>;
    jobs: WritableSignal<Job[]>;
    networkData: WritableSignal<NetworkData>;
    scanResults: WritableSignal<Map<string, PlatformResult[]>>;
    activeUsernames: WritableSignal<Set<string>>;
    customEntities: WritableSignal<CustomEntity[]>;
    isEditMode: WritableSignal<boolean>;
    isHomeMenuCollapsed: WritableSignal<boolean>;
    isEntityMenuCollapsed: WritableSignal<boolean>;
    activeHomeMenuTab: WritableSignal<'history' | 'entities'>;
    isPhysicsEnabled: WritableSignal<boolean>;
    viewMode: WritableSignal<'graph' | 'list'>;
    expandedGroupDataByUser: WritableSignal<{
        [username: string]: NetworkNode | null;
    }>;
    graphPlatformBatches: WritableSignal<Map<string, GraphPlatformBatch>>;
    profileLeakIntelligenceByUser: WritableSignal<Record<string, ProfileLeakSessionData>>;
    profileMetadataByUser: WritableSignal<Record<string, ProfileMetadataSessionData>>;
}
export type SerializableTabState = {
    [K in keyof TabState]: ReturnType<TabState[K]>;
};
export interface Tab {
    id: string;
    name: string;
    state: TabState;
}
