import {Suggestion} from '../shared/common-result';
import {initCallbackModel} from '../callback.init';

export class SocialResultItem {
  m_content?: string;
  m_platform?: string;
  m_title?: string;
  m_summary: string[] = [];
  m_message_id?: string;
  m_message_sharable_link?: string;
  m_weblink: string[] = [];
  m_content_type?: string[];
  m_hash?: string;
  m_views?: string;
  m_channel_name?: string;
  m_channel_url?: string;
  m_sender_name?: string;
  m_sender_username?: string;
  m_message_date?: string;
  m_network?: string;
  m_post_likes?: string;
  m_post_shares?: string;
  m_post_comments_count?: string;
  m_post_tags: string[] = [];
  m_post_views?: string;
  m_post_expiry?: string;
  m_comment_count?: string;
  m_likes?: string;
  m_retweets?: string;
  m_commenters: string[] = [];

  constructor(init?: Partial<SocialResultItem>) {
    Object.assign(this, init);
  }
}

export class SocialCallbackModel {
  Result: SocialResultItem[] = [];
  Suggestions: Suggestion[] = [];
  Page_Count = 0;

  constructor(init?: Partial<SocialCallbackModel>) {
    initCallbackModel(this, init, r => new SocialResultItem(r));
  }
}
