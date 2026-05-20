import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../../../shared/animations/dashboard.item.animation';
import { SATELLITE_IMAGE_TYPES, SatelliteImageType } from '../../../../../shared/model/satellite-intel/satellite-intel.model';
import { SatelliteSentinelImageResult } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-sentinel-image',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './sentinel-image-section.component.html',
  animations:  [fadeInDashboardItem],
})
export class SentinelImageSectionComponent {
  readonly imageTypes: SatelliteImageType[] = SATELLITE_IMAGE_TYPES;
  selectedType = 'true_colour';
  selectedMonth = '';
  imageSize = 512;
  lightboxSrc: string | null = null;

  @Input() isScanning      = false;
  @Input() useMainLoading  = false;
  @Input() progress        = 0;
  @Input() currentStep     = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:   string | null = null;
  @Input() hasSearched     = false;
  @Input() imageResult:    SatelliteSentinelImageResult | null = null;

  @Output() runFetch = new EventEmitter<{ imageType: string; month: string; size: number }>();

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Fetching Sentinel image...';
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for availability...';
    }
    return raw;
  }

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.imageResult && !this.errorMessage && (this.isScanning || this.progress > 0);
  }

  get imageSrc(): string | null {
    const result = this.imageResult;
    if (!result) {
      return null;
    }
    const direct = result.image_url || result.data_url;
    if (typeof direct === 'string' && direct.trim()) {
      return direct;
    }
    const base64 = result['image_b64'];
    if (typeof base64 === 'string' && base64.trim()) {
      const mime = result.mime_type || result.content_type || 'image/png';
      return `data:${mime};base64,${base64}`;
    }
    return null;
  }

  get detailEntries(): { label: string; value: string }[] {
    const result = this.imageResult;
    if (!result) {
      return [];
    }
    const entries: { label: string; value: string }[] = [];
    if (typeof result.month === 'string' && result.month.trim()) {
      entries.push({ label: 'Month', value: result.month });
    }
    if (typeof result.image_type === 'string' && result.image_type.trim()) {
      entries.push({ label: 'Image type', value: result.image_type });
    }
    if (typeof result.size === 'number') {
      entries.push({ label: 'Image size', value: `${result.size}px` });
    }
    if (typeof result.lat === 'number' && typeof result.lon === 'number') {
      entries.push({ label: 'Coordinates', value: `${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}` });
    }
    if (typeof result.delta === 'number') {
      entries.push({ label: 'Delta', value: `${result.delta}` });
    }
    return entries;
  }

  selectType(key: string): void {
    this.selectedType = key;
  }

  onRunFetch(): void {
    this.runFetch.emit({
      imageType: this.selectedType,
      month: this.selectedMonth.trim(),
      size: this.imageSize,
    });
  }

  openLightbox(): void {
    if (this.imageSrc) {
      this.lightboxSrc = this.imageSrc;
    }
  }

  closeLightbox(): void {
    this.lightboxSrc = null;
  }
}
