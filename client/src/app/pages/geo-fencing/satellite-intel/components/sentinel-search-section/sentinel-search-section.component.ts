import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { fadeInDashboardItem } from '../../../../../shared/animations/dashboard.item.animation';
import { SatelliteSentinelPass } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-sentinel-search',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './sentinel-search-section.component.html',
  animations:  [fadeInDashboardItem],
})
export class SentinelSearchSectionComponent {
  @Input() isScanning      = false;
  @Input() useMainLoading  = false;
  @Input() progress        = 0;
  @Input() currentStep     = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:   string | null = null;
  @Input() hasSearched     = false;
  @Input() sentinelResults: SatelliteSentinelPass[] | null = null;

  @Output() runSearch      = new EventEmitter<void>();

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Checking Sentinel passes...'; 
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for availability...'; 
    }
    return raw;
  }

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.sentinelResults && !this.errorMessage && (this.isScanning || this.progress > 0);
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

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }
}
