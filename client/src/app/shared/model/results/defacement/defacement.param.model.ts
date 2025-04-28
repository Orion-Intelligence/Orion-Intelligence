import { Suggestion } from "../shared/common-result";

export class DefacementResultItem {
  q: string = ""
  m_attacker: string[] = [];
  m_team: string = "";
  m_web_server: string[] = [];
  m_base_url: string = "";
  m_ip: string[] = [];
  m_location_info = ""
  m_date_of_leak?: string;
  m_web_url: string[] = [];
  m_hash: string = "";
  m_screenshot?: string;
  m_mirror_links: string[] = [];
  m_url: string = "";

  constructor(init?: Partial<DefacementResultItem>) {
    Object.assign(this, init);
  }
}

export class DefacementCallbackModel {
  Result: DefacementResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<DefacementCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new DefacementResultItem(r)) || [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) || [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }

  static fromJSON(json: string): DefacementCallbackModel {
    const data = JSON.parse(json);
    return new DefacementCallbackModel(data);
  }
}
