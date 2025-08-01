import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FilterCategory, FilterModel, FilterOption } from '../../../shared/model/filter/filter.model';
import { AppService } from '../../../services/core/app.service';


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


  categories: FilterCategory[] = [];
  isFilterBarExpanded: boolean = false;

  maxVisibleTags = 4;
  Object: any;

  constructor(private app_service: AppService) { }

  ngOnInit(): void {
    this.categories = this.app_service.configData().settings.entityfilterCategories;
  }



  clearFilters(scope: 'sidebar' | 'entity' | 'all'): void {
    if (scope === 'sidebar' || scope === 'all') {
      for (const key in this.filterModel.filters) {
        if (this.filterModel.filters.hasOwnProperty(key)) {
          const filter = this.filterModel.filters[key];

          if (Array.isArray(filter.selected)) {
            filter.selected = [];
          } else {
            filter.selected = null as any;
          }
        }
      }
    }

    if (scope === 'entity' || scope === 'all') {
      // this._entityFilterService.clearPersistedState();
      this.app_service.set('entityfilterCategories', []);
    }

    this.clearAll.emit();
  }





  removeEntityTypeFilterTag(tagToRemoveId: string) {
    const currentCategories = this.app_service.configData().settings.entityfilterCategories;
    const updatedCategories = currentCategories.map(category => {
      const tagExists = category.tags.some(tag => tag.id === tagToRemoveId);

      if (tagExists) {
        return {
          ...category,
          tags: category.tags.filter(tag => tag.id !== tagToRemoveId)
        };
      }

      return category;
    });

    this.app_service.set('entityfilterCategories', updatedCategories);
    this.searchFiltersChange.emit();
  }
  getSelectedLabel(filterOption: FilterOption): string {

    if (filterOption.selected === 'attack-pattern' || filterOption.selected === 'yes')
      return '-';
    if (!filterOption || !filterOption.options || filterOption.options.length === 0) {
      return typeof filterOption.selected === 'string' ? filterOption.selected || '-' : '-';
    }

    const selectedKey = filterOption.selected;
    const found = filterOption.options.find(opt => opt.key === selectedKey);
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
    if (!this.filterModel?.filters) return 0;

    return Object.values(this.filterModel.filters)
      .filter(filter => this.isFilterSelected(filter))
      .length;
  }
  entityFiltersCount(): number {
    return this.app_service.configData().settings.entityfilterCategories?.reduce((total, category) => total + category.tags.length, 0) ?? 0;

  }

  getVisibleTags(): any[] {
    const allTags = this.app_service.configData().settings.entityfilterCategories.flatMap(category => category.tags);
    return allTags.slice(0, this.maxVisibleTags);
  }

  getHiddenTagCount(): number {
    const totalTags = this.app_service.configData().settings.entityfilterCategories.reduce((acc, category) => acc + category.tags.length, 0);
    const hidden = totalTags - this.maxVisibleTags;
    return hidden > 0 ? hidden : 0;
  }


}
