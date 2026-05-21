import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SatelliteAnomalyResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';

@Component({
  selector:    'app-satellite-anomaly-section',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './anomaly-section.component.html',
})
export class AnomalySectionComponent {
  @Input() anomalyResult:  SatelliteAnomalyResponse['result'] | null = null;

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
}
