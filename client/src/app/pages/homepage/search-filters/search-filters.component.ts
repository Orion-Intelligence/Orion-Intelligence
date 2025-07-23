import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterTag, FilterCategory } from '../../../shared/model/filter/filter.model';
import { debounceTime, distinctUntilChanged, fromEvent, Subject, takeUntil } from 'rxjs';
import { EntityFilterService } from '../../../services/entityFilter/entity.filter.service';
@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-filters.component.html'
})
export class SearchFiltersComponent implements OnInit, AfterViewInit, OnDestroy {

  @Output() searchFiltersChange = new EventEmitter<void>();
  searchQuery: string = '';
  addedFilter: string = '';



  @ViewChild('selectedFilterTagsScrollContainer') selectedFilterTagsScrollContainer!: ElementRef<HTMLDivElement>;

  showLeftArrow: boolean = false;
  showRightArrow: boolean = false;

  private destroy$ = new Subject<void>();

  selectedCategoryId: string = 'email';
  filterCategories: FilterCategory[] = [];

  maxFiltersPerCategory: number = 9;

  get currentEntityFilterTags(): FilterTag[] {
    const selectedCategory = this.filterCategories.find(cat => cat.id === this.selectedCategoryId);
    return selectedCategory ? [...selectedCategory.tags].sort((a, b) => a.value.localeCompare(b.value)) : [];
  }

  constructor(private entityFilterService: EntityFilterService) { }

  ngOnInit(): void {

    this.entityFilterService.filterCategories$.pipe(takeUntil(this.destroy$)).subscribe(categories => {

      if (categories && categories.length > 0) {
        this.filterCategories = categories;
      } else {
        this.initializeFilterCategories();
        this.entityFilterService.updateFilterCategories(this.filterCategories);
      }
    });

    this.entityFilterService.selectedCategoryId$.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.selectedCategoryId = id;
    });

  }

  ngAfterViewInit(): void {
    if (this.selectedFilterTagsScrollContainer) {

      this.checkSelectedTagsScroll();
      this.applyBlurEffect();

      fromEvent(this.selectedFilterTagsScrollContainer.nativeElement, 'scroll')
        .pipe(
          debounceTime(10),
          distinctUntilChanged((prev, curr) => (prev.target as HTMLElement)?.scrollLeft === (curr.target as HTMLElement)?.scrollLeft),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.checkSelectedTagsScroll();
          this.applyBlurEffect();
        });

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(100),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.checkSelectedTagsScroll();
          this.applyBlurEffect();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentEntityFilter(searchText: string = '', searchAllCategories: boolean = false): FilterTag[] {
    let tagsToSearch: FilterTag[] = [];

    if (searchAllCategories) {
      this.filterCategories.forEach(category => {
        tagsToSearch.push(...category.tags);
      });
    } else {
      const selectedCategory = this.filterCategories.find(
        cat => cat.id === this.selectedCategoryId
      );
      if (selectedCategory) {
        tagsToSearch = [...selectedCategory.tags];
      }
    }

    const filteredTags = tagsToSearch.filter(tag =>
      tag.value.toLowerCase().includes(searchText.toLowerCase())
    );

    return filteredTags.sort((a, b) => a.value.localeCompare(b.value));
  }

  private initializeFilterCategories(): void {
    this.filterCategories = [
      { id: 'email', name: 'Email', tags: [] },
      { id: 'country', name: 'Country', tags: [] },
      { id: 'hashes', name: 'Hashes', tags: [] },
    ];
  }

  onSearchSubmit(): void {
    const value = this.addedFilter.trim();
    if (!value) {
      return;
    }

    const filterType = this.selectedCategoryId;

    const newFilter: FilterTag = {
      id: `${filterType}-${value.replace(/\s/g, '-')}-${Date.now()}`,
      value: value,
      type: filterType
    };

    const targetCategory = this.filterCategories.find(cat => cat.id === newFilter.type);

    const existsInCategory = targetCategory?.tags.some(t => t.value === newFilter.value && t.type === newFilter.type);


    if (targetCategory && targetCategory.tags.length >= this.maxFiltersPerCategory) {
      console.warn(`Category "${targetCategory.name}" has reached its maximum of ${this.maxFiltersPerCategory} filters.`);
      return;
    }

    this.addFilterToCategory(newFilter);

    this.entityFilterService.updateFilterCategories(this.filterCategories);
    this.searchFiltersChange.emit();
    this.searchQuery = '';
    this.addedFilter = '';
  }

  private addFilterToCategory(filterTag: FilterTag): void {
    const category = this.filterCategories.find(cat => cat.id === filterTag.type);
    if (category && category.tags.length < this.maxFiltersPerCategory && !category.tags.some(t => t.id === filterTag.id)) {
      category.tags.push(filterTag);
    }
  }

  removeSelectedFilter(filterId: string): void {
    const category = this.filterCategories.find(cat =>
      cat.tags.some(tag => tag.id === filterId)
    );

    if (category) {
      category.tags = category.tags.filter(tag => tag.id !== filterId);


      this.entityFilterService.updateFilterCategories(this.filterCategories);

      this.checkSelectedTagsScroll();
      this.applyBlurEffect();
    }
    this.searchFiltersChange.emit();
  }

  clearAllSelectedFilters(): void {
    this.searchQuery = '';

    this.filterCategories.forEach(category => {
      category.tags = [];
    });

    this.entityFilterService.updateFilterCategories(this.filterCategories);
    this.entityFilterService.updateSelectedCategoryId('email');

    this.checkSelectedTagsScroll();
    this.applyBlurEffect();
    this.searchFiltersChange.emit();
  }

  checkSelectedTagsScroll(): void {
    if (!this.selectedFilterTagsScrollContainer) return;

    const container = this.selectedFilterTagsScrollContainer.nativeElement;
    const scrollTolerance = 5;

    this.showLeftArrow = container.scrollWidth > container.clientWidth &&
      (container.scrollLeft + container.clientWidth) < (container.scrollWidth - scrollTolerance);
    this.showRightArrow = container.scrollWidth > container.clientWidth &&
      (container.scrollLeft + container.clientWidth) < (container.scrollWidth - scrollTolerance);
  }

  scrollSelectedTags(direction: 'left' | 'right'): void {
    if (!this.selectedFilterTagsScrollContainer) return;
    const container = this.selectedFilterTagsScrollContainer.nativeElement;
    const scrollAmount = 150;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  applyBlurEffect(): void {
    if (!this.selectedFilterTagsScrollContainer) return;

    const container = this.selectedFilterTagsScrollContainer.nativeElement;
    const scrollTolerance = 5;
    const atStart = container.scrollLeft <= scrollTolerance;
    const atEnd = (container.scrollWidth - container.clientWidth) - container.scrollLeft <= scrollTolerance;
    const hasScroll = container.scrollWidth > container.clientWidth;

    container.classList.remove('scrolled-left', 'scrolled-right', 'scrolled-both');

    if (hasScroll) {
      if (!atStart && !atEnd) {
        container.classList.add('scrolled-both');
      } else if (!atStart) {
        container.classList.add('scrolled-left');
      } else if (!atEnd) {
        container.classList.add('scrolled-right');
      }
    }
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.entityFilterService.updateSelectedCategoryId(categoryId);
  }

  filterTrackBy(index: number, filter: FilterTag): string {
    return filter.id;
  }

  categoryTrackBy(index: number, category: FilterCategory): string {
    return category.id;
  }

}