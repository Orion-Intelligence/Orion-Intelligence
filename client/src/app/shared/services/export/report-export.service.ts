import { Injectable } from '@angular/core';
import { ExportSharedService } from './export-shared.service';
import { GraphExportService } from './graph-export.service';
import { GraphReportExportType, GraphReportPayload, UnifiedReportPayloadInput } from '../../model/report/report-export.model';

@Injectable({ providedIn: 'root' })
export class ReportExportService extends ExportSharedService {
  constructor(private graphExport: GraphExportService) {
    super();
  }

  exportByType(payload: GraphReportPayload, type: GraphReportExportType): void {
    this.graphExport.exportByType(payload, type);
  }

  buildUnifiedGraphPayload(input: UnifiedReportPayloadInput): GraphReportPayload {
    const routeUrl = input.currentRouteUrl || '/';
    const urlObj = new URL(routeUrl, window.location.origin);
    const pathSegs = urlObj.pathname.split('/').filter(Boolean);
    const queryType = (urlObj.searchParams.get('ci') || '').toLowerCase();
    const reportId = pathSegs[pathSegs.length - 1] || 'report';
    const nowIso = new Date().toISOString();

    const normalizedType = queryType === 'feed' ? 'chat' : (queryType || 'report');
    const title = `${this.toTitle(normalizedType)} Report`;
    const sessionName = `ID-${reportId}`;

    const normalizedUrl = this.normalizeUrl(input.url || '');
    const source = this.toRecord(input.csvObject);
    const sourceEntries = Object.entries(source);
    const contentText = this.cleanText(input.content || '');
    const screenshotRef = this.cleanText(source['m_screenshot'] || '');
    const reportIdShort = this.compactMiddle(reportId, 14, 12);
    const sourceUrlShort = this.compactMiddle(normalizedUrl, 48, 18);

    const summary: Record<string, string | number> = {
      report_type: this.toTitle(normalizedType),
      report_id: reportIdShort || '-',
      report_id_full: reportId || '-',
      source_url: sourceUrlShort || '-',
      source_url_full: normalizedUrl || '-',
      language: input.lang || input.langDetected || '-',
      screenshot: screenshotRef ? 'Available' : 'Not Available',
      fields_count: sourceEntries.length,
      content_length: contentText.length
    };

    const detailValues: Record<string, string> = {};
    sourceEntries.slice(0, 40).forEach(([k, v]) => {
      detailValues[this.toTitle(k)] = this.cleanText(v).slice(0, 500) || '-';
    });
    if (!sourceEntries.length) {
      detailValues['Details'] = '-';
    }

    const tables = [{ title: 'Report Details', values: detailValues }];
    if (contentText) {
      tables.push({ title: 'Report Content', values: { Content: contentText.slice(0, 3000) } });
    }
    tables.push({ title: 'Metadata', values: this.buildMetadataValues(source, contentText) });
    tables.push({ title: 'Leak Screenshot', values: this.buildScreenshotValues(source) });
    tables.push({ title: 'Related Reports', values: this.buildRelatedReportsValues(source) });

    const nodes = [
      { id: `report-${reportId}`, label: `${this.toTitle(normalizedType)} Report`, type: 'report' },
      { id: `url-${reportId}`, label: normalizedUrl || 'Unknown URL', type: 'url' }
    ];
    const edges = [{ id: `edge-${reportId}`, from: nodes[0].id, to: nodes[1].id, label: 'source' }];

    return {
      graphKind: 'cti',
      title,
      sessionName,
      generatedAtIso: nowIso,
      nodes,
      edges,
      summary,
      tables
    };
  }

  private buildMetadataValues(source: Record<string, string>, contentText: string): Record<string, string> {
    const keys = Object.keys(source);
    const sectionRaw = source['m_section'] || '';
    const firstSection = sectionRaw
      .split(',')
      .map(v => this.cleanText(v))
      .filter(Boolean)[0] || '-';
    const entityKeys = keys.filter(k => k.startsWith('m_') && !['m_section', 'm_content', 'm_screenshot'].includes(k));
    return {
      Summary: 'Detected entities, extracted sections, and structured attributes.',
      'Section 1': firstSection.slice(0, 700),
      'Detected Entity Groups': String(entityKeys.length),
      'Structured Attributes': String(keys.length),
      'Content Preview': contentText ? contentText.slice(0, 500) : '-'
    };
  }

  private buildScreenshotValues(source: Record<string, string>): Record<string, string> {
    const screenshot = this.cleanText(source['m_screenshot'] || '');
    return {
      Description: 'Screenshot Preview',
      Available: screenshot ? 'Yes' : 'No',
      Reference: screenshot || 'No screenshot available'
    };
  }

  private buildRelatedReportsValues(source: Record<string, string>): Record<string, string> {
    const relatedKeys = Object.keys(source).filter(k => /related|mapping|edge|graph/i.test(k));
    const joined = relatedKeys
      .slice(0, 12)
      .map(k => `${this.toTitle(k)}: ${this.cleanText(source[k]).slice(0, 180)}`)
      .join(' | ');
    return {
      Description: 'Reports linked directly or indirectly through mapped entities.',
      Status: joined ? 'Found' : 'No related report fields in payload',
      Links: joined || '-'
    };
  }
}
