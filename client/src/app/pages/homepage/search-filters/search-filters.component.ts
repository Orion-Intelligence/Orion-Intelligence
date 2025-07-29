import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterTag, FilterCategory } from '../../../shared/model/filter/filter.model';
import { debounceTime, distinctUntilChanged, fromEvent, Subject, takeUntil } from 'rxjs';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
import { SettingsService } from '../../../services/settings/settings.service';
@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-filters.component.html'
})
export class SearchFiltersComponent {
  @Input() showSorting!: boolean;
  @Output() searchFiltersChange = new EventEmitter<void>();
  categories: FilterCategory[] = [];

  selectedCategoryIndex = 0;
  newValue = '';
  iocExpanded: boolean = true;
  entityFilterCondition: boolean = false;
  @ViewChild('categoryScroll', { static: true }) categoryScroll!: ElementRef;

  showLeftFade = false;
  showRightFade = false;
  constructor(private entityFilterService: EntityFilterService, private settingsService: SettingsService) {
  }
  get selectedCategory(): FilterCategory {
    return this.categories[this.selectedCategoryIndex];
  }

  ngAfterViewInit() {
    const defaultCategories: FilterCategory[] = [
      { id: 'email', name: 'Email', tags: [] },
      { id: 'name', name: 'Name', tags: [] },
      { id: 'content', name: 'Content', tags: [] },
      { id: 'address', name: 'Address', tags: [] },
      { id: 'city', name: 'City', tags: [] },
      { id: 'country', name: 'Country', tags: [] },
      { id: 'banks', name: 'Banks', tags: [] },
      { id: 'company', name: 'Company', tags: [] },
      { id: 'transactions', name: 'Transactions', tags: [] },
      { id: 'article', name: 'Article', tags: [] },
      { id: 'email', name: 'Email', tags: [] },
      { id: 'name', name: 'Name', tags: [] },
      { id: 'content', name: 'Content', tags: [] },
      { id: 'address', name: 'Address', tags: [] },
      { id: 'city', name: 'City', tags: [] },
      { id: 'country', name: 'Country', tags: [] },
      { id: 'banks', name: 'Banks', tags: [] },
      { id: 'company', name: 'Company', tags: [] },
      { id: 'transactions', name: 'Transactions', tags: [] },
      { id: 'article', name: 'Article', tags: [] },
    ];

    this.iocExpanded = this.settingsService.get('iocExpanded', true) ?? true;
    this.entityFilterService.initializeFilterCategories(defaultCategories);

    this.categories = this.entityFilterService.getCurrentFilterCategories();
    const savedCategoryId = this.entityFilterService.getCurrentSelectedCategoryId();
    this.selectedCategoryIndex = this.categories.findIndex(cat => cat.id === savedCategoryId) || 0;
    setTimeout(() => this.updateFadeVisibility(), 300);
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

  resetCategorySelection() {
    this.selectedCategory.tags = [];
    this.updateService();
  }
  private updateService() {
    this.entityFilterService.updateFilterCategories(this.categories);
    this.entityFilterService.updateSelectedCategoryId(this.selectedCategory.id);
  }

  toggleExpand() {
    this.iocExpanded = !this.iocExpanded;
    this.settingsService.set('iocExpanded', this.iocExpanded);
  }
  toggleEntityCondition() {
    this.entityFilterCondition = !this.entityFilterCondition;
  }
  hasAnyTags(): boolean {
    return this.categories.some(category => category.tags.length > 0);
  }
  get allSelectedTags(): FilterTag[] {
    return this.categories.flatMap(c => c.tags);
  }

}