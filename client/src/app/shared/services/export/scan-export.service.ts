import { Injectable } from '@angular/core';
import { GraphReportNode, GraphReportPayload, GraphReportTableRow } from '../../model/report/report-export.model';
import { ScanJob } from '../../model/scan-jobs/scan-job.model';
import { DocumentExportService } from './document-export.service';
import { ExportSharedService } from './export-shared.service';

@Injectable({ providedIn: 'root' })
export class ScanExportService extends ExportSharedService {
  constructor(private documentExport: DocumentExportService) {
    super();
  }

  exportPdf(scan: ScanJob | null | undefined, title = 'Scan Report'): void {
    if (!scan) {
      return;
    }
    this.documentExport.exportDocumentPdf(this.buildPayload(scan, title));
  }

  private buildPayload(scan: ScanJob, title: string): GraphReportPayload {
    const generatedAtIso = new Date().toISOString();
    const response = scan.response ?? {};
    const result = this.unwrapResult(response);
    const target = this.getText(scan.target || result?.domain || result?.url || result?.ip || result?.query?.coordinates || 'Scan Target');
    const status = this.getText(result?.status || response?.status || 'done');
    const findings = this.asArray(result?.top_findings).length ? this.asArray(result?.top_findings) : this.asArray(result?.findings);
    const technologies = this.asArray(result?.extracted?.technologies);
    const paths = this.asArray(result?.extracted?.discovered_paths);
    const ips = this.asArray(result?.ips || result?.ip_locations || result?.ip_addresses);
    const cameras = this.asArray(result?.cameras);
    const subdomains = this.asArray(result?.subdomains || result?.live_subdomains);
    const dnsRecords = this.asArray(result?.records || result?.dns_records);
    const nodes = this.buildNodes(scan, target, findings, technologies, ips, cameras, subdomains);

    return {
      graphKind: 'cti',
      title,
      sessionName: `${this.getText(scan.title || 'Scan')} - ${target}`,
      generatedAtIso,
      nodes,
      edges: [],
      summary: {
        scan_title: this.getText(scan.title || 'Scan'),
        target,
        status,
        findings: findings.length,
        technologies: technologies.length,
        discovered_paths: paths.length,
        ips: ips.length,
        cameras: cameras.length,
        subdomains: subdomains.length,
        exported_at: generatedAtIso,
        created_at: this.getDateText(scan.created_at),
        completed_at: this.getDateText(scan.completed_at),
      },
      tables: this.buildTables(result, findings, technologies, paths, ips, cameras, subdomains, dnsRecords),
    };
  }

  private buildNodes(scan: ScanJob, target: string, findings: any[], technologies: any[], ips: any[], cameras: any[], subdomains: any[]): GraphReportNode[] {
    const nodes: GraphReportNode[] = [{
      id: scan.id || 'scan-target',
      label: target,
      type: 'target',
    }];

    findings.slice(0, 60).forEach((finding, index) => {
      nodes.push({
        id: `finding-${index + 1}`,
        label: this.getText(finding?.title || finding?.category || `Finding ${index + 1}`),
        type: this.getText(finding?.risk || finding?.severity || 'finding').toLowerCase(),
      });
    });
    technologies.slice(0, 30).forEach((technology, index) => nodes.push({
      id: `technology-${index + 1}`,
      label: this.getText(technology),
      type: 'technology',
    }));
    [...ips, ...cameras, ...subdomains].slice(0, 80).forEach((item, index) => nodes.push({
      id: `asset-${index + 1}`,
      label: this.getAssetLabel(item),
      type: 'asset',
    }));

    return nodes;
  }

  private buildTables(result: any, findings: any[], technologies: any[], paths: any[], ips: any[], cameras: any[], subdomains: any[], dnsRecords: any[]): GraphReportTableRow[] {
    const tables: GraphReportTableRow[] = [];
    const resultSummary = this.withoutInternalFields(this.toRecord(result?.summary));
    if (Object.keys(resultSummary).length) {
      tables.push({ title: 'Risk Summary', values: resultSummary });
    }

    if (findings.length) {
      tables.push({
        title: 'Top Findings',
        values: this.indexedValues(findings.slice(0, 30), finding => [
          this.getText(finding?.risk || finding?.severity || finding?.confidence || 'Finding'),
          this.getText(finding?.title || finding?.category || finding?.description),
          this.getText(finding?.url || finding?.source || ''),
        ].filter(Boolean).join(' | ')),
      });
    }

    const discovered: Record<string, string> = {};
    if (technologies.length) {
      discovered['Technologies'] = technologies.slice(0, 40).map(item => this.getText(item)).join(', ');
    }
    if (paths.length) {
      discovered['Discovered Paths'] = paths.slice(0, 40).map(item => this.compactMiddle(this.getText(item), 48, 18)).join('\n');
    }
    if (Object.keys(discovered).length) {
      tables.push({ title: 'Discovered Data', values: discovered });
    }

    if (subdomains.length) {
      tables.push({ title: 'Subdomains', values: this.indexedValues(subdomains.slice(0, 80), item => this.getText(item)) });
    }
    if (ips.length) {
      tables.push({ title: 'IP Results', values: this.indexedValues(ips.slice(0, 80), item => this.getAssetLabel(item)) });
    }
    if (cameras.length) {
      tables.push({ title: 'Camera Results', values: this.indexedValues(cameras.slice(0, 80), item => this.getAssetLabel(item)) });
    }
    if (dnsRecords.length) {
      tables.push({ title: 'DNS Records', values: this.indexedValues(dnsRecords.slice(0, 80), item => this.getText(typeof item === 'object' ? JSON.stringify(item) : item)) });
    }

    return tables;
  }

  private withoutInternalFields(values: Record<string, string>): Record<string, string> {
    const hiddenKeys = new Set([
      'scan_id',
      'scanid',
      'job_id',
      'jobid',
      'api_reference',
      'api reference',
      'request_mode',
      'request mode',
      'requed_mode',
      'requed mode',
      'elapsed_seconds',
      'elapsed seconds',
      'response_status',
      'response status',
    ]);

    return Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
      const normalizedKey = key.toLowerCase().replace(/[-\s]+/g, '_');
      if (!hiddenKeys.has(key.toLowerCase()) && !hiddenKeys.has(normalizedKey)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  private unwrapResult(response: any): any {
    if (response?.result?.result && typeof response.result.result === 'object') {
      return response.result.result;
    }
    if (response?.result && typeof response.result === 'object') {
      return response.result;
    }
    return response || {};
  }

  private asArray(value: any): any[] {
    return Array.isArray(value) ? value.filter(item => item !== null && item !== undefined) : [];
  }

  private indexedValues(items: any[], formatter: (item: any, index: number) => string): Record<string, string> {
    return items.reduce<Record<string, string>>((acc, item, index) => {
      acc[`Item ${index + 1}`] = formatter(item, index);
      return acc;
    }, {});
  }

  private getAssetLabel(item: any): string {
    if (item === null || item === undefined) {
      return '-';
    }
    if (typeof item !== 'object') {
      return this.getText(item);
    }
    return [
      item.ip || item.host || item.domain || item.url || item.name,
      item.port ? `:${item.port}` : '',
      item.country || item.city || item.service || item.product || item.title,
    ].filter(Boolean).join(' ');
  }

  private getText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'object') {
      return this.cleanText(JSON.stringify(value));
    }
    return this.cleanText(String(value)) || '-';
  }

  private getDateText(value: Date | string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
  }
}
