import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { SATELLITE_IMAGE_TYPES, SatelliteImageType } from '../../../shared/model/satellite-intel/satellite-intel.model';
import { SatelliteCompareResponse } from '../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-month-compare',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './month-compare-section.component.html',
  animations:  [fadeInDashboardItem],
})
export class MonthCompareSectionComponent {
  readonly imageTypes: SatelliteImageType[] = SATELLITE_IMAGE_TYPES;
  selectedType = 'true_colour';
  lightboxSrc:   string | null = null;
  lightboxLabel  = '';
  brokenImages = new Set<string>();

  @Input() isScanning       = false;
  @Input() progress         = 0;
  @Input() currentStep      = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:     string | null = null;
  @Input() hasSearched      = false;
  @Input() compareResult:   SatelliteCompareResponse['result'] | null = null;

  @Output() runCompare = new EventEmitter<{ imageType: string }>();

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Loading comparison images...'; 
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for availability...'; 
    }
    return raw;
  }

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.compareResult && !this.errorMessage && (this.isScanning || this.progress > 0);
  }

  selectType(key: string): void {
    this.selectedType = key; 
  }

  onRunCompare(): void {
    this.runCompare.emit({ imageType: this.selectedType }); 
  }

  openLightbox(url: string, label: string): void {
    this.lightboxSrc   = url;
    this.lightboxLabel = label;
  }

  closeLightbox(): void {
    this.lightboxSrc = null; 
  }

  markImageBroken(url: string): void {
    this.brokenImages.add(url);
  }

  canRenderImage(url: string): boolean {
    return !this.brokenImages.has(url);
  }

  imageApiUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl; 
    }
    // The Angular dev proxy forwards /satellite/* to the backend — use relative path
    return relativeUrl;
  }
}
