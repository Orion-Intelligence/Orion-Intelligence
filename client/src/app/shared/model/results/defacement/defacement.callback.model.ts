import { initCallbackModel } from '../callback.init';
export class DefacementResultItem {
  q!: string;
  m_attacker!: string[];
  m_team!: string;
  m_web_server!: string[];
  m_ioc_type!: string[];
  ioc!: string[];
  m_base_url!: string;
  m_ip!: string[];
  m_location!: string;
  m_content!: string;
  m_leak_date?: string;
  m_source_url!: string[];
  m_hash!: string;
  m_screenshot?: string;
  m_url!: string;

  constructor(init?: Partial<DefacementResultItem>) {
    Object.assign(this, init);
  }
}
export class DefacementCallbackModel {
  Result: DefacementResultItem[] = [];
  Page_Count!: number;

  constructor(init?: Partial<DefacementCallbackModel>) {
    if (init) {
      initCallbackModel(this, init, r => new DefacementResultItem(r));
    }
  }
}
