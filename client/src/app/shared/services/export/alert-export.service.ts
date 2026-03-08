import { Injectable } from '@angular/core';
import { AlertModel } from '../../model/company-profile/node.model';
import { GraphReportPayload } from '../../model/report/report-export.model';
import { DocumentExportService } from './document-export.service';

@Injectable({ providedIn: 'root' })
export class AlertExportService {
  constructor(private documentExport: DocumentExportService) {
  }

  exportPdf(alerts: AlertModel[], title: string = 'Brand Alerts'): void {
    const payload = this.buildPayload(alerts, title);
    this.documentExport.exportDocumentPdf(payload);
  }

  private buildPayload(alerts: AlertModel[], title: string): GraphReportPayload {
    const exportAtIso = new Date().toISOString();
    const safeAlerts = (alerts || []).filter(Boolean);
    const baseSummary: Record<string, string | number> = {
      total_alerts: safeAlerts.length,
      exported_at: exportAtIso
    };

    if (safeAlerts.length === 1) {
      const first = safeAlerts[0];
      baseSummary['type'] = this.getText(first.type);
      baseSummary['title'] = this.getText(first.title);
      baseSummary['ioc_type'] = this.getText(first.ioc_type);
      baseSummary['ioc_value'] = this.getText(first.ioc_value);
      baseSummary['source'] = this.getText(first.source);
      baseSummary['url'] = this.getText(first.url);
      baseSummary['last_seen'] = this.getDateText(first.last_seen);
    }

    return {
      graphKind: 'cti',
      title,
      sessionName: `Alert Session (${safeAlerts.length})`,
      generatedAtIso: exportAtIso,
      nodes: safeAlerts.map((alert, index) => ({
        id: alert.alert_id || alert.data_hash || `alert-${index + 1}`,
        label: this.getText(alert.title) || this.getText(alert.ioc_value) || this.getText(alert.type) || `Alert ${index + 1}`,
        type: 'alert'
      })),
      edges: [],
      summary: baseSummary
    };
  }

  private getText(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    const text = String(value).trim();
    return text ? text : '-';
  }

  private getDateText(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleString();
  }
}
