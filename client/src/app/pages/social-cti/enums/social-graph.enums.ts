export type FetchTabKey = 'details' | 'posts' | 'videos' | 'shorts' | 'reels' | 'images' | 'connections' | 'followers' | 'following' | 'friends' | 'onlinePresence' | 'stealerLogs';
export type PostContentTabKey = Extract<FetchTabKey, 'posts' | 'videos' | 'shorts'>;
export type FetchMergeMode = 'prepend' | 'update';
export type SocialPlatformCapabilityKey = FetchTabKey | 'comments';
export type FetchStateKey = 'profile' | 'posts' | 'videos' | 'shorts' | 'reels' | 'platformImages' | 'followers' | 'following' | 'friends' | 'onlinePresence' | 'stealerLogs';
export type SocialResultSource = 'normal' | 'darkweb';
