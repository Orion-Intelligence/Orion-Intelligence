export interface CrossSearchEntry {
  engine: string;
  search_url?: string;
  first_result?: {
    url?: string;
    title?: string;
    description?: string;
  };
  status?: string;
}

export interface CrossSearchResponse {
  status?: string;
  progress?: number;
  step?: string;
  result?: {
    status?: string;
    progress?: number;
    step?: string;
    results?: CrossSearchEntry[];
  };
}
