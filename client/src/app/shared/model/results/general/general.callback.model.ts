import {Suggestion} from '../shared/common-result';

export class GeneralResultItem {
  m_title: string = "";
  m_url?: string;
  m_base_url?: string;
  m_content: string = "";
  m_screenshot = ""
  m_ref_html?: string | null;
  m_important_content: string = "";
  m_highlighted: string = "";
  m_network?: string;
  m_meta_description?: string;
  m_images: string[] = [];
  m_sub_url: string[] = [];
  m_document: string[] = [];
  m_video: string[] = [];
  m_archive_url: string[] = [];
  m_validity_score: number = 0;
  m_meta_keywords?: string;
  m_content_type: string[] = [];
  m_section: string[] = [];
  m_names: string[] = [];
  m_emails: string[] = [];
  m_phone_numbers: string[] = [];
  m_clearnet_links: string[] = [];
  m_weblink: string[] = [];
  m_leak_date?: string | null;
  m_dumplink: string[] = [];
  m_contact_link?: string;
  m_update_date: string = new Date().toISOString();
  m_hash: string = "";
  m_hash_content?: string;
  m_hash_url?: string;
  m_creation_date: string = new Date().toISOString();

  constructor(init?: Partial<GeneralResultItem>) {
    Object.assign(this, init);
  }
}

export class GeneralCallbackModel {
  Result: GeneralResultItem[] = [];
  Suggestions: Suggestion[] = [];
  Page_Count: number = 0;

  constructor(init?: Partial<GeneralCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new GeneralResultItem(r)) || [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) || [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }

  static fromJSON(json: string): GeneralCallbackModel {
    const data = JSON.parse(json);
    return new GeneralCallbackModel(data);
  }
}
