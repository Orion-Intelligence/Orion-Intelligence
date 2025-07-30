import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FilterCategory, FilterModel, FilterOption } from '../../../shared/model/filter/filter.model';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './selected-filter-bar.component.html'
})
export class SelectedFilterBarComponent implements OnInit {
  private subscriptions: Subscription[] = [];

  @Input() filterModel!: FilterModel;
  @Input() showSorting!: boolean;
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();


  categories: FilterCategory[] = [];
  isFilterBarExpanded: boolean = false;

  maxVisibleTags = 4;
  Object: any;

  constructor(private entityFilterService: EntityFilterService) { }

  ngOnInit(): void {
    this.subscriptions.push(
      this.entityFilterService.filterCategories$.subscribe(categories => {
        this.categories = categories;
      })
    );
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
      this.entityFilterService.clearPersistedState();
    }

    this.clearAll.emit();
  }





  removeEntityTypeFilterTag(tagToRemoveId: string) {
    const currentCategories = this.entityFilterService.getCurrentFilterCategories();

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

    this.entityFilterService.updateFilterCategories(updatedCategories);
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
    return this.categories?.reduce((total, category) => total + category.tags.length, 0) ?? 0;
  }

  getVisibleTags(categories: { tags: any[] }[]): any[] {
    const allTags = categories.flatMap(category => category.tags);
    return allTags.slice(0, this.maxVisibleTags);
  }

  getHiddenTagCount(categories: { tags: any[] }[]): number {
    const totalTags = categories.reduce((acc, category) => acc + category.tags.length, 0);
    const hidden = totalTags - this.maxVisibleTags;
    return hidden > 0 ? hidden : 0;
  }


}
