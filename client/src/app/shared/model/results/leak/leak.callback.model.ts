import { Suggestion } from '../shared/common-result';
import { initCallbackModel } from '../callback.init';

export class LeakResultItem {
  m_ref_html?: string | null;
  m_password!: string;
  m_title!: string;
  m_url?: string;
  m_base_url?: string;
  m_content!: string;
  m_screenshot!: string;
  m_important_content!: string;
  m_highlighted!: string;
  m_network?: string;
  m_content_type!: string[];
  m_code_snippet!: string[];
  m_weblink!: string[];
  m_dumplink!: string[];
  m_email!: string[];
  m_websites!: string[];
  m_company_name?: string | null;
  m_logo_or_images!: string[];
  m_leak_date?: string | null;
  m_data_size?: string | null;
  m_country_name?: string | null;
  m_revenue?: string | null;
  m_update_date!: string;
  m_hash!: string;
  m_creation_date!: string;

  constructor(init?: Partial<LeakResultItem>) {
    Object.assign(this, init);
  }
}

export class LeakCallbackModel {
  Result: LeakResultItem[] = [];
  Page_Count!: number;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<LeakCallbackModel>) {
    if (init) {
      initCallbackModel(this, init, r => new LeakResultItem(r));
    }
  }
}
