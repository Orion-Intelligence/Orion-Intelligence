import { FilterModel } from '../model/filter/filter.model';

export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet", "telegram"],
      type: "dropdown",
    },
    index: {
      title: "Index Type",
      options: ["all", "general", "leak", "defacement"],
      type: "dropdown",
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
    },
  },
};

export const general_filters: FilterModel = {
  filters: {
    mNetwork: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "freenet"],
      type: "dropdown",
    },
    mSearchParamSafeSearch: {
      title: "Safe Search",
      options: ["yes", "no"],
      type: "dropdown",
    },
  },
};
