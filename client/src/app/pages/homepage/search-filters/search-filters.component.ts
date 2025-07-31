import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter, HostListener, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterCategory } from '../../../shared/model/filter/filter.model';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
import { SettingsService } from '../../../services/settings/settings.service';
import { search_filter_keys } from '../../../shared/constants/shared-enums';

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

  ngOnInit(): void {
    const defaultCategories = Array.from(search_filter_keys).map((key) => {
      const formattedName = key
        .replace(/^m_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());

      return {
        id: key,
        name: formattedName,
        tags: []
      };
    });

    this.iocExpanded = this.settingsService.get('iocExpanded', true) ?? true;
    this.entityFilterService.initializeFilterCategories(defaultCategories);

    this.categories = this.entityFilterService.getCurrentFilterCategories();
    const savedCategoryId = this.entityFilterService.getCurrentSelectedCategoryId();
    if (!savedCategoryId || savedCategoryId === 'selected') {
      this.selectedCategoryIndex = 0;
    } else {
      const index = this.categories.findIndex(cat => cat.id === savedCategoryId);
      this.selectedCategoryIndex = index !== -1 ? index : 0;
    }
  }
  ngAfterViewInit() {
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

  private updateService() {
    this.entityFilterService.updateFilterCategories(this.categories);
    this.entityFilterService.updateSelectedCategoryId(this.selectedCategory.id);
  }

  toggleExpand() {
    this.iocExpanded = !this.iocExpanded;
    this.settingsService.set('iocExpanded', this.iocExpanded);
  }

  hasAnyTags(): boolean {
    return this.categories.some(category => category.tags.length > 0);
  }

  onCategoryClick(index: number, categoryId: string): void {
    this.selectedCategoryIndex = index;
    this.entityFilterService.updateSelectedCategoryId(categoryId);
  }
}
