#!/bin/bash

ELASTIC_URL="http://localhost:9400"
INDEX_NAME="_all"
OUTPUT_FILE="filter.json"

search_filter_keys=(
  'm_currencies', 'm_crypto_address', 'm_xmpp_addresses', 'm_hashes', 'm_enterprise_attack_tactics', 'm_enterprise_attack_techniques', 'm_mac_addresses', 'm_asns', 'm_attacker', 'm_au_abn', 'm_au_acn', 'm_au_tfn', 'm_company_name', 'm_country', 'm_platform', 'm_credit_card', 'm_cve', 'm_cwe', 'm_document_id', 'm_email', 'm_encoded_urls', 'm_file_paths', 'm_hashtag', 'm_author', 'm_industry', 'm_ip', 'm_language', 'm_location', 'm_mention', 'm_mitre_ttp_name', 'm_mitre_ttp_type', 'm_org', m_person, m_phone_number, m_social_media_profiles, m_team, m_url, m_us_bank_number, m_us_driver_license, m_us_itin, m_us_passport, m_us_ssn, m_user_agents, m_username, m_yara_rule, m_domain
)

declare -A result

for key in "${search_filter_keys[@]}"; do
  response=$(curl -s -X POST "$ELASTIC_URL/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d @- <<EOF
{
  "size": 0,
  "aggs": {
    "unique_values": {
      "terms": {
        "field": "$key",
        "size": 10000
      }
    }
  }
}
EOF
)

  filtered_values=$(echo "$response" | jq -r '[.aggregations.unique_values.buckets[].key] | unique | map(select(length < 30 and test("^[\\u0000-\\u007F]+$")))')

  if [ "$filtered_values" != "null" ]; then
    result["$key"]="$filtered_values"
  else
    result["$key"]="[]"
  fi
done

{
  echo "{"
  for key in "${!result[@]}"; do
    echo "  \"$key\": ${result[$key]},"
  done | sed '$s/,$//'
  echo "}"
} > "$OUTPUT_FILE"

echo "filter.json generated with unique ASCII values less than 30 characters."
