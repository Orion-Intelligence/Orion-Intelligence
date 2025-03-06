export class SuggestionOption {
  text: string = "";
  score: number = 0;
  freq: number = 0;

  constructor(init?: Partial<SuggestionOption>) {
    Object.assign(this, init);
  }
}

export class Suggestion {
  text: string = "";
  offset: number = 0;
  length: number = 0;
  options: SuggestionOption[] = [];

  constructor(init?: Partial<Suggestion>) {
    if (init) {
      this.text = init.text || "";
      this.offset = init.offset || 0;
      this.length = init.length || 0;
      this.options = init.options?.map(opt => new SuggestionOption(opt)) || [];
    }
  }
}

export class ResultItem {
  m_title: string = "";
  m_url?: string;
  m_base_url?: string;
  m_content: string = "";
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

  constructor(init?: Partial<ResultItem>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}

export class SearchLeakCallbackModel {
  Result: ResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<SearchLeakCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new ResultItem(r)) || [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) || [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
