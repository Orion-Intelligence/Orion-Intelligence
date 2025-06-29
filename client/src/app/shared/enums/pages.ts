export enum Category {
  STRATEGIC = 'Strategic',
  BREACH = 'Breach',
  HOMEPAGE = 'Home',
  DIRECTORY = 'Directory',
  DUMP = 'Dump',
  DEFACEMENT = 'Defacement',
  SOCIAL = 'Social',
  API = 'Api',
  EXPLOIT = 'Exploit'
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
  TRACKING = 'Tracking',
  EMAIL = 'Email',
  Logs = 'Logs',
  WARFARE = 'Warfare',
  CLOUD = 'Cloud',
}

export enum DefacementSubCategory {
  DATABASES = 'Archive',
}

export enum ApiSubCategory {
  EMAIL = 'Email',
}

export enum SocialSubCategory {
  TELEGRAM = 'Telegram',
}

export enum ExploitSubCategory {
  CVE = 'CVE',
  TOOLS = 'Tools',
  ZERODAY = 'ZeroDay',
  Mitre = 'Mitre',
}

export enum DumpSubCategory {
  LISTING = 'Listing',
  CREDENTIAL = 'Credential',
}
