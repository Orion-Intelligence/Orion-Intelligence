import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multiple-selection',
  imports: [CommonModule],
  templateUrl: './multiple-selection.component.html',
})
export class MultipleSelectionComponent {
  @Input() key: string = '';
  @Input() filterModel: any;
  @Output() selectedFiltersChange = new EventEmitter<{ key: string; value: string }>();

  mSelectedFilters: { [key: string]: string[] } = {};


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

    // Optional: Clone array to trigger change detection
    this.mSelectedFilters[this.key] = [...this.mSelectedFilters[this.key]];

    // Emit joined string as value
    this.selectedFiltersChange.emit({
      key: this.key,
      value: this.mSelectedFilters[this.key].join(','),
    });
  }

  getMultiSelectedText(): string {
    const selected = this.mSelectedFilters[this.key];
    return selected && selected.length > 0
      ? selected.join(', ')
      : 'Select ' + this.filterModel?.filters[this.key]?.title;
  }
}
