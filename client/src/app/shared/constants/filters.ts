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
      title: "Mitre TTP",
      options: [
        { key: "attack-pattern", label: "Attack Pattern" },
        { key: "campaign", label: "Campaign" },
        { key: "course-of-action", label: "Course Of Action" },
        { key: "identity", label: "Identity" },
        { key: "intrusion-set", label: "Intrusion Set" },
        { key: "malware", label: "Malware" },
        { key: "marking-definition", label: "Marking Definition" },
        { key: "relationship", label: "Relationship" },
        { key: "tool", label: "Tool" },
        { key: "x-mitre-collection", label: "X Mitre Collection" },
        { key: "x-mitre-data-component", label: "X Mitre Data Component" },
        { key: "x-mitre-data-source", label: "X Mitre Data Source" },
        { key: "x-mitre-matrix", label: "X Mitre Matrix" },
        { key: "x-mitre-tactic", label: "X Mitre Tactic" }
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
      title: "Mitre TTP",
      options: [
        { key: "attack-pattern", label: "Attack Pattern" },
        { key: "campaign", label: "Campaign" },
        { key: "course-of-action", label: "Course Of Action" },
        { key: "identity", label: "Identity" },
        { key: "intrusion-set", label: "Intrusion Set" },
        { key: "malware", label: "Malware" },
        { key: "marking-definition", label: "Marking Definition" },
        { key: "relationship", label: "Relationship" },
        { key: "tool", label: "Tool" },
        { key: "x-mitre-collection", label: "X Mitre Collection" },
        { key: "x-mitre-data-component", label: "X Mitre Data Component" },
        { key: "x-mitre-data-source", label: "X Mitre Data Source" },
        { key: "x-mitre-matrix", label: "X Mitre Matrix" },
        { key: "x-mitre-tactic", label: "X Mitre Tactic" }
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

export const filter_mapping: Record<string, string> = {
  source: "Source",
  daterange: "Date Range",
  status: "Status",
  network: "Network Type",
  index: "Index Type",
  content_type: "Content Type",
  safe: "Safe Search",
  content: "Mitre TTP",
  mitre: "Mitre TTP"
};
