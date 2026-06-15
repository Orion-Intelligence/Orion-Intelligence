import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThreatCountryCount, ThreatLensCategoryModelKey, ThreatLensLegendItem } from '../../../models/geo-fencing.models';
import { ThreatLensArcBatchStatus } from '../../models/threat-lens-map.types';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

export interface ThreatLensArcRangeOption {
  index: number;
  label: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-threat-lens-country-search-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './threat-lens-country-search-panel.component.html',
})
export class ThreatLensCountrySearchPanelComponent {
  collapsed = false;
  searchTerm = '';
  currentQuery = '';

  @Input() isLoading = false;
  @Input() topCountries: ThreatCountryCount[] = [];
  @Input() categoryLegend: ThreatLensLegendItem[] = [];
  @Input() selectedArcCategoryKey!: ThreatLensCategoryModelKey;
  @Input() arcBatchSize = 10;
  @Input() arcBatchSizeOptions: number[] = [];
  @Input() selectedArcRangeIndex = 0;
  @Input() arcRangeOptions: ThreatLensArcRangeOption[] = [];
  @Input() arcBatchStatus: ThreatLensArcBatchStatus | null = null;

  @Output() search = new EventEmitter<string>();
  @Output() topCountrySelect = new EventEmitter<string>();
  @Output() arcCategorySelect = new EventEmitter<ThreatLensCategoryModelKey>();
  @Output() arcBatchSizeChange = new EventEmitter<number | string>();
  @Output() arcRangeChange = new EventEmitter<number | string>();

  get arcBatchStatusText(): string {
    if (!this.arcBatchStatus || !this.arcBatchStatus.visibleCount) {
      return 'No arcs visible for the selected range.';
    }

    return `Showing ${this.arcBatchStatus.categoryLabel} arcs ${this.arcBatchStatus.start}-${this.arcBatchStatus.end} of ${this.arcBatchStatus.categoryArcCount}`;
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
  }

  onSearch(): void {
    const query = this.searchTerm.trim();
    this.currentQuery = query;
    this.search.emit(query);
  }

  onTopCountrySelect(country: string): void {
    this.searchTerm = country;
    this.currentQuery = country;
    this.topCountrySelect.emit(country);
  }
}
