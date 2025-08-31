// noinspection JSUnusedGlobalSymbols

export enum Category {
  STRATEGIC = 'Strategic',
  BREACH = 'Breach',
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
  ALL = 'All',
  HACKED = 'Hacked',
  PHISHING = 'Phishing',
  DATABASES = 'Databases',
}

export enum ApiSubCategory {
  EMAIL = 'Email',
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
export enum DumpSubCategory {
  LISTING = 'Listing',
}

export enum StealerlogsSubCategory {
  CREDENTIAL = 'Credential',
}
