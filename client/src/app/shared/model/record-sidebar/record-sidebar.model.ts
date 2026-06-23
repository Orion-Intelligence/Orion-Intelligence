export interface RecordSidebarItem {
  id: string;
  title: string;
  subtitle?: string;
  kindLabel?: string;
  date?: string | null;
  tags?: string[];
  sourceLabel?: string;
  routerLink: string[];
  queryParams?: Record<string, string>;
  searchText?: string;
  savePositionId?: string;
}
