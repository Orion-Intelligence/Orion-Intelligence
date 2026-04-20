import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { SatelliteAnomalyResponse } from '../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-anomaly-section',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './anomaly-section.component.html',
  animations:  [fadeInDashboardItem],
})
export class AnomalySectionComponent {
  @Input() isScanning      = false;
  @Input() progress        = 0;
  @Input() currentStep     = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:   string | null = null;
  @Input() hasSearched     = false;
  @Input() anomalyResult:  SatelliteAnomalyResponse['result'] | null = null;

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Analysing NDVI data...'; 
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for availability...'; 
    }
    return raw;
  }

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.anomalyResult && !this.errorMessage && (this.isScanning || this.progress > 0);
  }

  get alertClass(): string {
    const level = this.anomalyResult?.alert_level;
    if (level === 'critical') {
      return 'border-rose-500/50 bg-rose-500/8'; 
    }
    if (level === 'warning')  {
      return 'border-amber-400/50 bg-amber-400/8'; 
    }
    if (level === 'nominal')  {
      return 'border-emerald-400/50 bg-emerald-400/8'; 
    }
    return 'border-[var(--color-border)] bg-[var(--color-blue-720)]';
  }

  get alertTextClass(): string {
    const level = this.anomalyResult?.alert_level;
    if (level === 'critical') {
      return 'text-rose-400'; 
    }
    if (level === 'warning')  {
      return 'text-amber-400'; 
    }
    if (level === 'nominal')  {
      return 'text-emerald-400'; 
    }
    return 'text-[var(--color-text3)]';
  }

  get alertBadgeClass(): string {
    const level = this.anomalyResult?.alert_level;
    if (level === 'critical') {
      return 'bg-rose-500/15 border-rose-500/30 text-rose-400'; 
    }
    if (level === 'warning')  {
      return 'bg-amber-400/15 border-amber-400/30 text-amber-400'; 
    }
    if (level === 'nominal')  {
      return 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'; 
    }
    return 'bg-[var(--color-blue-720)] border-[var(--color-border)] text-[var(--color-text3)]';
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }
}
