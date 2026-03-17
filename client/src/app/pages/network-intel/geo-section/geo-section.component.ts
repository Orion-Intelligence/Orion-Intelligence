import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { GeoFeedComponent } from '../geo-feed/geo-feed.component';
import { GeoLiveStats, GeoResult } from '../../../shared/model/network-intel/network-intel.model';

@Component({
  selector: 'app-network-intel-geo-section',
  standalone: true,
  imports: [CommonModule, GeoFeedComponent],
  templateUrl: './geo-section.component.html',
})
export class GeoSectionComponent {
  @Input() isScanning = false;
  @Input() progress = 0;
  @Input() currentStep = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() hasSearched = false;
  @Input() geoResult: GeoResult | null = null;
  @Input() geoLiveStats: GeoLiveStats | null = null;

  constructor(private router: Router) {}

  get isEmbeddedInConsolidated(): boolean {
    return this.router.url.includes('/consolidated');
  }

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Scanning in progress...';
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for scanner availability...';
    }
    return raw;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }
}
