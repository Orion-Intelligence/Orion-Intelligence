import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IpDetail } from '../../../shared/model/network-intel/network-intel.model';
import { ScanHelperMethodsService } from '../network-intel-service.service';

@Component({
  selector: 'app-ip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ip-detail.component.html',
})
export class IpDetailComponent {
  @Input({ required: true }) detail!: IpDetail;

  constructor(public ui: ScanHelperMethodsService) {}

  formatVulnerability(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      const cve = typeof value.cve === 'string' ? value.cve.trim() : '';
      const cvss = value.cvss !== null && value.cvss !== undefined && `${value.cvss}`.trim() !== ''
        ? `CVSS ${value.cvss}`
        : '';

      return [cve, cvss].filter(Boolean).join(' • ');
    }

    return '';
  }

  renderHeaderEntries(source: Record<string, any> | undefined | null): Array<[string, string]> {
    return this.ui.safeEntries(source)
      .map(([key, value]) => [key.trim(), this.formatDisplayValue(value)] as [string, string])
      .filter(([key, value]) => Boolean(key && value));
  }

  formatDisplayValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map(item => this.formatDisplayValue(item)).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, nestedValue]) => `${key}: ${this.formatDisplayValue(nestedValue)}`.trim())
        .filter(item => !item.endsWith(':'))
        .join(', ');
    }
    return String(value).trim();
  }
}
