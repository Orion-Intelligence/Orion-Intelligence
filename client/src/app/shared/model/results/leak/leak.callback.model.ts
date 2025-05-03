import {Suggestion} from '../shared/common-result';

export class LeakResultItem {
  m_crypto_addresses: string[] = [];
  m_ref_html?: string | null;
  m_password: string = "";
  m_title: string = "";
  m_url?: string;
  m_base_url?: string;
  m_content: string = "";
  m_screenshot: string = "";
  m_important_content: string = "";
  m_network?: string;
  m_content_type: string[] = [];
  m_weblink: string[] = [];
  m_dumplink: string[] = [];
  m_email_addresses: string[] = [];
  m_phone_numbers: string[] = [];
  m_social_media_profiles: string[] = [];
  m_websites: string[] = [];
  m_company_name?: string | null;
  m_logo_or_images: string[] = [];
  m_leak_date?: string | null;
  m_data_size?: string | null;
  m_country_name?: string | null;
  m_revenue?: string | null;
  m_update_date: string = new Date().toISOString();
  m_hash: string = "";
  m_creation_date: string = new Date().toISOString();
  m_contact_link?: string;

  constructor(init?: Partial<LeakResultItem>) {
    Object.assign(this, init);
  }
}

export class LeakCallbackModel {
  Result: LeakResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<LeakCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new LeakResultItem(r)) || [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) || [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }

  static fromJSON(json: string): LeakCallbackModel {
    const data = JSON.parse(json);
    return new LeakCallbackModel(data);
  }
}
