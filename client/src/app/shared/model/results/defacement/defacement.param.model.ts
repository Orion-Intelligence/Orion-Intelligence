import {Suggestion} from "../shared/common-result";

export class DefacementResultItem {
  q = ""
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

  constructor(init?: Partial<DefacementResultItem>) {
    Object.assign(this, init);
  }
}

export class DefacementCallbackModel {
  Result: DefacementResultItem[] = [];
  Page_Count = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<DefacementCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new DefacementResultItem(r)) ?? [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) ?? [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }
}
