import { Suggestion } from '../shared/common-result';

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

  constructor(init?: Partial<SocialResultItem>) {
    Object.assign(this, init);
  }
}

export class SocialCallbackModel {
  Result: SocialResultItem[] = [];
  Suggestions: Suggestion[] = [];
  Page_Count = 0;

  constructor(init?: Partial<SocialCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new SocialResultItem(r)) ?? [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) ?? [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }
}
