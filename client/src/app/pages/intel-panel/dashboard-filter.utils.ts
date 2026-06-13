import { Category } from '../../shared/constants/pages';
import { FilterModel, FilterOption } from '../../shared/model/filter/filter.model';

export const MALPEDIA_FILTER_OPTIONS_ENDPOINT = 'search/apt/families';
export const MALWARE_BAZAAR_FILTER_OPTIONS_ENDPOINT = 'search/malware/filter-options';

export interface MalpediaFilterOptionsResponse {
  families?: string[];
  countries?: string[];
}

export interface MalwareBazaarFilterOptionsResponse {
  countries?: string[];
  content_types?: string[];
  reporters?: string[];
}

interface DashboardFilterModels {
  general: FilterModel;
  threatIntel: FilterModel;
  malpedia: FilterModel;
  malwareBazaar: FilterModel;
}

export function getDashboardFilterModel(type: Category, route: string, filters: DashboardFilterModels): FilterModel {
  if (isMalpediaRoute(type, route)) {
    return filters.malpedia;
  }
  if (isMalwareBazaarRoute(type, route)) {
    return filters.malwareBazaar;
  }
  return type === Category.THREAT_INTEL ? filters.threatIntel : filters.general;
}

export function isMalpediaRoute(type: Category, route: string): boolean {
  return type === Category.THREAT_INTEL && route.endsWith('/threat-intel/apt');
}

export function isMalwareBazaarRoute(type: Category, route: string): boolean {
  return type === Category.THREAT_INTEL && route.endsWith('/threat-intel/malware');
}

export function applyMalpediaFilterOptions(filterModel: FilterModel, response: MalpediaFilterOptionsResponse): void {
  setDropdownOptions(filterModel.filters['family'], response.families || [], formatMalpediaFamilyLabel);
  setDropdownOptions(filterModel.filters['m_country'], response.countries || []);
}

export function applyMalwareBazaarFilterOptions(filterModel: FilterModel, response: MalwareBazaarFilterOptionsResponse): void {
  setDropdownOptions(filterModel.filters['m_country'], response.countries || []);
  setDropdownOptions(filterModel.filters['content_type'], response.content_types || []);
  setDropdownOptions(filterModel.filters['m_reporter'], response.reporters || []);
}

function setDropdownOptions(filter: FilterOption | undefined, values: string[], labelFormatter: (value: string) => string = (value) => value): void {
  if (!filter) {
    return;
  }
  filter.options = [
    { key: 'all', label: 'All' },
    ...values.map((value) => ({ key: value, label: labelFormatter(value) }))
  ];
}

function formatMalpediaFamilyLabel(family: string): string {
  return family.replace(/^[^.]+\./, '');
}
