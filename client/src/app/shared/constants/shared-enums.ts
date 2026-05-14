export const LANGUAGE_MAP: Record<string, {
    iso1: string;
    name: string;
}> = {
  eng: { iso1: 'en', name: 'English' },
  fra: { iso1: 'fr', name: 'French' },
  spa: { iso1: 'es', name: 'Spanish' },
  deu: { iso1: 'de', name: 'German' },
  ita: { iso1: 'it', name: 'Italian' },
  por: { iso1: 'pt', name: 'Portuguese' },
  rus: { iso1: 'ru', name: 'Russian' },
  zho: { iso1: 'zh', name: 'Chinese' },
  jpn: { iso1: 'ja', name: 'Japanese' },
  kor: { iso1: 'ko', name: 'Korean' },
  ara: { iso1: 'ar', name: 'Arabic' },
  hin: { iso1: 'hi', name: 'Hindi' },
  ben: { iso1: 'bn', name: 'Bengali' },
  tur: { iso1: 'tr', name: 'Turkish' },
  nld: { iso1: 'nl', name: 'Dutch' },
  swe: { iso1: 'sv', name: 'Swedish' },
  pol: { iso1: 'pl', name: 'Polish' },
  ces: { iso1: 'cs', name: 'Czech' }
};
export enum SortType {
    DEFAULT = 'Default',
    NEWEST_FIRST = 'Newest first',
    OLDEST_FIRST = 'Oldest first'
}
export enum GraphType {
    Cluster = 'cluster',
    Document = 'document',
    Property = 'property'
}
export enum GraphClusterType {
    All = 'all',
    General = 'general',
    Leak = 'leak',
    Defacement = 'defacement',
    Chat = 'chat',
    Exploit = 'exploit'
}
export enum AiWorkspacePrompt {
    SUMMARY_BRIEF = 'Summarize current findings into a short analyst brief.',
    PRIORITY_INDICATORS = 'List the highest priority indicators to review next.',
    COLLECTION_PLAN = 'Turn this query into a focused collection plan.',
    TRIAGE_NOTE = 'Draft a triage note for suspicious activity.'
}
export const sidebarItemTooltips: Record<string, string> = {
  'All': 'Comprehensive Overview',
  'General': 'Broad Data Pool',
  'Forums': 'Forum Intelligence',
  'News': 'Trending Alerts',
  'Stolen': 'Stolen Info Logs',
  'Drugs': 'Narcotics Tracker',
  'Hacking': 'Hacking Insights',
  'Phishing': 'Phishing Records',
  'Marketplaces': 'Trade Monitoring',
  'Cryptocurrency': 'Crypto Transactions',
  'Leaks': 'Data Leaks',
  'Hacked': 'Hack Records',
  'Databases': 'Breach Records',
  'Tracking': 'Breach Tracker',
  'CVE': 'CVE',
  'Mitre': 'Mitre',
  'Listing': 'Listing',
  'Credential': 'Credential',
  'Email': 'Email',
  'Telegram': 'telegram',
  'Archive': 'archive',
  'Logs': 'Logs',
  'Warfare': 'Warfare',
  'Cloud': 'Cloud',
  'Tools': 'Tools',
  'ZeroDay': 'Zero Day',
  'Twitter': 'Twitter',
  'Mastodon': 'Mastodon',
  'Pastebin': 'Pastebin',
  'Forum': 'Forum',
  'Reddit': 'Reddit',
  'Facebook': 'Facebook',
  'Instagram': 'Instagram',
  'TikTok': 'TikTok',
  'YouTube': 'YouTube',
  'Social': 'Social',
  'Wanted-List': 'Wanted List',
  'Cracked': 'Cracked',
  'View': 'View',
  'Auditlog': 'Audit Logs',
  'Basic-Scan': 'Basic Scan',
  'Port-Scan': 'Port Scan',
  'Repository-Scan': 'Repository Scan',
  'SEO-Scan': 'SEO Scan',
  'APK-Scan': 'APK Scan',
  'File-Scanner': 'File Scanner',
  'Text-Analysis': 'Text Analysis',
  'Crypto-Scanner': 'Crypto Scanner',
  'IOCS': 'IOCs',
  'Feeder': 'Feeder Scripts',
};
export const ALLOWED_CONSOLIDATED_RANKED_SINGLETON: Set<string> = new Set<string>([
  "tools",
  "zeroday"
]);
export const search_filter_labels: Record<string, string> = {};
export const license_rules: Record<string, any> = {};
