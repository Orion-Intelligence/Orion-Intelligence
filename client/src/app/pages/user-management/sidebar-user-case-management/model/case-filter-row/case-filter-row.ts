import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CASE_STATUS_OPTIONS, CASE_TYPE_OPTIONS, PRIORITY_OPTIONS, SEVERITY_OPTIONS } from '../../../../../shared/model/case-management/case-management.defaults';
import { CaseStatus, CaseType, Priority, Severity } from '../../../../../shared/model/case-management/case.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../../../../shared/components/ui-dropdown/ui-dropdown.component';

export type CaseFilterValue<T extends string> = T | 'all';
export type CaseSortValue = 'updated_desc' | 'updated_asc' | 'priority_desc' | 'severity_desc';

export interface CaseListFilters {
  searchText: string;
  status: CaseFilterValue<CaseStatus>;
  severity: CaseFilterValue<Severity>;
  priority: CaseFilterValue<Priority>;
  caseType: CaseFilterValue<CaseType>;
  sort: CaseSortValue;
}

export const DEFAULT_CASE_LIST_FILTERS: CaseListFilters = {
  searchText: '',
  status: 'all',
  severity: 'all',
  priority: 'all',
  caseType: 'all',
  sort: 'updated_desc'
};

@Component({
  selector: 'app-case-filter-row',
  imports: [CommonModule, FormsModule, TranslatePipe, UiDropdownComponent],
  templateUrl: './case-filter-row.html'
})
export class CaseFilterRowComponent {
  isMobileFiltersOpen = false;
  readonly viewOptions: UiDropdownOption[] = [ { key: 'open', label: 'Open' }, { key: 'archived', label: 'Archived' } ];
  readonly statusFilterOptions: UiDropdownOption[] = [ { key: 'all', label: 'All Statuses' }, ...CASE_STATUS_OPTIONS.map(option => ({ key: option.value, label: option.label })) ];
  readonly severityFilterOptions: UiDropdownOption[] = [ { key: 'all', label: 'All Severities' }, ...SEVERITY_OPTIONS.map(severity => ({ key: severity, label: this.formatLabel(severity) })) ];
  readonly priorityFilterOptions: UiDropdownOption[] = [ { key: 'all', label: 'All Priorities' }, ...PRIORITY_OPTIONS.map(priority => ({ key: priority, label: this.formatLabel(priority) })) ];
  readonly caseTypeFilterOptions: UiDropdownOption[] = [ { key: 'all', label: 'All Types' }, ...CASE_TYPE_OPTIONS.map(option => ({ key: option.value, label: option.label })) ];
  readonly sortOptions: UiDropdownOption[] = [ { key: 'updated_desc', label: 'Newest Updated' }, { key: 'updated_asc', label: 'Oldest Updated' }, { key: 'priority_desc', label: 'Highest Priority' }, { key: 'severity_desc', label: 'Highest Severity' } ];

  @Input() filters: CaseListFilters = { ...DEFAULT_CASE_LIST_FILTERS };
  @Input() showArchivedCases = false;
  @Input() canManage = false;

  @Output() filtersChange = new EventEmitter<CaseListFilters>();
  @Output() archivedChange = new EventEmitter<boolean>();

  get selectedView(): string {
    return this.showArchivedCases ? 'archived' : 'open';
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
  }

  updateSearchText(value: string): void {
    this.updateFilters({ searchText: value });
  }

  setCaseView(value: string | null): void {
    this.archivedChange.emit(value === 'archived');
  }

  setStatusFilter(value: string | null): void {
    this.updateFilters({ status: (value || 'all') as CaseFilterValue<CaseStatus> });
  }

  setSeverityFilter(value: string | null): void {
    this.updateFilters({ severity: (value || 'all') as CaseFilterValue<Severity> });
  }

  setPriorityFilter(value: string | null): void {
    this.updateFilters({ priority: (value || 'all') as CaseFilterValue<Priority> });
  }

  setCaseTypeFilter(value: string | null): void {
    this.updateFilters({ caseType: (value || 'all') as CaseFilterValue<CaseType> });
  }

  setCaseSort(value: string | null): void {
    this.updateFilters({ sort: (value || 'updated_desc') as CaseSortValue });
  }

  private updateFilters(filters: Partial<CaseListFilters>): void {
    this.filtersChange.emit({ ...this.filters, ...filters });
  }

  private formatLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
