import { FilterModel } from '../model/filter/filter.model';


export const dump_filters: FilterModel = {
  filters: {
    source: {
      title: "Source",
      options: ["all", "telegram", "websites"],
      type: "dropdown",
      tooltip: "Leak origin sources"
    }
  }
};

export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet", "telegram"],
      type: "dropdown",
      tooltip: "Web Layers"
    },
    index: {
      title: "Index Type",
      options: ["all", "general", "leak", "defacement"],
      type: "dropdown",
      tooltip: ""
    },
    content_type: {
      title: "Content Type",
      options: [
        "all",
        "general",
        "forums",
        "news",
        "stolen",
        "drugs",
        "hacking",
        "marketplaces",
        "cryptocurrency",
        "leaks",
        "adult",
        "chat"
      ],
      type: "dropdown",
      tooltip: ""
    },
  },
};

export const general_filters: FilterModel = {
  filters: {
    mNetwork: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet"],
      type: "dropdown",
      tooltip: "Web Layers"
    },
    mSearchParamSafeSearch: {
      title: "Safe Search",
      options: ["yes", "no"],
      type: "dropdown",
      tooltip: "Enable Filtering"
    },
    mDateRange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range"
    },
    mContentType: {
      title: "Content Type",
      options: ["all", "forums", "leaks", "marketplaces", "cryptocurrency", "general"],
      type: 'dropdown',
      tooltip: "Content Filter"
    },
    mEntity: {
      title: "Entity Type",
      options: ["AU_ABN", "AU_ACN", "AU_TFN", "IN_PAN", "NRP", "UK_NHS", "US_SSN"],
      type: 'multiSelection',
      tooltip: "Entity Filter"
    },
  },
};

export const chat_filters: FilterModel = {
  filters: {
    content_type: {
      title: "Content Type",
      options: [
        "all",
        "data",
        "credential",
        "ransomware",
        "phishing",
        "scam",
        "malware",
        "infostealer",
        "c2",
        "ddos",
        "exploit",
        "leak",
        "logs",
        "vpn",
        "carding",
        "rat",
        "keylogger",
        "spyware",
        "sqlinjection",
        "xss",
        "supplychain",
        "insider",
        "fraud",
        "obfuscation",
        "crack",
        "cheats",
        "cve",
        "zero_day",
        "rootkit",
        "apt",
        "threat_intel",
        "darkweb",
        "rce",
        "lpe",
        "exfiltration",
        "persistence",
        "reconnaissance",
        "hack",
        "news",
        "credentials_common",
        "war"
      ],
      type: "dropdown",
      tooltip: ""
    }
  }
};
