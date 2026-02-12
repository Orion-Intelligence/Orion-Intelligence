import { WritableSignal } from '@angular/core';

export interface NetworkNode {
  id: string | number;
  label: string;
  shape: string;
  image?: string;
  // FIX: Add optional 'icon' property to support icon shapes in vis-network.
  icon?: {
    face: string;
    code: string;
    size: number;
    color: string;
  };
  size: number;
  font: { color: string; size?: number };
  color: { border: string; background:string; highlight?: { border: string; background: string }, hover?: { border: string; background: string } };
  title?: string;
  shadow?: boolean | { enabled: boolean; color: string; size: number; x: number; y: number; };
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: any[];
}

export interface Job {
  id: string;
  username: string;
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
  description?: string;
  followers?: number;
  joiningDate?: string;
  email?: string;
  allMetadata: Record<string, any>;
  profileDetails?: ProfileDetails | null;
  posts?: SocialPost[] | null;
}

export type ScanEvent =
  | { type: 'progress'; payload: Partial<Job> }
  | { type: 'complete'; payload: PlatformResult[] };

export interface CustomEntity {
  id: string;
  type: 'wallet' | 'email' | 'domain';
  label: string;
  value: string;
  onGraph: boolean;
  status: 'pending' | 'added';
}

export interface TabState {
  searchTerm: WritableSignal<string>;
  homeMenuSearchTerm: WritableSignal<string>;
  jobs: WritableSignal<Job[]>;
  networkData: WritableSignal<NetworkData>;
  scanResults: WritableSignal<Map<string, PlatformResult[]>>;
  activeUsernames: WritableSignal<Set<string>>;
  customEntities: WritableSignal<CustomEntity[]>;
  socialImages: WritableSignal<Map<string, SocialImage[]>>;
  isEditMode: WritableSignal<boolean>;
  isHomeMenuCollapsed: WritableSignal<boolean>;
  isEntityMenuCollapsed: WritableSignal<boolean>;
  activeHomeMenuTab: WritableSignal<'history' | 'entities'>;
  isPhysicsEnabled: WritableSignal<boolean>;
  viewMode: WritableSignal<'graph' | 'list'>;
}

export type SerializableTabState = {
  [K in keyof TabState]: ReturnType<TabState[K]>;
};

export interface Tab {
  id: string;
  name: string;
  state: TabState;
}
