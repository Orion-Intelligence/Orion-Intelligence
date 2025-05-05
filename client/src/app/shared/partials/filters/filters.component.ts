import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter.model';
import { filterAnimation } from '../../animations/filter.animation';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, NgOptimizedImage, TooltipDirective],
  animations: [filterAnimation]
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
    this.selectedFilters = Object.keys(this.filterModel.filters).reduce((acc, key) => {
      const selected = (this.filterModel.filters as any)[key].selected || null;
      return {
        ...acc,
        [key]: selected
      };
    }, {});
  }

  onSelectionChange(key: string, value: string) {
    this.selectedFilters[key] = value;
  }

  applyFilters() {
    this.filterChanged.emit({ ...this.selectedFilters });
    this.closeFilter();
  }

  closeFilter() {
    this.filterClose.emit();
  }

  resetFilters() {
    this.selectedFilters = {}
    this.filterReset.emit();
    this.closeFilter();
  }

  protected readonly Object = Object;
}
