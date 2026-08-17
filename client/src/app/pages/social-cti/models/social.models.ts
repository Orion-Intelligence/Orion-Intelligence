export interface social_scan_status {
    status?: string;
    progress: number;
    step?: string;
    cancel_requested: boolean;
}

export interface social_meta {
    platform: string;
    username: string;
    url: string;
    target_type?: string;
    entity_type?: string;
    status?: 'active' | 'suggested' | 'informational';
    timestamp?: string;
    description?: string;
    avatar?: string;
}

export interface social_profile_details {
    real_name?: string;
    bio?: string;
    description?: string;
    location?: string;
    profile_url?: string;
    total_posts?: string;
    total_followers?: string;
    total_following?: string;
    total_likes?: string;
    avatar?: string;
    banner?: string;
}

export interface social_post_comment {
    sender_name?: string;
    date?: string;
    likes?: string;
    text: string;
}

export interface social_post_hate_speech {
    is_hate_speech: boolean;
    label?: string;
    confidence: number;
    explanation?: string | null;
    model?: string;
}

export interface social_post {
    post_url?: string;
    datetime?: string;
    caption?: string;
    author?: string;
    likes?: string;
    comments?: string;
    shares?: string;
    views?: string;
    media_type?: string;
    media_url?: string;
    comment_details?: social_post_comment[];
    hate_speech?: social_post_hate_speech | null;
    hash_id?: string;
    comment_items?: string[];
}

export interface social_online_presence_hit {
    title?: string;
    url?: string;
    snippet?: string;
    timestamp?: string;
}

export interface social_stealer_log {
    email?: string;
    username?: string;
    user?: string;
    login?: string;
    credential?: string;
    domain?: string;
    source_domain?: string;
    ip?: string;
    host?: string;
    url?: string;
    date?: string;
    timestamp?: string;
    created_at?: string;
    updated_at?: string;
    raw?: string;
    [key: string]: any;
}

export interface social_wanted {
    name?: string;
    caption?: string;
    entity?: string;
    id?: string;
    schema?: string;
    status?: string;
    authority?: string;
    program?: string;
    topics?: string;
    datasets?: string;
    description?: string;
    summary?: string;
    notes?: string;
    source_url?: string;
    [key: string]: any;
}

export interface social_profile {
    meta: social_meta;
    profile_details?: social_profile_details | null;
    posts?: social_post[] | null;
    online_presence?: social_online_presence_hit[] | null;
    stealer_logs?: social_stealer_log[] | null;
    wanted?: social_wanted[] | null;
}

export interface db_social_model {
    user_id: string;
    profile_username?: string;
    profiles: social_profile[];
    selected?: string[];
    scan: social_scan_status;
    updated_at?: string | null;
}

export interface Job {
    id: string;
    status: 'queued' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    step: string;
}

