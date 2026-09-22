export interface RelatedReportItem {
  id: string;
  title: string;
  summary: string;
  published: string;
  source: string;
  cluster: string;
  reliability: string;
  mappingKey: string;
  mappingValue: string;
  trackId: string;
}

export const STRONG_RELATED_MAPPING_KEYS = new Set<string>([
  'm_alias',
  'm_asns',
  'm_attacker',
  'm_author',
  'm_company_name',
  'm_crypto_address',
  'm_cve',
  'm_cwe',
  'm_domain',
  'm_email',
  'm_enterprise_attack_tactics',
  'm_enterprise_attack_techniques',
  'm_family',
  'm_file_name',
  'm_file_paths',
  'm_hash',
  'm_hashes',
  'm_hashtag',
  'm_imphash',
  'm_ip',
  'm_mac_address',
  'm_md5',
  'm_mention',
  'm_org',
  'm_person',
  'm_phone_number',
  'm_product',
  'm_reporter',
  'm_registry_key_path',
  'm_sha1',
  'm_sha256',
  'm_sha3_384',
  'm_signature',
  'm_social_media_profiles',
  'm_telfhash',
  'm_tlsh',
  'm_uk_nhs',
  'm_username',
  'm_us_driver_license',
  'm_vendor',
  'm_vulnerability',
  'm_xmpp_addresses',
  'm_yara_rule'
]);
