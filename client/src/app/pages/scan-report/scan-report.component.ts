import { CommonModule, NgClass, UpperCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../shared/directive/tooltip-directive.directive';
import { ScanJob } from '../../shared/model/scan-jobs/scan-job.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { VulnerabilitySectionComponent } from '../root-searches/network-intel/vulnerability-section/vulnerability-section.component';
import { ScanNotificationService } from '../../shared/services/scan-notification.service';
import { ValuePresentationBase } from '../../shared/utils/value-presentation.base';

@Component({
  selector: 'app-scan-report',
  standalone: true,
  imports: [CommonModule, NgClass, UpperCasePipe, TooltipDirective, TranslatePipe, VulnerabilitySectionComponent],
  templateUrl: './scan-report.component.html',
  animations: [fadeInDashboardItem],
})
export class ScanReportComponent extends ValuePresentationBase implements OnInit {
  job: ScanJob | null = null;
  loading = true;
  errorMessage = '';
  expandedResultIndex: number | null = 0;
  readonly trackByIndex = (index: number) => index;

  constructor(private route: ActivatedRoute, private scanNotifications: ScanNotificationService) {
    super();
  }

  ngOnInit(): void {
    const scanId = this.route.snapshot.paramMap.get('scanId') || '';
    if (!scanId) {
      this.loading = false;
      this.errorMessage = 'Scan report not found.';
      return;
    }

    this.scanNotifications.getScanDetail(scanId).subscribe({
      next: job => {
        this.job = job;
        this.loading = false;
        if (this.statusLabel === 'Completed') {
          this.scanNotifications.markSeen(job);
        }
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.detail || 'Unable to load scan report.';
      },
    });
  }

  get result(): any {
    return this.unwrapResult(this.job?.response);
  }

  get apiType(): string {
    const raw = String(this.job?.api_reference || this.job?.title || 'scan')
      .replace(/^\/?api\//, '')
      .replace(/^dynamic\//, '')
      .replace(/^netintel\//, '')
      .replace(/^urlscan\//, '')
      .replace(/_/g, '-');

    if (raw === 'cracked') {
      return 'playstore';
    }
    if (raw === 'url-vulnerability-scan') {
      return 'vulnerability-scan';
    }
    if (raw === 'ipscanner') {
      return 'ip-scan';
    }
    if (raw === 'resolve-ip') {
      return 'host-recon';
    }
    return raw || 'scan';
  }

  get reportTitle(): string {
    return this.job?.title || `${this.displayFieldLabel(this.apiType)} Report`;
  }

  get targetText(): string {
    return this.job?.target || this.result?.domain || this.result?.host || this.result?.url || this.result?.ip || this.result?.query || 'Scan target';
  }

  get statusLabel(): string {
    const status = this.job ? this.scanNotifications.getStatus(this.job) : 'queued';
    if (status === 'done') {
      return 'Completed';
    }
    if (status === 'error') {
      return 'Failed';
    }
    if (status === 'running') {
      return 'Running';
    }
    if (status === 'queued') {
      return 'Queued';
    }
    return status;
  }

  get resultCount(): number {
    if (this.isVulnerabilityReport) {
      return Number(this.result?.summary?.total ?? this.vulnerabilityFindings.length ?? 0);
    }
    if (Array.isArray(this.result)) {
      return this.result.length;
    }
    if (this.genericItems.length) {
      return this.genericItems.length;
    }
    return this.result && typeof this.result === 'object' ? 1 : 0;
  }

  get fieldCount(): number {
    if (this.isVulnerabilityReport) {
      return this.getVisibleObjectEntries(this.result).length + this.vulnerabilityFindings.length;
    }
    return this.genericItems.reduce((total, item) => total + this.getVisibleObjectEntries(item).length, 0);
  }

  get genericItems(): any[] {
    if (this.isVulnerabilityReport) {
      return [];
    }
    const r = this.result;
    if (!r) {
      return [];
    }
    if (Array.isArray(r)) {
      return r;
    }
    if (Array.isArray(r?.cards_data)) {
      return r.cards_data;
    }
    if (Array.isArray(r?.result)) {
      return r.result;
    }
    if (Array.isArray(r?.data?.cards_data)) {
      return r.data.cards_data;
    }
    if (Array.isArray(r?.result?.cards_data)) {
      return r.result.cards_data;
    }
    if (typeof r === 'object') {
      return [r];
    }
    return [{ value: r }];
  }

  get isVulnerabilityReport(): boolean {
    const ref = String(this.job?.api_reference || '').toLowerCase();
    return ref.includes('url_vulnerability_scan') || Boolean(this.result?.summary && (Array.isArray(this.result?.findings) || Array.isArray(this.result?.top_findings)));
  }

  get vulnerabilityFindings(): any[] {
    return Array.isArray(this.result?.findings)
      ? this.result.findings
      : Array.isArray(this.result?.top_findings)
        ? this.result.top_findings
        : [];
  }

  get vulnerabilityTargets(): string[] {
    return [this.vulnerabilityActiveTarget].filter(Boolean);
  }

  get vulnerabilityActiveTarget(): string {
    return this.result?.host || this.result?.extracted?.host || this.result?.url || this.targetText;
  }

  get completedAtLabel(): string {
    return this.formatDate(this.job?.completed_at || this.job?.updated_at || this.job?.created_at);
  }

  getVisibleObjectEntries(item: any): { key: string; value: any }[] {
    return this.getFlattenedObjectEntries(item).filter(entry => !this.isEmptyDisplayValue(entry.value) && !this.isInternalField(entry.key));
  }

  isArrayValue(value: any): boolean {
    return Array.isArray(value);
  }

  deduplicateWithCount(arr: any[]): { value: any; count: number }[] {
    if (!Array.isArray(arr)) {
      return [];
    }
    const map = new Map<string, { value: any; count: number }>();
    arr.forEach(item => {
      const key = this.stringifyNestedValue(item);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      map.set(key, { value: item, count: 1 });
    });
    return Array.from(map.values());
  }

  toggleResultItem(index: number): void {
    this.expandedResultIndex = this.expandedResultIndex === index ? null : index;
  }

  statusBadgeClass(): string {
    if (this.statusLabel === 'Completed') {
      return 'bg-[rgba(74,222,128,0.14)] text-[#4ade80]';
    }
    if (this.statusLabel === 'Failed') {
      return 'bg-[rgba(255,77,79,0.14)] text-[#ff4d4f]';
    }
    return 'bg-[rgba(87,165,235,0.14)] text-[#57a5eb]';
  }

  private unwrapResult(response: any): any {
    if (!response || typeof response !== 'object') {
      return response;
    }
    if (response?.result?.result && typeof response.result.result === 'object') {
      return response.result.result;
    }
    if (response?.data && typeof response.data === 'object') {
      return response.data;
    }
    if (response?.result && typeof response.result === 'object') {
      return response.result;
    }
    return response;
  }

  private isInternalField(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[-\s]+/g, '_');
    return ['status', 'step', 'progress', 'scan_id', 'job_id', 'request_mode', 'elapsed_seconds', 'api_reference'].includes(normalized);
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
  }
}
