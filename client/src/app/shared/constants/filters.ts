import { FilterModel } from '../model/filter/filter.model';

export const dump_filters: FilterModel = {
  filters: {
    source: {
      title: "Source",
      options: ["all", "telegram", "websites"],
      type: "dropdown",
      tooltip: "Leak origin sources",
      selected: "all"
    },
    mDateRange: {
      title: "Date Range",
      options: [],
      type: "daterange",
      tooltip: "Select Range",
      selected: ""
    }
  }
};

export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet", "telegram"],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    index: {
      title: "Index Type",
      options: ["all", "general", "leak", "defacement"],
      type: "dropdown",
      tooltip: "",
      selected: "all"
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
      tooltip: "",
      selected: "all"
    },
    mDateRange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range",
      selected: ""
    }
  }
};

export const general_filters: FilterModel = {
  filters: {
    mNetwork: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet"],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    mSearchParamSafeSearch: {
      title: "Safe Search",
      options: ["yes", "no"],
      type: "dropdown",
      tooltip: "Enable Filtering",
      selected: "yes"
    },
    mDateRange: {
      title: "Creation Date",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date",
      selected: ""
    },
    mContentType: {
      title: "Mitre TTP",
      options: ["attack-pattern", "campaign", "course-of-action", "identity", "intrusion-set", "malware", "marking-definition", "relationship", "tool", "x-mitre-collection", "x-mitre-data-component", "x-mitre-data-source", "x-mitre-matrix", "x-mitre-tactic"],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
    mEntity: {
      title: "Entity Type",
      options: ["EMAILS","HASHES","IOCS","IPS","IPV4S","IPV6S","MD5_HASHES","SHA1_HASHES","SHA256_HASHES","SHA512_HASHES","TELEPHONE_NUMS","UNENCODED_URLS","URLS","EMAIL_ADDRESSES_COMPLETE","EMAIL_ADDRESSES","DOMAINS","SHA512S","SHA256S","SHA1S","MD5S","SSDEEPS","CVES","BITCOIN_ADDRESSES","MAC_ADDRESSES","API_KEY","AWS_SECRET","AZURE_RESOURCE_ID","REGISTRY_KEY","FILE_PATH","YARA_RULE","PHONE_NUMBER","COUNTRY","ORG","GPE","NORP","PRODUCT","PERSON","LOC","LAW","CREDIT_CARD","IBAN_CODE","IN_AADHAAR","AU_ABN","AU_TFN","IN_VEHICLE_REGISTRATION","IP_ADDRESS","IN_PAN","LOCATION","NRP","SG_NRIC_FIN","US_ITIN","IN_VOTER","US_DRIVER_LICENSE","URL","US_SSN","US_PASSPORT","IN_PASSPORT","US_BANK_NUMBER","USERNAME","PASSWORD","HASHTAG","MENTION","MITRE_TTP_TYPE"],
      type: 'multiSelection',
      tooltip: "Entity Filter",
      selected: []
    }
  }
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
      tooltip: "",
      selected: "all"
    }
  }
};

export const defacement_filters: FilterModel = {
  filters: {
    mDateRange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range",
      selected: ""
    },
    mAttacker: {
      title: "Attacker Type",
      options: [],
      type: 'text',
      tooltip: "Content Filter",
      selected: ""
    },
    mTeam: {
      title: "Team Type",
      options: [],
      type: 'text',
      tooltip: "Entity Filter",
      selected: ""
    }
  }
};
