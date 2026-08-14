export type FetchTabKey = 'details' | 'posts' | 'videos' | 'shorts' | 'images' | 'connections' | 'followers' | 'following' | 'onlinePresence' | 'stealerLogs';
export type PostContentTabKey = Extract<FetchTabKey, 'posts' | 'videos' | 'shorts'>;
export type FetchMergeMode = 'prepend' | 'update';
export type SocialPlatformCapabilityKey = FetchTabKey | 'comments';
export type FetchStateKey = 'profile' | 'posts' | 'videos' | 'shorts' | 'platformImages' | 'followers' | 'following' | 'onlinePresence' | 'stealerLogs';
export type SocialResultSource = 'normal' | 'darkweb';
