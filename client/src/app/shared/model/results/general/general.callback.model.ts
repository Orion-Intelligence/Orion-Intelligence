import { Suggestion } from '../shared/common-result';
import { initCallbackModel } from '../callback.init';
export class GeneralResultItem {
  m_title!: string;
  m_url?: string;
  m_base_url?: string;
  m_content!: string;
  m_screenshot!: string;
  m_ref_html?: string | null;
  m_important_content!: string;
  m_highlighted!: string;
  m_network?: string;
  m_meta_description?: string;
  m_content_type!: string[];
  m_section!: string[];
  m_clearnet_links!: string[];
  m_weblink!: string[];
  m_leak_date?: string | null;
  m_dumplink!: string[];
  m_update_date!: string;
  m_hash!: string;
  m_creation_date!: string;

  constructor(init?: Partial<GeneralResultItem>) {
    this.m_title = '';
    this.m_content = '';
    this.m_screenshot = '';
    this.m_important_content = '';
    this.m_highlighted = '';
    this.m_content_type = [];
    this.m_section = [];
    this.m_clearnet_links = [];
    this.m_weblink = [];
    this.m_dumplink = [];
    this.m_update_date = new Date().toISOString();
    this.m_hash = '';
    this.m_creation_date = new Date().toISOString();
    Object.assign(this, init);
  }
}
export class GeneralCallbackModel {
  Result!: GeneralResultItem[];
  Suggestions!: Suggestion[];
  Page_Count!: number;

  constructor(init?: Partial<GeneralCallbackModel>) {
    this.Result = [];
    this.Suggestions = [];
    this.Page_Count = 0;
    if (init) {
      initCallbackModel(this, init, r => new GeneralResultItem(r));
    }
  }
}
