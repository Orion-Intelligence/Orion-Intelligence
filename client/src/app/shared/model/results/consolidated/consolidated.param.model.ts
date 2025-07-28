export class ConsolidatedParamModel {
  q = "";
  page = 1;
  content = "";
  cat_type = "";
  daterange = "";
  entity = "";
  mitre = "";
  category = "all";
  safe = false;
  network = "all";
  team = "";
  attacker: string[] = [];
  platform = "";





  m_web_server: string[] = [];
  m_base_url = "";
  m_ip: string[] = [];
  m_location = "";
  m_date_of_leak?: string;
  m_web_url: string[] = [];
  m_hash = "";
  m_screenshot?: string;
  m_url = "";
  email?: string;
  username?: string;
  mURL = "";
  mUser = "";
  mFullSearch = false;

  reset(): void {
    this.q = "";
    this.page = 1;
    this.category = "all";
    this.network = "all";
    this.daterange = "";
    this.content = "";
    this.entity = "";
    this.mitre = "";
    this.cat_type = "";
    this.team = "";
    this.attacker = [];
    this.team = "";
    this.m_web_server = [];
    this.m_base_url = "";
    this.m_ip = [];
    this.m_location = "";
    this.m_date_of_leak = undefined;
    this.m_web_url = [];
    this.m_hash = "";
    this.safe = false;
    this.m_screenshot = undefined;
    this.m_url = "";
    this.email = undefined;
    this.username = undefined;
    this.platform = "";
    this.mURL = "";
    this.mUser = "";
    this.mFullSearch = false;
  }
}
