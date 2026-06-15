import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SelectedCountryCategoryCount } from '../../../models/geo-fencing.models';
import { ThreatLensArcBatchStatus } from '../../models/threat-lens-map.types';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-threat-lens-summary-panel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './threat-lens-summary-panel.component.html',
})
export class ThreatLensSummaryPanelComponent {
  collapsed = false;

  @Input() selectedCountryName = '';
  @Input() selectedCountryBreakdown: SelectedCountryCategoryCount[] = [];
  @Input() isLoading = false;
  @Input() statusMessage = '';
  @Input() arcCount = 0;
  @Input() arcBatchStatus: ThreatLensArcBatchStatus | null = null;
  @Input() isIpScanRunning = false;
  @Input() ipScanErrorMessage: string | null = null;
  @Input() ipScanScopeLabel = '';
  @Input() ipScanResultCount = 0;
  @Input() ipScanRangeLabel = '';
  @Input() ipScanStatusMessage = '';
  @Input() hasIpScanResult = false;
  @Input() hasIpScanCompleted = false;
  @Input() ipScanProgress: number | null = null;

  get arcBatchStatusText(): string {
    if (!this.arcBatchStatus || !this.arcBatchStatus.visibleCount) {
      return 'No arcs visible for the selected range.';
    }

    return `Showing ${this.arcBatchStatus.categoryLabel} arcs ${this.arcBatchStatus.start}-${this.arcBatchStatus.end} of ${this.arcBatchStatus.categoryArcCount}`;
  }

  get showIpScanPanel(): boolean {
    return this.isIpScanRunning || this.hasIpScanResult || this.hasIpScanCompleted || Boolean(this.ipScanErrorMessage);
  }

  get ipScanStateLabel(): string {
    if (this.ipScanErrorMessage) {
      return 'Error';
    }
    if (this.isIpScanRunning) {
      return this.ipScanProgress !== null ? `${this.ipScanProgress}%` : 'Scanning';
    }
    if (this.hasIpScanResult) {
      return 'Ready';
    }
    if (this.hasIpScanCompleted) {
      return 'Complete';
    }
    return 'Idle';
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
}
