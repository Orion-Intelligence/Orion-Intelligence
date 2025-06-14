export class CardData {
  m_crypto_addresses: string[] = [];
  m_attacker: string[] = [];
  m_ref_html = "";
  m_title = "";
  m_url = "";
  m_base_url = "";
  m_content = "";
  m_important_content = "";
  m_network = "";
  m_content_type: string[] = [];
  m_weblink: string[] = [];
  m_dumplink: string[] = [];
  m_name = "";
  m_email: string[] = [];
  m_industry?: string;
  m_phone_numbers: string[] = [];
  m_social_media_profiles: string[] = [];
  m_websites: string[] = [];
  m_company_name?: string;
  m_logo_or_images: string[] = [];
  m_leak_date?: string;
  m_data_size?: string;
  m_country_name?: string;
  m_revenue?: string;

  constructor(init?: Partial<CardData>) {
    Object.assign(this, init);
  }
}

export class SearchDynamicEmailCallbackModel {
  cards_data: CardData[] = [];
  base_url?: string;
  m_network?: string;

  constructor(init?: Partial<SearchDynamicEmailCallbackModel>) {
    if (init) {
      this.cards_data = init.cards_data?.map(card => new CardData(card)) || [];
      this.base_url = init.base_url;
      this.m_network = init.m_network;
    }
  }
}
