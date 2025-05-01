import {Suggestion} from '../shared/common-result';

export class ChatResultItem {
  m_content: string = "";
  m_message_date?: string;
  m_message_id?: string;
  m_message_sharable_link?: string;
  m_channel_id?: string;
  m_views?: string;
  m_file_name: string[] = [];
  m_file_size?: string;
  m_forwarded_from?: string;
  m_sender_name?: string;
  m_sender_username?: string;
  m_message_type?: string;
  m_media_url?: string;
  m_media_caption?: string;
  m_reply_to_message_id?: string;
  m_message_status?: string;
  m_file_saved_as?: string;
  m_file_path?: string;
  m_hash?: string;
  m_channel_name?: string;
  m_weblink: string[] = [];

  constructor(init?: Partial<ChatResultItem>) {
    Object.assign(this, init);
  }
}

export class ChatCallbackModel {
  Result: ChatResultItem[] = [];
  Suggestions: Suggestion[] = [];
  Page_Count: number = 0;

  constructor(init?: Partial<ChatCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new ChatResultItem(r)) || [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) || [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }

  static fromJSON(json: string): ChatCallbackModel {
    const data = JSON.parse(json);
    return new ChatCallbackModel(data);
  }
}
