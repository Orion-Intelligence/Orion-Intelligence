export type CountryData = {
  id: string;
  name: string;
  value: number;
};

export type CountryInsightPageResponse = {
  items: any[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
};
