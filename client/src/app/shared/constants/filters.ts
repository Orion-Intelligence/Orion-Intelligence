import { FilterModel } from '../model/filter/filter.model';

export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet"],
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
      options: ["all", "onion", "i2p", "freenet"],
      type: "dropdown",
      tooltip: "Web Layers"
    },
    mSearchParamSafeSearch: {
      title: "Safe Search",
      options: ["yes", "no"],
      type: "dropdown",
      tooltip: "Enable Filtering"
    },
  },
};
