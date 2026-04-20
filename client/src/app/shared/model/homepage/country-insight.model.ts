export interface CountryData {
  id: string;
  name: string;
  value: number;
}

export interface CountryInsightPageResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
