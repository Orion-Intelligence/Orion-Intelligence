import { FilterModel } from '../model/filter/filter.model';

export const dump_filters: FilterModel = {
  filters: {
    source: {
      title: "Source",
      options: [
        { key: "all", label: "All" },
        { key: "telegram", label: "Telegram" },
        { key: "websites", label: "Websites" }
      ],
      type: "dropdown",
      tooltip: "Leak origin sources",
      selected: "all"
    },
    daterange: {
      title: "Date Range",
      options: [],
      type: "daterange",
      tooltip: "Select Range",
      selected: ""
    },
    status: {
      title: "Status",
      options: [
        { key: "all", label: "All" },
        { key: "parsed", label: "True" },
        { key: "unparsed", label: "False" }
      ],
      type: "dropdown",
      tooltip: "Status filter (True/False)",
      selected: "all"
    }
  }
};

export const audit_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Date Range",
      options: [],
      type: "daterange",
      tooltip: "Select Range",
      selected: ""
    }
  }
};

export const stealer_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range",
      selected: ""
    }
  }
};


export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All Networks" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" },
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    index: {
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
      type: "dropdown",
      tooltip: "",
      selected: "all"
    },
    content_type: {
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
      type: "dropdown",
      tooltip: "",
      selected: "all"
    },
    daterange: {
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
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" }
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    safe: {
      title: "Safe Search",
      options: [
        { key: "yes", label: "Yes" },
        { key: "no", label: "No" }
      ],
      type: "dropdown",
      tooltip: "Enable Filtering",
      selected: "yes"
    },
    daterange: {
      title: "Creation Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date Range",
      selected: ""
    },
    content: {
      title: "Content Type",
      options: [
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
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    }
  }
};

export const social_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" }
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    content: {
      title: "Content Type",
      options: [
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
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
    daterange: {
      title: "Creation Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date Range",
      selected: ""
    },
  }
};

export const chat_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Message Date",
      options: [],
      type: 'daterange',
      tooltip: "Message Date",
      selected: ""
    },
    content: {
      title: "Content Type",
      options: [
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
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    }
  }
};

export const exploit_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Message Date",
      options: [],
      type: 'daterange',
      tooltip: "Message Date",
      selected: ""
    },
    content: {
      title: "Content Type",
      options: [
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
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" }
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
  }
};

export const defacement_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range",
      selected: ""
    },
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" }
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },

  }
};

export const consolidated_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: [
        { key: "all", label: "All" },
        { key: "onion", label: "Onion" },
        { key: "i2p", label: "I2P" },
        { key: "clearnet", label: "Clearnet" }
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    daterange: {
      title: "Creation Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date Range",
      selected: ""
    },
        content: {
      title: "Content Type",
      options: [
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
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
    platform: {
      title: "Platform",
      options: [
        { key: "generic_model", label: "General Iintelligence" },
        { key: "leak_model", label: "Data Breach" },
        { key: "exploit_model", label: "Exploit" },
        { key: "social_model", label: "Social" },
        { key: "chat_model", label: "Chat" },
        { key: "all", label: "All" },
      ],
      type: "dropdown",
      tooltip: "Platform",
      selected: "all"
    }
  }
};

export const alert_filters: FilterModel = {
  filters: {
    daterange: {
      title: "Date Range",
      options: [],
      type: 'daterange',
      tooltip: "Date Range",
      selected: ""
    },
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
