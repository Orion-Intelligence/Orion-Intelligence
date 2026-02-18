
export enum Category {
  STRATEGIC = 'Strategic',
  BREACH = 'Breach',
  DISCUSSION = 'Discussion',
  HOMEPAGE = 'Home',
  DIRECTORY = 'Directory',
  DUMP = 'Dump',
  DEFACEMENT = 'Defacement',
  SOCIAL = 'Social',
  API = 'Api',
  EXPLOIT = 'Exploit',
  FEED = 'Feed',
  CONSOLIDATED = 'Consolidated',
  STEALERLOGS = 'Stealerlogs',
  SCANNER = 'Scanner',
  TENANT = 'Tenant',
  PROFILE = 'Profile',
  SHODAN = 'Shodan'
}

export enum GeneralSubCategory {
  ALL = 'All',
  GENERAL = 'General',
  FORUMS = 'Forums',
  NEWS = 'News',
  STOLEN = 'Stolen',
  DRUGS = 'Drugs',
  HACKING = 'Hacking',
  MARKETPLACES = 'Marketplaces',
  CRYPTOCURRENCY = 'Cryptocurrency',
  LEAKS = 'Leaks'
}

export enum BreachSubCategory {
  ALL = 'All',
  DATABASES = 'Databases',
  TRACKING = 'Tracking'
}

export enum DiscussionSubCategory {
  ALL = 'All',
  war = 'Warfare',
  CLOUD = 'Cloud',
  ddos = 'DDoS',
  exploit = 'Exploit',
  hack = 'Hack',
  credentials_common = 'Credentials Common',
  text = 'Text',
  phishing = 'Phishing',
  cve = 'CVE',
  credential = 'Credential',
  ransomware = 'Ransomware',
  data = 'Data',
  malware = 'Malware',
  xss = 'XSS',
  c2 = 'C2',
  leak = 'Leak',
  rce = 'RCE',
  fraud = 'Fraud',
  infostealer = 'Infostealer',
}

export enum DefacementSubCategory {
  ALL = 'All',
  HACKED = 'Hacked',
  PHISHING = 'Phishing',
  DATABASES = 'Databases',
}

export enum ApiSubCategory {
  EMAIL = 'Email-Breach',
  SOCIAL = 'Social-Scanner',
  CRACKED = 'Playstore-Scanner',
  SOFTWARE = 'Software-Scanner',
  FILE = 'File-Scanner',
}

export enum ShodanSubCategory {
  SEARCH = 'Search'
}


export enum SocialSubCategory {
  ALL = 'All',
  TELEGRAM = 'Telegram',
  TWITTER = 'Twitter',
  MASTODON = 'Mastodon',
  PASTEBIN = 'Pastebin',
  FORUM = 'Forum',
  REDDIT = 'Reddit',
}

export enum ExploitSubCategory {
  ALL = 'All',
  CVE = 'CVE',
  TOOLS = 'Tools',
  ZERODAY = 'ZeroDay',
}

export enum FeedSubCategory {
  NEWS = 'News',
}

export enum ScannerSubCategory {
  BASIC = 'Basic-Scan',
  FULL = 'Port-Scan',
  REPOSITORY = 'Repository-Scan',
  SEO = 'SEO-Scan',
  APK= 'APK-Scan',
}

export enum DumpSubCategory {
  LISTING = 'Listing',
}

export enum StealerlogsSubCategory {
  IOC = 'IOCS'
}
export enum TenantSubCategory {
  VIEW_PROFILE = 'View-Profiles',
  VIEW_TENANT = 'View-Tenants',
  AUDITLOG = 'Auditlog',
}
export enum ProfileSubCategory {
  HOMEPAGE = 'Homepage',
  IOC = 'IOC',
  TENANT_SETTINGS = 'Tenant-Settings',
  ACCOUNT = 'Account',
  USERS = 'Users',
  STATISTICS = 'Statistics',
  AUDITLOG = 'Auditlog',
  TENANT = 'Tenant',
  SYSTEM_SETTINGS = 'System-Settings',
}

export enum ExtractorSubCategory {
  IOC_EXTRACTOR = 'IOC-Extractor',
}
