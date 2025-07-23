import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FilterCategory, FilterModel, FilterOption, FilterTag } from '../../../shared/model/filter/filter.model';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './selected-filter-bar.component.html'
})
export class SelectedFilterBarComponent {
  @Input() filterModel!: FilterModel;
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();
  entityFilterCategories: FilterCategory[] = [];

  isExpanded: boolean = false;
  private subscriptions: Subscription[] = [];
  constructor(private entityFilterService: EntityFilterService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.subscriptions.push(
      this.entityFilterService.filterCategories$.subscribe(categories => {
        this.entityFilterCategories = categories;
      })
    );
  }


  clearAllFilters(): void {
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
    this.entityFilterService.clearPersistedState();
    this.clearAll.emit();
  }


  toggleExpandCollapse(): void {
    this.isExpanded = !this.isExpanded;
  }

  removeEntityTypeFilterTag(categoryId: string, tagToRemoveId: string) {
    const currentCategories = this.entityFilterService.getCurrentFilterCategories();
    const updatedCategories = currentCategories.map(category => {
      if (category.id === categoryId) {
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
}