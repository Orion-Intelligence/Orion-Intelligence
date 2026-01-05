import {Suggestion} from "../shared/common-result";
import {initCallbackModel} from '../callback.init';
import {ExploitResultItem} from '../exploit/exploit.callback.model';

export class DefacementResultItem {
  q = ""
  m_attacker: string[] = [];
  m_team = "";
  m_web_server: string[] = [];
  m_ioc_type: string[] = [];
  ioc: string[] = [];
  m_base_url = "";
  m_ip: string[] = [];
  m_location = ""
  m_content = ""
  m_leak_date?: string;
  m_source_url: string[] = [];
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
      initCallbackModel(this, init, r => new DefacementResultItem(r));
    }
  }
}
