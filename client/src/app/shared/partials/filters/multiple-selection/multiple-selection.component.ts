import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterModel } from '../../../model/filter/filter.model';

@Component({
  selector: 'app-multiple-selection',
  imports: [CommonModule],
  templateUrl: './multiple-selection.component.html',
})
export class MultipleSelectionComponent {
  @Input() key = '';
  @Input() filterModel!: FilterModel;
  @Output() selectedFiltersChange = new EventEmitter<{ key: string; value: string }>();
  @Input() mSelectedFilters: any


  onMultiSelectionToggle(option: string): void {
    if (!this.mSelectedFilters[this.key]) {
      this.mSelectedFilters[this.key] = [];
    }

    const index = this.mSelectedFilters[this.key].indexOf(option);
    if (index === -1) {
      this.mSelectedFilters[this.key].push(option);
    } else {
      this.mSelectedFilters[this.key].splice(index, 1);
    }

    this.mSelectedFilters[this.key] = [...this.mSelectedFilters[this.key]];
  }

  getOptionLabel(): string {
    const selectedValue = this.mSelectedFilters[this.key];
    if (!selectedValue) return 'Select ' + this.filterModel.filters[this.key].title;

    const options = this.filterModel.filters[this.key].options ?? [];

    const labels = options
      .filter((fpt: { key: string; }) => selectedValue.indexOf(fpt.key) !== -1)
      .map((mpt: { label: string; }) => mpt.label);

    if (labels.length === 0) {
      return 'Select ' + this.filterModel.filters[this.key].title;
    }

    return labels.join(', ');
  }
}
