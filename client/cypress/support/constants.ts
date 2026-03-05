export const TEST_DATA = Cypress.env('TEST_DATA') || {};

export const ENTITY_FILTERS: [string, string][] = [
  ['Phone Numbers', '+923001234567'],
  ['Emails', TEST_DATA.filter_email],
  ['Domains', 'example.com'],
  ['Country', 'Pakistan'],
  ['URLs', 'https://example.com'],
  ['CVE & CWE', 'CVE-2024-1111'],
  ['IP Addresses', '8.8.8.8'],
  ['YARA Rules', 'rule malicious_test'],
  ['Encoded URLs', 'aHR0cHM6Ly9leGFtcGxlLmNvbQ=='],
  ['File Paths', '/var/log/syslog'],
  ['Credit Cards', '4111111111111111'],
];

export const SORT_OPTIONS = ['Newest first', 'Oldest first'];

export const SEARCH_BY_OPTIONS = [
  'Match Semantic',
  'Match any term (OR)',
  'Match indivisual terms (AND)',
  'Match full query (AND)',
];

export const SAFE_SEARCH_OPTIONS = ['Yes', 'No'];
export const NETWORK_OPTIONS = ['All', 'Onion'];
export const CONTENT_TYPES = ['All', 'Breach', 'Credential', 'Ransomware'];

export const FLOW_ADMIN_SECTIONS = ['Homepage', 'Account', 'Users', 'Auditlog', 'Tenant', 'System Settings'];
export const FLOW_GENERAL_INTELLIGENCE_SECTIONS = ['All', 'General', 'Forums', 'News', 'Stolen', 'Drugs', 'Hacking', 'Marketplaces', 'Cryptocurrency', 'Leaks'];
export const FLOW_DATA_BREACH_SECTIONS = ['All', 'Databases', 'Tracking'];
export const FLOW_DEFACEMENT_SECTIONS = ['All', 'Hacked', 'Phishing', 'Databases'];
export const FLOW_SOCIAL_SECTIONS = ['All', 'Telegram', 'Twitter', 'Mastodon', 'Pastebin', 'Forum', 'Reddit'];
export const FLOW_EXPLOIT_SECTIONS = ['All', 'CVE', 'Tools', 'ZeroDay'];
export const FLOW_WEB_SCANS_SECTIONS = ['Basic Scan', 'Port Scan', 'Repository Scan', 'SEO Scan'];
export const FLOW_ENTITY_API_SECTIONS = ['Email Breach', 'Social Scanner', 'Wanted List', 'National Identity', 'Playstore Scanner', 'Software Scanner', 'File Scanner', 'Crypto Scanner'];
export const DOMAIN_SCANNER_TEST_DOMAINS = ['example.com', 'google.com', 'openai.com'];
