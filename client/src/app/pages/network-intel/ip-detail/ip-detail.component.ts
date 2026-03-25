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
  private readonly renderedTopLevelKeys = new Set([ 'ip', 'status', 'ip_info', 'hostnames', 'country', 'city', 'organization', 'isp', 'asn', 'cloud_provider', 'cloud_region', 'cloud_service', 'hosting_type', 'web_technologies', 'vulnerabilities', 'misconfigurations', 'security', 'cdn', 'waf', 'paas', 'amazon_s3', 'load_balancer', 'hsts', 'web_server', 'favicon_hash', 'allowed_methods', 'cookies', 'title', 'http_headers', 'cache_headers', 'link_headers', 'camera_paths', 'cameras', 'is_camera', 'ports', 'open_ports', ]);

  @Input({ required: true }) detail!: IpDetail;

  constructor(public ui: ScanHelperMethodsService) {}

  
  get cameraPortCount(): number {
    return (this.detail?.ports || []).filter((port: any) => port && (port.is_camera || port.device_type === 'camera')).length;
  }

  get iotPortCount(): number {
    return (this.detail?.ports || []).filter((port: any) => port && port.is_iot).length;
  }

  get hasCameraSignals(): boolean {
    return !!this.detail?.is_camera || this.cameraPortCount > 0 || (this.detail?.cameras?.length ?? 0) > 0;
  }

  get extraDetailEntries(): Array<[string, string]> {
    return this.ui.safeEntries(this.detail)
      .filter(([key, value]) => !this.renderedTopLevelKeys.has(key) && this.hasRenderableValue(value))
      .map(([key, value]) => [this.formatLabel(key), this.formatDisplayValue(value)] as [string, string])
      .filter(([, value]) => Boolean(value));
  }

  get generalInfoExtraEntries(): Array<[string, string]> {
    return this.ui.safeEntries(this.detail?.ip_info)
      .filter(([key, value]) => !this.isDuplicateGeneralInfoField(key, value) && this.hasRenderableValue(value))
      .map(([key, value]) => [this.formatLabel(key), this.formatDisplayValue(value)] as [string, string])
      .filter(([, value]) => Boolean(value));
  }

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

  private hasRenderableValue(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  private formatLabel(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private isDuplicateGeneralInfoField(key: string, value: any): boolean {
    const duplicateFields: Record<string, any> = {
      country: this.detail?.country,
      city: this.detail?.city,
      org: this.detail?.organization,
      isp: this.detail?.isp,
      as: this.detail?.asn,
    };

    return key in duplicateFields && this.formatDisplayValue(duplicateFields[key]) === this.formatDisplayValue(value);
  }
}
