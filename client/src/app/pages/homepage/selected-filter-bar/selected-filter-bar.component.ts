import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FilterCategory, FilterModel, FilterOption, FilterTag } from '../../../shared/model/filter/filter.model';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NgbSlide } from "../../../../../node_modules/@ng-bootstrap/ng-bootstrap/carousel/carousel";


@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule, NgbSlide],
  templateUrl: './selected-filter-bar.component.html'
})
export class SelectedFilterBarComponent {
  @Input() filterModel!: FilterModel;
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();
  categories: FilterCategory[] = [];
  selectedCategoryIndex = 0;
  isFiltersExpanded: boolean = true;
  isAdvanceSearchExpanded: boolean = true;
  isIocExpanded: boolean = false;
  showFilterLeftFade = false;
  showFilterRightFade = false;
  showIocRightFade = false;
  showIocLeftFade = false;

  @ViewChild('categoryScroll', { static: true }) categoryScroll!: ElementRef;
  @ViewChild('filterScroll', { static: true }) filterScroll!: ElementRef;
  private subscriptions: Subscription[] = [];
  Object: any;
  constructor(private entityFilterService: EntityFilterService, private route: ActivatedRoute) { }
  get selectedCategory(): FilterCategory {
    return this.categories[this.selectedCategoryIndex];
  }
  ngOnInit(): void {
    this.subscriptions.push(
      this.entityFilterService.filterCategories$.subscribe(categories => {
        this.categories = categories;
      })
    );
  }


  clearAdvanceSearchAllFilters(): void {
    this.entityFilterService.clearPersistedState();
    this.clearAll.emit();
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
    this.clearAll.emit();
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
  getSelectedLabels(filterOption: FilterOption): string[] {
    if (
      !filterOption ||
      !Array.isArray(filterOption.selected) ||
      !filterOption.options
    ) {
      return [];
    }

    return filterOption.selected
      .map(key => {
        const found = filterOption.options.find(opt => opt.key === key);
        return found?.label || key;
      })
      .filter(label => !!label);
  }






  scrollLeft(element: HTMLElement) {
    element.scrollBy({ left: -150, behavior: 'smooth' });
    setTimeout(() => this.updateFadeVisibility(), 300);
  }

  scrollRight(element: HTMLElement) {
    element.scrollBy({ left: 150, behavior: 'smooth' });
    setTimeout(() => this.updateFadeVisibility(), 300);
  }

  @HostListener('window:resize')
  updateFadeVisibility() {
    const fs = this.filterScroll.nativeElement;
    this.showFilterLeftFade = fs.scrollLeft > 0;
    this.showFilterRightFade = fs.scrollLeft + fs.clientWidth < fs.scrollWidth - 5;

    const cs = this.categoryScroll.nativeElement;
    this.showIocLeftFade = cs.scrollLeft > 0;
    this.showIocRightFade = cs.scrollLeft + cs.clientWidth < cs.scrollWidth - 5;
  }

  toggleIocExpand() {
    this.isIocExpanded = !this.isIocExpanded;
  }
  toggleAdvanceSearchCollapse(): void {
    this.isAdvanceSearchExpanded = !this.isAdvanceSearchExpanded;
  }
  toggleFiltersCollapse(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;
  }
  getNonEmptyCategoryCount(): number {
    return this.entityFilterService.getNonEmptyCategoryCount()
  }
}