import { FilterModel } from '../model/filter/filter.model';
const COMMON_NETWORK = {
  title: "Network Type",
  options: [
    { key: "all", label: "All" },
    { key: "onion", label: "Onion" },
    { key: "i2p", label: "I2P" },
    { key: "clearnet", label: "Clearnet" },
  ],
  type: "dropdown" as const,
  tooltip: "Web Layers",
  selected: "all"
};
const COMMON_THREAT_OPTIONS = [
  { key: "all", label: "All" },
  { key: "breach", label: "Breach" },
  { key: "credential", label: "Credential" },
  { key: "ransomware", label: "Ransomware" },
  { key: "phishing", label: "Phishing" },
  { key: "scam", label: "Scam" },
  { key: "malware", label: "Malware" },
  { key: "infostealer", label: "Infostealer" },
  { key: "c2", label: "C2" },
  { key: "ddos", label: "DDoS" },
  { key: "exploit", label: "Exploit" },
  { key: "leak", label: "Leak" },
  { key: "logs", label: "Logs" },
  { key: "vpn", label: "VPN" },
  { key: "carding", label: "Carding" },
  { key: "rat", label: "RAT" },
  { key: "keylogger", label: "Keylogger" },
  { key: "spyware", label: "Spyware" },
  { key: "sqlinjection", label: "SQL Injection" },
  { key: "xss", label: "XSS" },
  { key: "supplychain", label: "Supply Chain" },
  { key: "insider", label: "Insider" },
  { key: "fraud", label: "Fraud" },
  { key: "obfuscation", label: "Obfuscation" },
  { key: "crack", label: "Crack" },
  { key: "cheats", label: "Cheats" },
  { key: "cve", label: "CVE" },
  { key: "zero_day", label: "Zero Day" },
  { key: "rootkit", label: "Rootkit" },
  { key: "apt", label: "APT" },
  { key: "threat_intel", label: "Threat Intel" },
  { key: "darkweb", label: "Dark Web" },
  { key: "rce", label: "RCE" },
  { key: "lpe", label: "LPE" },
  { key: "exfiltration", label: "Exfiltration" },
  { key: "persistence", label: "Persistence" },
  { key: "reconnaissance", label: "Reconnaissance" },
  { key: "hack", label: "Hack" },
  { key: "news", label: "News" },
  { key: "credentials_common", label: "Credentials (Common)" },
  { key: "war", label: "War" }
];
const BASE_DATERANGE = {
  options: [],
  type: 'daterange' as const,
  selected: ""
};
const DATERANGE_DEFAULT = {
  ...BASE_DATERANGE,
  title: "Date Range",
  tooltip: "Date Range"
};
const DATERANGE_DUMP = {
  ...BASE_DATERANGE,
  title: "Date Range",
  tooltip: "Select Range"
};
const DATERANGE_CREATION = {
  ...BASE_DATERANGE,
  title: "Creation Date Range",
  tooltip: "Creation Date Range"
};
function createThreatContent() {
  return {
    title: "Content Type",
    options: COMMON_THREAT_OPTIONS,
    type: 'dropdown' as const,
    tooltip: "Content Filter",
    selected: "attack-pattern"
  };
}
const SOURCE_FILTER = {
  title: "Source",
  options: [
    { key: "all", label: "All" },
    { key: "telegram", label: "Telegram" },
    { key: "websites", label: "Websites" }
  ],
  type: "dropdown" as const,
  tooltip: "Leak origin sources",
  selected: "all"
};
const STATUS_FILTER = {
  title: "Status",
  options: [
    { key: "all", label: "All" },
    { key: "parsed", label: "True" },
    { key: "unparsed", label: "False" }
  ],
  type: "dropdown" as const,
  tooltip: "Status filter (True/False)",
  selected: "all"
};
const SAFE_FILTER = {
  title: "Safe Search",
  options: [
    { key: "yes", label: "Yes" },
    { key: "no", label: "No" }
  ],
  type: "dropdown" as const,
  tooltip: "Enable Filtering",
  selected: "yes"
};
const INDEX_FILTER = {
  title: "Index Type",
  options: [
    { key: "all", label: "All" },
    { key: "general", label: "General" },
    { key: "leak", label: "Leak" },
    { key: "defacement", label: "Defacement" },
    { key: "chat", label: "Chat" },
    { key: "exploit", label: "Exploit" },
    { key: "twitter", label: "Twitter" },
    { key: "reddit", label: "Reddit" },
  ],
  type: "dropdown" as const,
  tooltip: "",
  selected: "all"
};
const DIRECTORY_CONTENT_TYPE = {
  title: "Content Type",
  options: [
    { key: "all", label: "All" },
    { key: "general", label: "General" },
    { key: "forums", label: "Forums" },
    { key: "news", label: "News" },
    { key: "stolen", label: "Stolen" },
    { key: "drugs", label: "Drugs" },
    { key: "hacking", label: "Hacking" },
    { key: "marketplaces", label: "Marketplaces" },
    { key: "cryptocurrency", label: "Cryptocurrency" },
    { key: "leaks", label: "Leaks" },
    { key: "adult", label: "Adult" },
    { key: "tracking", label: "Tracking" },
    { key: "chat", label: "Chat" },
    { key: "social", label: "Social" }
  ],
  type: "dropdown" as const,
  tooltip: "",
  selected: "all"
};
const PLATFORM_FILTER = {
  title: "Platform",
  options: [
    { key: "generic_model", label: "General Iintelligence" },
    { key: "leak_model", label: "Data Breach" },
    { key: "exploit_model", label: "Exploit" },
    { key: "social_model", label: "Social" },
    { key: "chat_model", label: "Chat" },
    { key: "all", label: "All" },
  ],
  type: "dropdown" as const,
  tooltip: "Platform",
  selected: "all"
};
export const dump_filters: FilterModel = {
  filters: {
    source: SOURCE_FILTER,
    daterange: DATERANGE_DUMP,
    status: STATUS_FILTER
  }
};
export const audit_filters: FilterModel = {
  filters: {
    daterange: DATERANGE_DEFAULT
  }
};
export const stealer_filters: FilterModel = {
  filters: {
    daterange: DATERANGE_DEFAULT
  }
};
export const directory_filters: FilterModel = {
  filters: {
    network: COMMON_NETWORK,
    index: INDEX_FILTER,
    content_type: DIRECTORY_CONTENT_TYPE,
    daterange: DATERANGE_DEFAULT
  }
};
export const general_filters: FilterModel = {
  filters: {
    network: COMMON_NETWORK,
    safe: SAFE_FILTER,
    daterange: DATERANGE_CREATION,
    content: createThreatContent()
  }
};
export const consolidated_filters: FilterModel = {
  filters: {
    network: COMMON_NETWORK,
    daterange: DATERANGE_CREATION,
    content: createThreatContent(),
    platform: PLATFORM_FILTER
  }
};
export const alert_filters: FilterModel = {
  filters: {
    daterange: DATERANGE_DEFAULT,
  }
};
export const filter_mapping: Record<string, string> = {
  source: "Source",
  daterange: "Date Range",
  status: "Status",
  network: "Network Type",
  index: "Index Type",
  content_type: "Content Type",
  safe: "Safe Search",
  content: "Content Type",
  mitre: "Mitre TTP"
};
