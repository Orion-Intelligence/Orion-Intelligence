import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter, HostListener, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterCategory } from '../../../shared/model/filter/filter.model';
import { search_filter_keys } from '../../../shared/constants/shared-enums';
import { search_filter_labels } from '../../../shared/constants/shared-enums';
import { AppService } from '../../../services/core/app.service';

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-filters.component.html'
})
export class SearchFiltersComponent implements AfterViewInit, OnInit {
  @Input() showSorting!: boolean;
  @Output() searchFiltersChange = new EventEmitter<void>();
  categories: FilterCategory[] = [];

  selectedCategoryId = '';
  entitySearch = '';
  newValue = '';
  @ViewChild('categoryScroll', { static: true }) categoryScroll!: ElementRef;

  showLeftFade = false;
  showRightFade = false;

  constructor(public app_service: AppService) {
  }

  get selectedCategory(): FilterCategory {
    return this.categories.find(cat => cat.id === this.selectedCategoryId)!;
  }

  ngOnInit(): void {
    const defaultCategories = Array.from(search_filter_keys).map((key) => {
      return {
        id: key,
        name: search_filter_labels[key] || key,
        tags: []
      };
    });

    this.initializeFilterCategories(defaultCategories);

    this.categories = this.app_service.configData().settings.entityfilterCategories;
    const savedCategoryId = this.app_service.configData().settings.selectedEntityCategoryId;
    this.selectedCategoryId = savedCategoryId && savedCategoryId !== 'selected'
      ? savedCategoryId
      : this.categories[0]?.id || '';
  }
  ngAfterViewInit() {
    setTimeout(() => this.updateFadeVisibility(), 300);
  }
  initializeFilterCategories(defaultCategories: FilterCategory[]): void {
    const currentCategories = this.app_service.configData().settings.entityfilterCategories;
    if (!currentCategories || currentCategories.length === 0) {
      this.app_service.set('entityfilterCategories', defaultCategories);
    }
  }

  scrollLeft() {
    this.categoryScroll.nativeElement.scrollBy({ left: -150, behavior: 'smooth' });
    setTimeout(() => this.updateFadeVisibility(), 300);
  }

  scrollRight() {
    this.categoryScroll.nativeElement.scrollBy({ left: 150, behavior: 'smooth' });
    setTimeout(() => this.updateFadeVisibility(), 300);
  }

  @HostListener('window:resize')
  updateFadeVisibility() {
    const el = this.categoryScroll.nativeElement;
    this.showLeftFade = el.scrollLeft > 0;
    this.showRightFade = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
  }

  addTag() {
    const trimmed = this.newValue.trim();
    if (
      trimmed &&
      !this.selectedCategory.tags.some(tag => tag.value === trimmed)
    ) {
      this.selectedCategory.tags.push({
        id: Date.now().toString(),
        value: trimmed,
        type: this.selectedCategory.id
      });
      this.updateService();
    }
    this.newValue = '';
  }

  removeTag(category: FilterCategory, tagId: string) {
    category.tags = category.tags.filter(tag => tag.id !== tagId);
    this.updateService();
  }

  clearSelection() {
    this.categories.forEach(cat => (cat.tags = []));
    this.updateService();
  }

  private updateService() {
    this.app_service.set('entityfilterCategories', this.categories);
    this.app_service.set('selectedEntityCategoryId', this.selectedCategory.id);
  }

  toggleExpand() {
    this.app_service.set('iocExpanded', !this.app_service.configData().settings.iocExpanded);
  }
  onEntityFilterToggle(newValue: boolean): void {
    this.app_service.set('entityFilterCondition', newValue);
  }
  hasAnyTags(): boolean {
    return this.categories.some(category => category.tags.length > 0);
  }

  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.app_service.set('selectedEntityCategoryId', categoryId);
  }
  searchFilterCategories(query: string): FilterCategory[] {
    if (query === '') {
      return this.categories;
    } else {
      const filtered = this.categories.filter(category =>
        category.name.toLowerCase().includes(query)
      );

      if (filtered.length > 0 && !filtered.some(cat => cat.id === this.selectedCategoryId)) {
        this.selectedCategoryId = filtered[0].id;
        this.app_service.set('selectedEntityCategoryId', filtered[0].id);
      }

      return filtered;
    }
  };
}
