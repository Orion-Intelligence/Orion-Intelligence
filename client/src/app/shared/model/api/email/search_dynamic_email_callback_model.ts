export class CardData {
  m_attacker!: string[];
  m_ref_html!: string;
  m_title!: string;
  m_url!: string;
  m_base_url!: string;
  m_content!: string;
  m_important_content!: string;
  m_network!: string;
  m_content_type!: string[];
  m_weblink!: string[];
  m_dumplink!: string[];
  m_name!: string;
  m_email!: string[];
  m_industry?: string;
  m_websites!: string[];
  m_company_name?: string;
  m_logo_or_images!: string[];
  m_leak_date?: string;
  m_data_size?: string;
  m_country_name?: string;
  m_revenue?: string;
  m_app_name?: string;
  m_app_url?: string;
  m_package_id?: string;
  m_version?: string;
  m_download_link?: string[];
  m_apk_size?: string;
  m_latest_date?: string;
  m_mod_features?: string;

  constructor(init?: Partial<CardData>) {
    Object.assign(this, init);
  }
}

export class SearchDynamicEmailCallbackModel {
  cards_data!: CardData[];
  base_url?: string;
  m_network?: string;

  constructor(init?: Partial<SearchDynamicEmailCallbackModel>) {
    if (init) {
      this.cards_data = init.cards_data?.map(card => new CardData(card)) ?? [];
      this.base_url = init.base_url;
      this.m_network = init.m_network;
    }
  }
}
