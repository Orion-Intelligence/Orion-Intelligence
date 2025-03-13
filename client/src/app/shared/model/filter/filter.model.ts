export interface FilterOption {
  options: string[];
  type: string;
  title: string;
}

export interface FilterModel {
  filters: { [key: string]: FilterOption };
}
