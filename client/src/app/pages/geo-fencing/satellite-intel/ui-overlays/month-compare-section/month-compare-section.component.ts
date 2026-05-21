import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SATELLITE_IMAGE_TYPES, SatelliteImageType } from '../../../../../shared/model/satellite-intel/satellite-intel.model';
import { SatelliteCompareResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-month-compare',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './month-compare-section.component.html',
})
export class MonthCompareSectionComponent {
  readonly imageTypes: SatelliteImageType[] = SATELLITE_IMAGE_TYPES;
  selectedType = 'true_colour';
  lightboxSrc:   string | null = null;
  lightboxLabel  = '';
  brokenImages = new Set<string>();

  @Input() isScanning       = false;
  @Input() errorMessage:     string | null = null;
  @Input() hasSearched      = false;
  @Input() compareResult:   SatelliteCompareResponse['result'] | null = null;

  @Output() runCompare = new EventEmitter<{ imageType: string }>();

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.compareResult && !this.errorMessage && this.isScanning;
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
    return relativeUrl;
  }
}
