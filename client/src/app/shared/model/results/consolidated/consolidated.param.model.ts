export class ConsolidatedParamModel {
  q = "";
  mSearchParamPage = 1;
  mSearchParamType = "all";
  mNetwork = "all";
  mDateRange = "";
  mContentType = "";
  mEntity = "";

  m_attacker: string[] = [];
  m_team = "";
  m_web_server: string[] = [];
  m_base_url = "";
  m_ip: string[] = [];
  m_location = ""
  m_date_of_leak?: string;
  m_web_url: string[] = [];
  m_hash = "";
  m_screenshot?: string;
  m_url = "";
}
