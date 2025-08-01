import {FilterModel} from '../model/filter/filter.model';

export const dump_filters: FilterModel = {
  filters: {
    source: {
      title: "Source",
      options: [
        {key: "all", label: "All"},
        {key: "telegram", label: "Telegram"},
        {key: "websites", label: "Websites"}
      ],
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
    },
    status: {
      title: "Status",
      options: [
        {key: "all", label: "All"},
        {key: "true", label: "True"},
        {key: "false", label: "False"}
      ],
      type: "dropdown",
      tooltip: "Status filter (True/False)",
      selected: "all"
    }
  }
};

export const stealer_filters: FilterModel = {
  filters: {
    mDateRange: {
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
        {key: "all", label: "All Networks"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"},
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    index: {
      title: "Index Type",
      options: [
        {key: "all", label: "All"},
        {key: "general", label: "General"},
        {key: "leak", label: "Leak"},
        {key: "defacement", label: "Defacement"},
        {key: "chat", label: "Chat"},
        {key: "exploit", label: "Exploit"},
        {key: "twitter", label: "Twitter"},
        {key: "reddit", label: "Reddit"},
      ],
      type: "dropdown",
      tooltip: "",
      selected: "all"
    },
    content_type: {
      title: "Content Type",
      options: [
        {key: "all", label: "All"},
        {key: "general", label: "General"},
        {key: "forums", label: "Forums"},
        {key: "news", label: "News"},
        {key: "stolen", label: "Stolen"},
        {key: "drugs", label: "Drugs"},
        {key: "hacking", label: "Hacking"},
        {key: "marketplaces", label: "Marketplaces"},
        {key: "cryptocurrency", label: "Cryptocurrency"},
        {key: "leaks", label: "Leaks"},
        {key: "adult", label: "Adult"},
        {key: "tracking", label: "Tracking"},
        {key: "chat", label: "Chat"},
        {key: "social", label: "Social"}
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
    network: {
      title: "Network Type",
      options: [
        {key: "all", label: "All"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"}
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    safe: {
      title: "Safe Search",
      options: [
        {key: "yes", label: "Yes"},
        {key: "no", label: "No"}
      ],
      type: "dropdown",
      tooltip: "Enable Filtering",
      selected: "yes"
    },
    daterange: {
      title: "Creation Date",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date",
      selected: ""
    },
    content: {
      title: "Mitre TTP",
      options: [
        {key: "attack-pattern", label: "Attack Pattern"},
        {key: "campaign", label: "Campaign"},
        {key: "course-of-action", label: "Course Of Action"},
        {key: "identity", label: "Identity"},
        {key: "intrusion-set", label: "Intrusion Set"},
        {key: "malware", label: "Malware"},
        {key: "marking-definition", label: "Marking Definition"},
        {key: "relationship", label: "Relationship"},
        {key: "tool", label: "Tool"},
        {key: "x-mitre-collection", label: "X Mitre Collection"},
        {key: "x-mitre-data-component", label: "X Mitre Data Component"},
        {key: "x-mitre-data-source", label: "X Mitre Data Source"},
        {key: "x-mitre-matrix", label: "X Mitre Matrix"},
        {key: "x-mitre-tactic", label: "X Mitre Tactic"}
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
        {key: "all", label: "All"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"}
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },
    daterange: {
      title: "Creation Date",
      options: [],
      type: 'daterange',
      tooltip: "Creation Date",
      selected: ""
    },
  }
};

export const chat_filters: FilterModel = {
  filters: {
    mContentType: {
      title: "Content Type",
      options: [
        {key: "EMAILS", label: "Emails"},
        {key: "HASHES", label: "Hashes"},
        {key: "IOCS", label: "IOCs"},
        {key: "IPS", label: "IPs"},
        {key: "IPV4S", label: "IPv4s"},
        {key: "IPV6S", label: "IPv6s"},
        {key: "MD5_HASHES", label: "MD5 Hashes"},
        {key: "SHA1_HASHES", label: "SHA1 Hashes"},
        {key: "SHA256_HASHES", label: "SHA256 Hashes"},
        {key: "SHA512_HASHES", label: "SHA512 Hashes"},
        {key: "TELEPHONE_NUMS", label: "Telephone Nums"},
        {key: "UNENCODED_URLS", label: "Unencoded URLs"},
        {key: "URLS", label: "URLs"},
        {key: "EMAIL_ADDRESSES_COMPLETE", label: "Email Addresses Complete"},
        {key: "EMAIL_ADDRESSES", label: "Email Addresses"},
        {key: "DOMAINS", label: "Domains"},
        {key: "SHA512S", label: "SHA512s"},
        {key: "SHA256S", label: "SHA256s"},
        {key: "SHA1S", label: "SHA1s"},
        {key: "MD5S", label: "MD5s"},
        {key: "SSDEEPS", label: "SSDEEPS"},
        {key: "CVES", label: "CVEs"},
        {key: "BITCOIN_ADDRESSES", label: "Bitcoin Addresses"},
        {key: "MAC_ADDRESSES", label: "MAC Addresses"},
        {key: "API_KEY", label: "API Key"},
        {key: "AWS_SECRET", label: "AWS Secret"},
        {key: "AZURE_RESOURCE_ID", label: "Azure Resource ID"},
        {key: "REGISTRY_KEY", label: "Registry Key"},
        {key: "FILE_PATH", label: "File Path"},
        {key: "YARA_RULE", label: "YARA Rule"},
        {key: "PHONE_NUMBER", label: "Phone Number"},
        {key: "COUNTRY", label: "Country"},
        {key: "ORG", label: "Org"},
        {key: "GPE", label: "GPE"},
        {key: "NORP", label: "NORP"},
        {key: "PRODUCT", label: "Product"},
        {key: "PERSON", label: "Person"},
        {key: "LOC", label: "LOC"},
        {key: "LAW", label: "Law"},
        {key: "CREDIT_CARD", label: "Credit Card"},
        {key: "IBAN_CODE", label: "IBAN Code"},
        {key: "IN_AADHAAR", label: "IN Aadhaar"},
        {key: "AU_ABN", label: "AU ABN"},
        {key: "AU_TFN", label: "AU TFN"},
        {key: "IN_VEHICLE_REGISTRATION", label: "IN Vehicle Registration"},
        {key: "IP_ADDRESS", label: "IP Address"},
        {key: "IN_PAN", label: "IN PAN"},
        {key: "LOCATION", label: "Location"},
        {key: "NRP", label: "NRP"},
        {key: "SG_NRIC_FIN", label: "SG NRIC FIN"},
        {key: "US_ITIN", label: "US ITIN"},
        {key: "IN_VOTER", label: "IN Voter"},
        {key: "US_DRIVER_LICENSE", label: "US Driver License"},
        {key: "URL", label: "URL"},
        {key: "US_SSN", label: "US SSN"},
        {key: "US_PASSPORT", label: "US Passport"},
        {key: "IN_PASSPORT", label: "IN Passport"},
        {key: "US_BANK_NUMBER", label: "US Bank Number"},
        {key: "USERNAME", label: "Username"},
        {key: "PASSWORD", label: "Password"},
        {key: "HASHTAG", label: "Hashtag"},
        {key: "MENTION", label: "Mention"},
        {key: "MITRE_TTP_TYPE", label: "MITRE TTP Type"}
      ]
      ,
      type: "dropdown",
      tooltip: "",
      selected: "all"
    },
    mDateRange: {
      title: "Message Date",
      options: [],
      type: 'daterange',
      tooltip: "Message Date",
      selected: ""
    },
    mEntity: {
      title: "Entity Type",
      options: [
        {key: "EMAILS", label: "Emails"},
        {key: "HASHES", label: "Hashes"},
        {key: "IOCS", label: "IOCs"},
        {key: "IPS", label: "IPs"},
        {key: "IPV4S", label: "IPv4s"},
        {key: "IPV6S", label: "IPv6s"},
        {key: "MD5_HASHES", label: "MD5 Hashes"},
        {key: "SHA1_HASHES", label: "SHA1 Hashes"},
        {key: "SHA256_HASHES", label: "SHA256 Hashes"},
        {key: "SHA512_HASHES", label: "SHA512 Hashes"},
        {key: "TELEPHONE_NUMS", label: "Telephone Nums"},
        {key: "UNENCODED_URLS", label: "Unencoded URLs"},
        {key: "URLS", label: "URLs"},
        {key: "EMAIL_ADDRESSES_COMPLETE", label: "Email Addresses Complete"},
        {key: "EMAIL_ADDRESSES", label: "Email Addresses"},
        {key: "DOMAINS", label: "Domains"},
        {key: "SHA512S", label: "SHA512s"},
        {key: "SHA256S", label: "SHA256s"},
        {key: "SHA1S", label: "SHA1s"},
        {key: "MD5S", label: "MD5s"},
        {key: "SSDEEPS", label: "SSDEEPS"},
        {key: "CVES", label: "CVEs"},
        {key: "BITCOIN_ADDRESSES", label: "Bitcoin Addresses"},
        {key: "MAC_ADDRESSES", label: "MAC Addresses"},
        {key: "API_KEY", label: "API Key"},
        {key: "AWS_SECRET", label: "AWS Secret"},
        {key: "AZURE_RESOURCE_ID", label: "Azure Resource ID"},
        {key: "REGISTRY_KEY", label: "Registry Key"},
        {key: "FILE_PATH", label: "File Path"},
        {key: "YARA_RULE", label: "YARA Rule"},
        {key: "PHONE_NUMBER", label: "Phone Number"},
        {key: "COUNTRY", label: "Country"},
        {key: "ORG", label: "Org"},
        {key: "GPE", label: "GPE"},
        {key: "NORP", label: "NORP"},
        {key: "PRODUCT", label: "Product"},
        {key: "PERSON", label: "Person"},
        {key: "LOC", label: "LOC"},
        {key: "LAW", label: "Law"},
        {key: "CREDIT_CARD", label: "Credit Card"},
        {key: "IBAN_CODE", label: "IBAN Code"},
        {key: "IN_AADHAAR", label: "IN Aadhaar"},
        {key: "AU_ABN", label: "AU ABN"},
        {key: "AU_TFN", label: "AU TFN"},
        {key: "IN_VEHICLE_REGISTRATION", label: "IN Vehicle Registration"},
        {key: "IP_ADDRESS", label: "IP Address"},
        {key: "IN_PAN", label: "IN PAN"},
        {key: "LOCATION", label: "Location"},
        {key: "NRP", label: "NRP"},
        {key: "SG_NRIC_FIN", label: "SG NRIC FIN"},
        {key: "US_ITIN", label: "US ITIN"},
        {key: "IN_VOTER", label: "IN Voter"},
        {key: "US_DRIVER_LICENSE", label: "US Driver License"},
        {key: "URL", label: "URL"},
        {key: "US_SSN", label: "US SSN"},
        {key: "US_PASSPORT", label: "US Passport"},
        {key: "IN_PASSPORT", label: "IN Passport"},
        {key: "US_BANK_NUMBER", label: "US Bank Number"},
        {key: "USERNAME", label: "Username"},
        {key: "PASSWORD", label: "Password"},
        {key: "HASHTAG", label: "Hashtag"},
        {key: "MENTION", label: "Mention"},
        {key: "MITRE_TTP_TYPE", label: "MITRE TTP Type"}
      ]
      ,
      type: 'multiSelection',
      tooltip: "Entity Filter",
      selected: []
    },
    mMitreTtp: {
      title: "Mitre TTP",
      options: [
        {key: "attack-pattern", label: "Attack Pattern"},
        {key: "campaign", label: "Campaign"},
        {key: "course-of-action", label: "Course Of Action"},
        {key: "identity", label: "Identity"},
        {key: "intrusion-set", label: "Intrusion Set"},
        {key: "malware", label: "Malware"},
        {key: "marking-definition", label: "Marking Definition"},
        {key: "relationship", label: "Relationship"},
        {key: "tool", label: "Tool"},
        {key: "x-mitre-collection", label: "X Mitre Collection"},
        {key: "x-mitre-data-component", label: "X Mitre Data Component"},
        {key: "x-mitre-data-source", label: "X Mitre Data Source"},
        {key: "x-mitre-matrix", label: "X Mitre Matrix"},
        {key: "x-mitre-tactic", label: "X Mitre Tactic"}
      ]
      ,
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
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
    network: {
      title: "Network Type",
      options: [
        {key: "all", label: "All"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"}
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
        {key: "all", label: "All"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"}
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
    },

  }
};

export const consolidated_filters: FilterModel = {
  filters: {
    mNetwork: {
      title: "Network Type",
      options: [
        {key: "all", label: "All"},
        {key: "onion", label: "Onion"},
        {key: "i2p", label: "I2P"},
        {key: "clearnet", label: "Clearnet"}
      ],
      type: "dropdown",
      tooltip: "Web Layers",
      selected: "all"
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
      options: [
        {key: "attack-pattern", label: "Attack Pattern"},
        {key: "campaign", label: "Campaign"},
        {key: "course-of-action", label: "Course Of Action"},
        {key: "identity", label: "Identity"},
        {key: "intrusion-set", label: "Intrusion Set"},
        {key: "malware", label: "Malware"},
        {key: "marking-definition", label: "Marking Definition"},
        {key: "relationship", label: "Relationship"},
        {key: "tool", label: "Tool"},
        {key: "x-mitre-collection", label: "X Mitre Collection"},
        {key: "x-mitre-data-component", label: "X Mitre Data Component"},
        {key: "x-mitre-data-source", label: "X Mitre Data Source"},
        {key: "x-mitre-matrix", label: "X Mitre Matrix"},
        {key: "x-mitre-tactic", label: "X Mitre Tactic"}
      ],
      type: 'dropdown',
      tooltip: "Content Filter",
      selected: "attack-pattern"
    },
    mEntity: {
      title: "Entity Type",
      options: [
        {key: "EMAILS", label: "Emails"},
        {key: "HASHES", label: "Hashes"},
        {key: "IOCS", label: "IOCs"},
        {key: "IPS", label: "IPs"},
        {key: "IPV4S", label: "IPv4s"},
        {key: "IPV6S", label: "IPv6s"},
        {key: "MD5_HASHES", label: "MD5 Hashes"},
        {key: "SHA1_HASHES", label: "SHA1 Hashes"},
        {key: "SHA256_HASHES", label: "SHA256 Hashes"},
        {key: "SHA512_HASHES", label: "SHA512 Hashes"},
        {key: "TELEPHONE_NUMS", label: "Telephone Nums"},
        {key: "UNENCODED_URLS", label: "Unencoded URLs"},
        {key: "URLS", label: "URLs"},
        {key: "EMAIL_ADDRESSES_COMPLETE", label: "Email Addresses Complete"},
        {key: "EMAIL_ADDRESSES", label: "Email Addresses"},
        {key: "DOMAINS", label: "Domains"},
        {key: "SHA512S", label: "SHA512s"},
        {key: "SHA256S", label: "SHA256s"},
        {key: "SHA1S", label: "SHA1s"},
        {key: "MD5S", label: "MD5s"},
        {key: "SSDEEPS", label: "SSDEEPS"},
        {key: "CVES", label: "CVEs"},
        {key: "BITCOIN_ADDRESSES", label: "Bitcoin Addresses"},
        {key: "MAC_ADDRESSES", label: "MAC Addresses"},
        {key: "API_KEY", label: "API Key"},
        {key: "AWS_SECRET", label: "AWS Secret"},
        {key: "AZURE_RESOURCE_ID", label: "Azure Resource ID"},
        {key: "REGISTRY_KEY", label: "Registry Key"},
        {key: "FILE_PATH", label: "File Path"},
        {key: "YARA_RULE", label: "YARA Rule"},
        {key: "PHONE_NUMBER", label: "Phone Number"},
        {key: "COUNTRY", label: "Country"},
        {key: "ORG", label: "Org"},
        {key: "GPE", label: "GPE"},
        {key: "NORP", label: "NORP"},
        {key: "PRODUCT", label: "Product"},
        {key: "PERSON", label: "Person"},
        {key: "LOC", label: "LOC"},
        {key: "LAW", label: "Law"},
        {key: "CREDIT_CARD", label: "Credit Card"},
        {key: "IBAN_CODE", label: "IBAN Code"},
        {key: "IN_AADHAAR", label: "IN Aadhaar"},
        {key: "AU_ABN", label: "AU ABN"},
        {key: "AU_TFN", label: "AU TFN"},
        {key: "IN_VEHICLE_REGISTRATION", label: "IN Vehicle Registration"},
        {key: "IP_ADDRESS", label: "IP Address"},
        {key: "IN_PAN", label: "IN PAN"},
        {key: "LOCATION", label: "Location"},
        {key: "NRP", label: "NRP"},
        {key: "SG_NRIC_FIN", label: "SG NRIC FIN"},
        {key: "US_ITIN", label: "US ITIN"},
        {key: "IN_VOTER", label: "IN Voter"},
        {key: "US_DRIVER_LICENSE", label: "US Driver License"},
        {key: "URL", label: "URL"},
        {key: "US_SSN", label: "US SSN"},
        {key: "US_PASSPORT", label: "US Passport"},
        {key: "IN_PASSPORT", label: "IN Passport"},
        {key: "US_BANK_NUMBER", label: "US Bank Number"},
        {key: "USERNAME", label: "Username"},
        {key: "PASSWORD", label: "Password"},
        {key: "HASHTAG", label: "Hashtag"},
        {key: "MENTION", label: "Mention"},
        {key: "MITRE_TTP_TYPE", label: "MITRE TTP Type"}
      ]
      ,
      type: 'multiSelection',
      tooltip: "Entity Filter",
      selected: []
    }
  }
};
