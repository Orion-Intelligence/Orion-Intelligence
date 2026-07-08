import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../shared/directive/tooltip-directive.directive';
import { ExportChoiceOption } from '../../shared/model/report/export-choice.model';
import { GraphReportPayload } from '../../shared/model/report/report-export.model';
import { ScanJob } from '../../shared/model/scan-jobs/scan-job.model';
import { ExportChoiceModalComponent } from '../../shared/partials/export-choice-modal/export-choice-modal.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ReportExportService } from '../../shared/services/report-export.service';
import { ScanNotificationService } from '../../shared/services/scan-notification.service';
import { ValuePresentationBase } from '../../shared/utils/value-presentation.base';

type ScanReportField = { label: string; value: any };
type ScanReportSection = { title: string; items: ScanReportField[] };
const SCAN_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'json',
    title: '1. JSON',
    description: 'Download machine-readable scan report data.',
    testId: 'scan-report-export-json'
  },
  {
    value: 'report',
    title: '2. Export Report (PDF)',
    description: 'Generate consistent scan report PDF export.',
    testId: 'scan-report-export-report'
  }
];

@Component({
  selector: 'app-scan-report',
  standalone: true,
  imports: [CommonModule, NgClass, TooltipDirective, ExportChoiceModalComponent, TranslatePipe],
  templateUrl: './scan-report.component.html',
  animations: [fadeInDashboardItem],
})
export class ScanReportComponent extends ValuePresentationBase implements OnInit {
  job: ScanJob | null = null;
  loading = true;
  errorMessage = '';
  isExportChoiceOpen = false;
  readonly reportExportOptions = SCAN_REPORT_EXPORT_OPTIONS;
  readonly trackByIndex = (index: number) => index;

  constructor(private route: ActivatedRoute, private scanNotifications: ScanNotificationService, private reportExportService: ReportExportService) {
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
    if (this.findingItems.length) {
      return this.findingItems.length;
    }
    if (Array.isArray(this.result)) {
      return this.result.length;
    }
    if (this.resultSections.length) {
      return this.resultSections.length;
    }
    return this.result && typeof this.result === 'object' ? 1 : 0;
  }

  get fieldCount(): number {
    return this.resultSections.reduce((total, section) => total + section.items.length, 0);
  }

  get resultSections(): ScanReportSection[] {
    return this.buildResultSections(this.result);
  }

  get completedAtLabel(): string {
    return this.formatDate(this.job?.completed_at || this.job?.updated_at || this.job?.created_at);
  }

  isLastSectionRow(section: ScanReportSection, index: number): boolean {
    const count = section.items.length;
    return index === count - 1 || (index === count - 2 && count % 2 === 0);
  }

  openExportChoice(): void {
    this.isExportChoiceOpen = true;
  }

  closeExportChoice(): void {
    this.isExportChoiceOpen = false;
  }

  selectExport(type: string): void {
    if (type === 'json' || type === 'report') {
      this.exportReport(type);
    }
    this.closeExportChoice();
  }

  private exportReport(type: string): void {
    if (!this.job) {
      return;
    }
    this.reportExportService.exportByType(this.buildReportPayload(), type === 'json' ? 'json' : 'doc_pdf');
  }

  private buildReportPayload(): GraphReportPayload {
    const now = new Date().toISOString();
    const sections = this.resultSections;
    const target = this.targetText || 'Scan target';
    const apiLabel = this.displayFieldLabel(this.apiType);
    const sectionNodes = sections.slice(0, 120).map((section, index) => ({
      id: `section-${index + 1}`,
      label: section.title,
      type: 'section',
    }));

    return {
      graphKind: 'cti',
      title: `Scan Report - ${apiLabel}`,
      sessionName: `${this.apiType}-${target}`.slice(0, 80),
      generatedAtIso: now,
      nodes: [
        { id: 'target', label: target, type: 'target' },
        ...sectionNodes,
      ],
      edges: sectionNodes.map(node => ({
        id: `edge-${node.id}`,
        from: 'target',
        to: node.id,
        label: 'contains',
      })),
      summary: {
        scan_type: apiLabel,
        target,
        status: this.statusLabel,
        results: this.resultCount,
        fields: this.fieldCount,
        completed_at: this.completedAtLabel,
        exported_at: new Date(now).toLocaleString(),
      },
      tables: [
        {
          title: 'Request Context',
          values: {
            'Scan Type': apiLabel,
            Target: target,
            Status: this.statusLabel,
            Results: String(this.resultCount),
            Fields: String(this.fieldCount),
            Completed: this.completedAtLabel,
            'Exported At': new Date(now).toLocaleString(),
          },
        },
        ...sections.slice(0, 80).map(section => ({
          title: section.title,
          values: this.buildReportTableValues(section),
        })),
      ],
    };
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

  private get findingItems(): any[] {
    return Array.isArray(this.result?.findings)
      ? this.result.findings
      : Array.isArray(this.result?.top_findings)
        ? this.result.top_findings
        : [];
  }

  private buildResultSections(result: any): ScanReportSection[] {
    if (!result) {
      return [];
    }

    if (Array.isArray(result)) {
      return result
        .map((item, index) => ({
          title: `${this.displayFieldLabel(this.apiType)} ${index + 1}`,
          items: this.flattenReportValue(item),
        }))
        .filter(section => section.items.length > 0);
    }

    if (!this.isObjectValue(result)) {
      return this.isEmptyDisplayValue(result)
        ? []
        : [{ title: 'Result', items: [{ label: 'Value', value: result }] }];
    }

    return Object.entries(result)
      .filter(([key, value]) => !this.isInternalField(key) && !this.isEmptyDisplayValue(value))
      .map(([key, value]) => ({
        title: this.displayFieldLabel(key),
        items: this.flattenReportValue(value),
      }))
      .filter(section => section.items.length > 0);
  }

  private flattenReportValue(value: any, path: string[] = []): ScanReportField[] {
    if (this.isEmptyDisplayValue(value)) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item, index) => this.flattenReportValue(item, path.length ? path : [`Item ${index + 1}`]));
    }

    if (!this.isObjectValue(value)) {
      return [{
        label: this.displayFieldLabel(path[path.length - 1] || 'Value'),
        value,
      }];
    }

    return Object.entries(value)
      .filter(([key, child]) => !this.isInternalField(key) && !this.isEmptyDisplayValue(child))
      .flatMap(([key, child]) => this.flattenReportValue(child, [...path, key]))
      .filter((item, index, items) => index === items.findIndex(match => match.label === item.label && this.stringifyNestedValue(match.value) === this.stringifyNestedValue(item.value)));
  }

  private buildReportTableValues(section: ScanReportSection): Record<string, string> {
    const values: Record<string, string> = {};
    section.items.slice(0, 80).forEach((item, index) => {
      const label = item.label || `Field ${index + 1}`;
      const key = values[label] === undefined ? label : `${label} ${index + 1}`;
      values[key] = this.toReportCellValue(item.value);
    });
    return Object.keys(values).length ? values : { Details: '-' };
  }

  private toReportCellValue(value: any): string {
    const text = this.stringifyNestedValue(value) || '-';
    return text.length > 1000 ? `${text.slice(0, 997)}...` : text;
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
