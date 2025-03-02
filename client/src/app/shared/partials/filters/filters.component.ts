import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FilterModel} from '../../model/filter/filter';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, NgOptimizedImage],
})
export class FiltersComponent implements OnInit {
  @Input() filterModel!: FilterModel;
  @Output() filterChanged = new EventEmitter<{ [key: string]: string | null }>();
  @Output() filterReset = new EventEmitter<void>();
  @Output() filterClose = new EventEmitter<void>();

  selectedFilters: { [key: string]: string | null } = {};

  ngOnInit() {
    this.initializeFilters();
  }

  /**
   * Initialize selectedFilters with placeholder text to ensure it appears when closed.
   */
  private initializeFilters() {
    this.selectedFilters = Object.keys(this.filterModel.filters)
      .reduce((acc, key) => ({
        ...acc,
        [key]: `Select ${this.filterModel.filters[key].title}`, // Set placeholder as default value
      }), {});
  }

  /**
   * Update selection but keep placeholder for display purposes.
   */
  onSelectionChange(key: string, value: string) {
    this.selectedFilters[key] = value !== `Select ${this.filterModel.filters[key].title}` ? value : null;
  }

  /**
   * Apply the selected filters and emit the event.
   */
  applyFilters() {
    this.filterChanged.emit({...this.selectedFilters});
  }

  closeFilter() {
    this.filterClose.emit();
  }

  /**
   * Reset filters and restore placeholder text.
   */
  resetFilters() {
    this.initializeFilters();
    this.filterReset.emit();
  }

  protected readonly Object = Object;
}
