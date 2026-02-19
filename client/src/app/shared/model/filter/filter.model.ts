export interface FilterOption {
    options: {
        key: string;
        label: string;
    }[];
    type: string;
    title: string;
    tooltip: string;
    selected: string | string[];
}
export interface FilterModel {
    filters: Record<string, FilterOption>;
}
export interface FilterTag {
    id: string;
    value: string;
    type?: string;
}
export interface FilterCategory {
    id: string;
    name: string;
    tags: FilterTag[];
}
