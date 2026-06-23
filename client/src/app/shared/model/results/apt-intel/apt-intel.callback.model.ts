export interface AptIntelResultItem {
  _id?: string;
  m_hash?: string;
  m_title?: string;
  m_content?: string;
  m_important_content?: string;
  m_date?: string;
  m_update_date?: string;
  m_first_seen?: string;
  m_last_seen?: string;
  m_creation_date?: string;
  m_source_url?: string;
  m_base_url?: string;
  m_url?: string;
  m_platform?: string;
  m_country?: string;
  m_origin_country?: string;
  m_team?: string;
  m_attacker?: string | string[];
  m_ioc_type?: string | string[];
  m_ip?: string | string[];
  m_web_server?: string | string[];
  m_family?: string;
  m_aliases?: string[];
  m_references?: string[];
  m_sha256_hash?: string;
  m_sha1_hash?: string;
  m_md5_hash?: string;
  m_file_name?: string;
  m_file_size?: number;
  m_file_type?: string;
  m_file_type_mime?: string;
  m_signature?: string;
  m_reporter?: string;
  m_tags?: string[];
  rank_index?: string;
}

export interface AptIntelSummary {
  total: number;
  actorCount: number;
  malwareCount: number;
  latestSeen: string | null;
  referenceCount: number;
}

export interface AptIntelRecord {
  item: AptIntelResultItem;
  title: string;
  sourceLabel: string;
  date: string | null;
}

export interface AptIntelGroup {
  key: string;
  title: string;
  subtitle: string;
  sourceTypes: string[];
  records: AptIntelRecord[];
  latestSeen: string | null;
  referenceCount: number;
  artifactCount: number;
  tags: string[];
}
