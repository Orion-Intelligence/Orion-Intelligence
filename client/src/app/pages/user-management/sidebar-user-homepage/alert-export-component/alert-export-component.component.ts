import { CommonModule, UpperCasePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';

import { AlertModel } from '../../../../shared/model/company-profile/node.model';
type AlertStatusClass = 'alert-active' | 'alert-ignore' | 'alert-info';
type AlertRiskClass = 'risk-critical' | 'risk-high' | 'risk-medium' | 'risk-low' | 'risk-unknown';
@Component({
  selector: 'app-alert-export-component',
  imports: [CommonModule, UpperCasePipe, NgClass],
  templateUrl: './alert-export-component.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertExportComponentComponent {
  readonly alertsInput = input<AlertModel | AlertModel[] | null>(null, { alias: 'alerts' });
  viewAlerts: AlertModel[] = [];

  constructor() {
    effect(() => {
      const alerts = this.alertsInput();
      this.viewAlerts = Array.isArray(alerts)
        ? alerts
        : alerts
          ? [alerts]
          : [];
    });
  }

  get printedNow(): string {
    return new Date().toLocaleString();
  }

  statusClass(status?: AlertModel['status']): AlertStatusClass {
    if (status === 'active') {
      return 'alert-active';
    }
    if (status === 'ignore') {
      return 'alert-ignore';
    }
    return 'alert-info';
  }

  formatDate(d?: Date): string {
    return d ? new Date(d).toLocaleString() : '—';
  }

  getRiskLevel(type?: string): string {
    const normalized = (type || '').toLowerCase();
    switch (normalized) {
      case 'general':
      case 'seo scanning':
        return 'Low';
      case 'breach':
      case 'exploit':
      case 'feed':
      case 'playstore-scanning':
      case 'social-scanner':
      case 'email-breach':
      case 'stealerlogs':
      case 'software-scanning':
        return 'Critical';
      case 'defacement':
      case 'advanced scanning':
      case 'repo scanning':
        return 'High';
      case 'social':
      case 'discussion':
        return 'Medium';
      default:
        return 'Unknown';
    }
  }

  riskClass(type?: string): AlertRiskClass {
    const risk = this.getRiskLevel(type).toLowerCase();
    if (risk === 'critical') {
      return 'risk-critical';
    }
    if (risk === 'high') {
      return 'risk-high';
    }
    if (risk === 'medium') {
      return 'risk-medium';
    }
    if (risk === 'low') {
      return 'risk-low';
    }
    return 'risk-unknown';
  }
}
