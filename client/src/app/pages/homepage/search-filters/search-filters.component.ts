import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { search_filter_keys, search_filter_labels } from '../../../shared/constants/shared-enums';
import { AppService } from '../../../services/core/app/app.service';
import { FilterCategory } from '../../../shared/model/filter/filter.model';
import { searchFilterAnimation } from '../../../shared/animations/search.filter.animation';

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-filters.component.html',
  animations: [searchFilterAnimation],

})
export class SearchFiltersComponent implements OnInit {
  @Input() showSorting!: boolean;
  @Output() searchFiltersChange = new EventEmitter<void>();
  @ViewChild('categoryScroll', { static: true }) categoryScroll!: ElementRef;

  filteredCategories: FilterCategory[] = [];
  categories: Record<string, string[]> = {};
  selectedCategoryId = '';
  entitySearch = '';
  newValue = '';

  showLeftFade = false;
  showRightFade = false;

  constructor(public app_service: AppService) {
  }

  get selectedCategoryTags() {
    return this.categories[this.selectedCategoryId] ?? [];
  }

  ngOnInit(): void {
    const defaultCategories: Record<string, string[]> = {};
    for (const key of search_filter_keys) {
      defaultCategories[key] = [];
    }
    this.initializeFilterCategories(defaultCategories);
    this.categories = this.app_service.configData().localSettings.entityfilterCategories;
    this.initCategories("")
  }

  initializeFilterCategories(defaultCategories: Record<string, string[]>): void {
    const currentCategories = this.app_service.configData().localSettings.entityfilterCategories;
    if (!currentCategories || Object.keys(currentCategories).length === 0) {
      this.app_service.set('entityfilterCategories', defaultCategories);
    }
  }

  scrollLeft() {
    this.categoryScroll.nativeElement.scrollBy({ left: -150, behavior: 'smooth' });
  }

  scrollRight() {
    this.categoryScroll.nativeElement.scrollBy({ left: 150, behavior: 'smooth' });
  }

  addTag() {
    const trimmed = this.newValue.trim();
    const allTags = Object.values(this.categories).flat();
    const alreadyExists = allTags.some(tag => tag.toLowerCase() === trimmed.toLowerCase());

    if (trimmed && !alreadyExists) {
      this.categories[this.selectedCategoryId] = [...this.selectedCategoryTags, trimmed];
      this.updateService();
    }

    this.newValue = '';
  }

  getTags(key: string): string[] {
    const value = this.app_service.getConfig().localSettings.entityfilterCategories[key];
    return value ?? [];
  }

  removeTag(categoryId: string, tag: string): void {
    const value = this.app_service.getConfig().localSettings.entityfilterCategories[categoryId];
    if (Array.isArray(value)) {
      this.app_service.getConfig().localSettings.entityfilterCategories[categoryId] = value.filter(t => t !== tag);
    } else if (value === tag) {
      delete this.app_service.getConfig().localSettings.entityfilterCategories[categoryId];
    }
    this.app_service.set('entityfilterCategories', this.app_service.getConfig().localSettings.entityfilterCategories);
    this.searchFiltersChange.emit();
  }

  clearSelection() {
    Object.keys(this.categories).forEach(key => this.categories[key] = []);
    this.updateService();
  }

  private updateService() {
    this.app_service.set('entityfilterCategories', this.categories);
  }

  toggleExpand() {
    this.app_service.set('iocExpanded', !this.app_service.configData().localSettings.iocExpanded);
  }

  onEntityFilterToggle(newValue: boolean): void {
    this.app_service.set('entityFilterCondition', newValue);
  }

  hasAnyTags(): boolean {
    return Object.values(this.categories).some(tags => tags.length > 0);
  }

  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  initCategories(query: string): void {
    const queryLower = query.toLowerCase();

    if (queryLower === '') {
      const allKeys = Object.keys(this.categories);

      const sortedKeys = allKeys.sort(
        (a, b) => this.getTags(b).length - this.getTags(a).length
      );
      if (!this.selectedCategoryId && sortedKeys.length > 0) {
        this.selectedCategoryId = sortedKeys[0];
      }

      this.filteredCategories = sortedKeys.map(key => ({
        id: key,
        name: search_filter_labels[key] || key,
        tags: this.getTags(key).map(val => ({
          id: `${key}-${val}`,
          value: val,
          type: key
        }))
      }));
    }
    else {
      const matchedKeys = Object.keys(this.categories).filter(categoryKey =>
        (search_filter_labels[categoryKey] || categoryKey).toLowerCase().includes(queryLower)
      );
      if (!this.selectedCategoryId || !matchedKeys.includes(this.selectedCategoryId)) {
        this.selectedCategoryId = matchedKeys[0] || '';
      }

      const selected = this.selectedCategoryId;
      const rest = matchedKeys.filter(k => k !== selected);

      const sortedRest = rest.sort(
        (a, b) => this.getTags(b).length - this.getTags(a).length
      );

      const sortedKeys = matchedKeys.includes(selected)
        ? [selected, ...sortedRest]
        : sortedRest;

      this.filteredCategories = sortedKeys.map(key => ({
        id: key,
        name: search_filter_labels[key] || key,
        tags: this.getTags(key).map(val => ({
          id: `${key}-${val}`,
          value: val,
          type: key
        }))
      }));
    }
  }
}
