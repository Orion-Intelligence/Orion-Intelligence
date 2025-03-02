import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter';
import { last } from 'rxjs';
import { fadeAnimation } from '../../animations/animations';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, NgOptimizedImage],
  animations: [fadeAnimation]
})
export class FiltersComponent implements OnInit {
  @Input() filterModel!: FilterModel;
  @Input() isFilterOpen!: boolean | null;
  @Output() filterChanged = new EventEmitter<{ [key: string]: string | null }>();
  @Output() filterReset = new EventEmitter<void>();
  @Output() filterClose = new EventEmitter<void>();

  selectedFilters: { [key: string]: string | null } = {};

  ngOnInit() {
    this.initializeFilters();
  }

  private initializeFilters() {
    this.selectedFilters = Object.keys(this.filterModel.filters)
      .reduce((acc, key) => ({
        ...acc,
        [key]: null,
      }), {});
  }

  onSelectionChange(key: string, value: string) {
    this.selectedFilters[key] = value;
  }

  applyFilters() {
    this.filterChanged.emit({ ...this.selectedFilters });
    this.closeFilter()
  }

  closeFilter() {
    this.filterClose.emit();
  }

  resetFilters() {
    this.closeFilter()
    this.initializeFilters();
    this.filterReset.emit();
  }

  protected readonly Object = Object;
  protected readonly last = last;
}
