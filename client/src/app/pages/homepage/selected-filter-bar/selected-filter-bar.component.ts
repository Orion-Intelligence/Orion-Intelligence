import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgFor, NgIf, CommonModule} from '@angular/common';
import {FilterModel, FilterOption} from '../../../shared/model/filter/filter.model';
import {AppService} from '../../../services/core/app/app.service';


@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './selected-filter-bar.component.html'
})
export class SelectedFilterBarComponent implements OnInit {

  @Input() filterModel!: FilterModel;
  @Input() showSorting!: boolean;
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();

  categories: Record<string, string[]> = {};
  isFilterBarExpanded: boolean = false;

  maxVisibleTags = 8;
  Object: any;

  constructor(protected app_service: AppService,) {
  }

  ngOnInit(): void {
    this.categories = this.app_service.configData().localSettings.entityfilterCategories;
  }

  clearFilters(scope: 'sidebar' | 'entity' | 'all'): void {
    if (scope === 'sidebar' || scope === 'all') {
      for (const key in this.filterModel.filters) {
        if (this.filterModel.filters.hasOwnProperty(key)) {
          const filter = this.filterModel.filters[key];
          filter.selected = Array.isArray(filter.selected) ? [] : null as any;
        }
      }
    }

    if (scope === 'entity' || scope === 'all') {
      this.app_service.set('entityfilterCategories', {});
    }

    this.clearAll.emit();
  }

  removeEntityTypeFilterTag(tagToRemoveId: string) {
    const categories = {...this.app_service.configData().localSettings.entityfilterCategories};
    for (const key in categories) {
      const value = categories[key];
      if (Array.isArray(value)) {
        categories[key] = value.filter(tag => tag !== tagToRemoveId);
      } else if (value === tagToRemoveId) {
        delete categories[key];
      }
    }

    this.app_service.set('entityfilterCategories', categories);
    this.searchFiltersChange.emit();
  }

  getSelectedLabel(filterOption: FilterOption): string {
    if (filterOption.selected === 'attack-pattern' || filterOption.selected === 'yes') return '-';
    if (!filterOption || !filterOption.options?.length) {
      return typeof filterOption.selected === 'string' ? filterOption.selected || '-' : '-';
    }

    const found = filterOption.options.find(opt => opt.key === filterOption.selected);
    return found?.label || '-';
  }

  isFilterSelected(filterOption: FilterOption): boolean {
    if (!filterOption) return false;
    const label = this.getSelectedLabel(filterOption);
    return !!label && label !== '-';
  }

  toggleFilterBarCollapse(): void {
    this.isFilterBarExpanded = !this.isFilterBarExpanded;
  }

  sidebarFilterCount(): number {
    return Object.values(this.filterModel?.filters || {}).filter(filter => this.isFilterSelected(filter)).length;
  }

  entityFiltersCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
  }

  getVisibleTags(): string[] {
    const allTags = Object.values(this.app_service.configData().localSettings.entityfilterCategories).flat();
    return allTags.slice(0, this.maxVisibleTags);
  }

  getHiddenTagCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    const totalTags = Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
    return Math.max(0, totalTags - this.maxVisibleTags);
  }
}
