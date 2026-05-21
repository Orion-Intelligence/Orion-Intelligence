import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SatelliteSentinelPass } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-sentinel-search',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './sentinel-search-section.component.html',
})
export class SentinelSearchSectionComponent {
  @Input() isScanning      = false;
  @Input() errorMessage:   string | null = null;
  @Input() hasSearched     = false;
  @Input() sentinelResults: SatelliteSentinelPass[] | null = null;

  @Output() runSearch      = new EventEmitter<void>();

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.sentinelResults && !this.errorMessage && this.isScanning;
  }

  get groupedByMonth(): { month: string; monthKey: string; items: SatelliteSentinelPass[] }[] {
    if (!this.sentinelResults) {
      return []; 
    }
    const map = new Map<string, { month: string; monthKey: string; items: SatelliteSentinelPass[] }>();
    for (const item of this.sentinelResults) {
      if (!map.has(item.month_key)) {
        map.set(item.month_key, { month: item.month, monthKey: item.month_key, items: [] });
      }
        map.get(item.month_key)!.items.push(item);
    }
    return Array.from(map.values());
  }
}
