import { CommonModule } from '@angular/common';
import { Component, effect, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IpDetail } from '../../../../shared/model/network-intel/network-intel.model';
import { NetworkIntelScanService } from '../../../../shared/services/network-intel/network-intel-scan.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-ip-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './ip-detail.component.html',
  styles: [`
    :host(.threat-lens-ip-detail-content) > * {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    :host(.threat-lens-ip-detail-content) > :first-child {
      margin-top: 0 !important;
    }

    :host(.threat-lens-ip-detail-content) > :last-child {
      margin-bottom: 0 !important;
    }

    :host(.threat-lens-ip-detail-content) > :first-child .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0 24px !important;
      border-top: 1px solid rgba(143, 166, 190, 0.16);
      border-bottom: 1px solid rgba(143, 166, 190, 0.16);
      background: rgba(19, 30, 48, 0.28);
    }

    :host(.threat-lens-ip-detail-content) > :first-child .grid > div {
      display: grid !important;
      grid-template-columns: minmax(92px, 0.72fr) minmax(0, 1fr);
      align-items: baseline;
      gap: 10px;
      min-height: 42px;
      padding: 10px 2px;
      border-bottom: 1px solid rgba(143, 166, 190, 0.14);
    }

    :host(.threat-lens-ip-detail-content) > :first-child .grid > div:nth-last-child(-n + 2) {
      border-bottom: 0;
    }

    :host(.threat-lens-ip-detail-content) > :first-child .grid > div > span:first-child {
      color: rgba(160, 184, 209, 0.82) !important;
      font-size: 10px !important;
      line-height: 1.2;
      letter-spacing: 0.12em !important;
    }

    :host(.threat-lens-ip-detail-content) > :first-child .grid > div > span:last-child {
      color: #E6EEF8 !important;
      font-size: 14px !important;
      line-height: 1.35;
      font-weight: 600 !important;
      text-align: right;
    }

    @media (max-width: 720px) {
      :host(.threat-lens-ip-detail-content) > :first-child .grid {
        grid-template-columns: 1fr !important;
      }

      :host(.threat-lens-ip-detail-content) > :first-child .grid > div:nth-last-child(-n + 2) {
        border-bottom: 1px solid rgba(143, 166, 190, 0.14);
      }

      :host(.threat-lens-ip-detail-content) > :first-child .grid > div:last-child {
        border-bottom: 0;
      }
    }
  `],
})
export class IpDetailComponent {
  private readonly renderedTopLevelKeys = new Set([ 'ip',  'status', 'ip_info', 'hostnames', 'country', 'city', 'organization', 'isp', 'asn', 'cloud_provider', 'cloud_region', 'cloud_service', 'hosting_type', 'web_technologies', 'vulnerabilities', 'misconfigurations', 'security', 'cdn', 'waf', 'paas', 'amazon_s3', 'load_balancer', 'hsts', 'web_server', 'favicon_hash', 'allowed_methods', 'cookies', 'title', 'http_headers', 'cache_headers', 'link_headers', 'camera_paths', 'cameras', 'is_camera', 'ports', 'open_ports', ]);

  readonly detailInput = input<IpDetail | undefined>(undefined, { alias: 'detail' });
  detail!: IpDetail;

  constructor(public ui: NetworkIntelScanService, private sanitizer: DomSanitizer) {
    effect(() => {
      const detail = this.detailInput();
      if (detail !== undefined) {
        this.detail = detail;
      }
    });
  }

  get cameraPortCount(): number {
    return (this.detail?.ports || []).filter((port: any) => port && (port.is_camera || port.device_type === 'camera')).length;
  }

  get iotPortCount(): number {
    return (this.detail?.ports || []).filter((port: any) => port?.is_iot).length;
  }

  get hasCameraSignals(): boolean {
    return !!this.detail?.is_camera || this.cameraPortCount > 0 || (this.detail?.cameras?.length ?? 0) > 0;
  }

  get extraDetailEntries(): [string, string][] {
    return this.buildRenderableEntries(this.detail, (key) => !this.renderedTopLevelKeys.has(key));
  }

  get generalInfoExtraEntries(): [string, string][] {
    return this.buildRenderableEntries(this.detail?.ip_info, (key, value) => !this.isDuplicateGeneralInfoField(key, value));
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

  renderHeaderEntries(source: Record<string, any> | undefined | null): [string, string][] {
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

  getCameraIframeUrl(ip: string, port: string | number): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`http://${ip}:${port}`);
  }

  private hasRenderableValue(value: any): boolean {
    return this.ui.hasRenderableValue(value);
  }

  private buildRenderableEntries(source: Record<string, any> | undefined | null, includeEntry: (key: string, value: any) => boolean): [string, string][] {
    return this.ui.safeEntries(source)
      .filter(([key, value]) => includeEntry(key, value) && this.hasRenderableValue(value))
      .map(([key, value]) => [this.formatLabel(key), this.formatDisplayValue(value)] as [string, string])
      .filter(([, value]) => Boolean(value));
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
