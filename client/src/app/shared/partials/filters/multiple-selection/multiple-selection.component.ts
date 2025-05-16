import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-multiple-selection',
  imports: [CommonModule],
  templateUrl: './multiple-selection.component.html',
})
export class MultipleSelectionComponent {
  @Input() key: string = '';
  @Input() filterModel: any;
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

  formatOptionLabel(value: string): string {
    if (!value) return '';
    return value
      .replace(/[_-]/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getMultiSelectedText(): string {
    const selected = this.mSelectedFilters[this.key];
    return selected && selected.length > 0
      ? selected.join(', ')
      : 'Select ' + this.filterModel?.filters[this.key]?.title;
  }
}
