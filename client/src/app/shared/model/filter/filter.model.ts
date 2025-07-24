export interface FilterOption {
  options: { key: string; label: string }[];
  type: string;
  title: string;
  tooltip: string;
  selected: string | [];
}

export interface FilterModel {
  filters: Record<string, FilterOption>;
}
