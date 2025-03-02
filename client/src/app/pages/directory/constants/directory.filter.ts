import { FilterModel } from '../../../shared/model/filter/filter';

export const directory_filters: FilterModel = {
  filters: {
    network: {
      title: "Network Type",
      options: ["all", "onion", "i2p", "clearnet"],
      type: "dropdown",
    },
    index: {
      title: "Index Type",
      options: ["all", "general", "leak"],
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
      ],
      type: "dropdown",
    },
  },
};
