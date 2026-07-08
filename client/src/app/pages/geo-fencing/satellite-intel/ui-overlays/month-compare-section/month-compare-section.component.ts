import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SATELLITE_IMAGE_TYPES, SatelliteImageType } from '../../../../../shared/model/satellite-intel/satellite-intel.model';
import { SatelliteAnomalyResponse, SatelliteCompareResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector:    'app-satellite-month-compare',
  standalone:  true,
  imports:     [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './month-compare-section.component.html',
})
export class MonthCompareSectionComponent {
  readonly imageTypes: SatelliteImageType[] = SATELLITE_IMAGE_TYPES;
  selectedType = 'true_colour';
  selectedMonth = this.currentDateKey();
  isAdvancedOpen = false;
  lightboxSrc:   string | null = null;
  lightboxLabel  = '';
  brokenImages = new Set<string>();

  @Input() isScanning       = false;
  @Input() errorMessage:     string | null = null;
  @Input() hasSearched      = false;
  @Input() compareResult:   SatelliteCompareResponse['result'] | null = null;
  @Input() anomalyResult:   SatelliteAnomalyResponse['result'] | null = null;
  @Input() locationLabel = '';

  @Output() runCompare = new EventEmitter<{ imageType: string; month: string }>();
  @Output() locationOpened = new EventEmitter<void>();

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.compareResult && !this.errorMessage && this.isScanning;
  }

  get anomalyAlertClass(): string {
    const level = this.anomalyResult?.alert_level;
    if (level === 'critical') {
      return 'text-rose-300';
    }
    if (level === 'warning') {
      return 'text-amber-300';
    }
    if (level === 'nominal') {
      return 'text-emerald-300';
    }
    return 'text-sky-300';
  }

  selectType(key: string): void {
    this.selectedType = key;
  }

  onRunCompare(): void {
    const selectedDate = this.selectedMonth.trim();
    this.runCompare.emit({ imageType: this.selectedType, month: selectedDate.slice(0, 7) });
  }

  resetMonth(): void {
    this.selectedMonth = this.currentDateKey();
  }

  toggleAdvanced(): void {
    this.isAdvancedOpen = !this.isAdvancedOpen;
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
    return relativeUrl;
  }

  private currentDateKey(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
