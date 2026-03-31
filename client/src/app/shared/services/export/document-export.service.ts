import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { GraphReportMeta, GraphReportPayload } from '../../model/report/report-export.model';
import { GraphExportService } from './graph-export.service';

@Injectable({ providedIn: 'root' })
export class DocumentExportService extends GraphExportService {
  exportDocumentPdf(payload: GraphReportPayload): void {
    this.exportDocumentPdfStream(payload);
  }

  private exportDocumentPdfStream(payload: GraphReportPayload): void {
    this.getPdfLibs().subscribe((libs) => {
      const bytes = this.buildDocPdfBytes(payload, libs.jsPDF, libs.autoTable);
      this.downloadBinary(bytes, 'application/pdf', `${this.buildSafeFilename(payload)}-doc-report.pdf`);
    });
  }

  private buildDocPdfBytes(payload: GraphReportPayload, JsPdfCtor: typeof import('jspdf').default, autoTable: typeof import('jspdf-autotable').default): Uint8Array {
    const doc = new JsPdfCtor({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
    const meta = this.makeMeta(payload);
    const hooks = this.makeHeaderFooterHooks(payload, meta);
    this.drawCover(doc, payload, meta, 'Document Report');
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - 80;
    this.drawInfoSectionMarker(doc, 160, contentW, 'Executive Summary');
    autoTable(doc, {
      startY: 172,
      margin: { left: 40, right: 40 },
      tableWidth: contentW,
      body: Object.entries(payload.summary ?? {}).map(([k, v]) => [k, String(v)]) as RowInput[],
      styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: contentW - 150 } },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      didParseCell: (data: any) => {
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [214, 226, 240];
        }
      },
      theme: 'plain',
      didDrawPage: hooks.didDrawPage
    });
    this.drawRoundedTableContainer(doc, 40, contentW, 160, (doc as any).lastAutoTable?.finalY ?? 160);
    if (this.isJpegDataUrl(payload.graphImageDataUrl)) {
      const snapshotMarkerY = (doc as any).lastAutoTable.finalY + 14;
      this.drawInfoSectionMarker(doc, snapshotMarkerY, contentW, 'Network Snapshot');
      autoTable(doc, {
        startY: snapshotMarkerY + 12,
        margin: { left: 40, right: 40 },
        tableWidth: contentW,
        body: [['', '']] as RowInput[],
        styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        bodyStyles: { lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        theme: 'plain',
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
      const y = (doc as any).lastAutoTable.finalY + 10;
      const fit = this.fitRect(doc, this.getPageW(doc) - 80, 260, 40, y);
      doc.addImage(payload.graphImageDataUrl as string, 'JPEG', fit.x, fit.y, fit.w, fit.h, undefined, 'FAST');
    }
    const nodeMarkerY = Math.max((doc as any).lastAutoTable?.finalY ?? 160, 160) + 18;
    this.drawInfoSectionMarker(doc, nodeMarkerY, contentW, 'Nodes');
    autoTable(doc, {
      startY: nodeMarkerY + 12,
      margin: { left: 40, right: 40 },
      tableWidth: contentW,
      body: [['Node', 'Type', 'ID'], ...payload.nodes.slice(0, 150).map(n => [n.label || n.id, n.type, this.truncateWithEllipsis(String(n.id || ''), 20)])] as RowInput[],
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 90 }, 2: { cellWidth: 185 } },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [207, 220, 236];
        }
      },
      theme: 'plain',
      didDrawPage: hooks.didDrawPage
    });
    this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    if (payload.tables?.length) {
      payload.tables.forEach((t, idx) => {
        const sectionTitle = this.getReportSectionTitle(t, idx);
        const tableRows = this.buildReportSectionRows(t.values ?? {});
        let markerY = ((doc as any).lastAutoTable.finalY ?? 160) + 18;
        markerY = this.resolveMarkerY(doc, markerY, 126);
        this.drawInfoSectionMarker(doc, markerY, contentW, sectionTitle);
        const reportSectionDidDrawPage = (data: any) => {
          hooks.didDrawPage(data);
          this.drawInfoSectionMarker(data.doc as jsPDF, 126, contentW, sectionTitle || 'Info');
        };
        autoTable(doc, {
          startY: markerY + 12,
          margin: { top: 139, left: 40, right: 40, bottom: 58 },
          tableWidth: contentW,
          body: tableRows as RowInput[],
          styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
          columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: contentW - 170 } },
          bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
          alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
          didParseCell: (data: any) => {
            if (data.row.index === 0) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [207, 220, 236];
              return;
            }
            if (data.column.index === 0) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [214, 226, 240];
            }
          },
          theme: 'plain',
          didDrawPage: reportSectionDidDrawPage
        });
        const screenshotDataUrl = this.findTableScreenshotDataUrl(t);
        if (screenshotDataUrl) {
          const lastY = (doc as any).lastAutoTable?.finalY ?? (markerY + 12);
          const imageY = this.resolveMarkerY(doc, lastY + 10, 86);
          this.drawScreenshotPreview(doc, screenshotDataUrl, 40, imageY, contentW, 180);
        }
        this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
      });
    }
    if ((payload.edges || []).length > 0) {
      const edgeMarkerY = (doc as any).lastAutoTable.finalY + 18;
      this.drawInfoSectionMarker(doc, edgeMarkerY, contentW, 'Connection Matrix');
      autoTable(doc, {
        startY: edgeMarkerY + 12,
        margin: { left: 40, right: 40 },
        tableWidth: contentW,
        body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 200).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? ''])] as RowInput[],
        styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 150 }, 2: { cellWidth: 150 }, 3: { cellWidth: 177 } },
        bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        didParseCell: (data: any) => {
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [207, 220, 236];
          }
        },
        theme: 'plain',
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    }
    return this.docToBytes(doc);
  }

  private drawCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, subtitle: string): void {
    this.drawReportBackgroundPattern(doc);
    const W = this.getPageW(doc);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 138, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(this.fitSingleLine(doc, payload.title || 'Network Report', W - 80), 40, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    const sessionText = this.compactSession(payload.sessionName || '—');
    const sessionLines = doc.splitTextToSize(`Session: ${sessionText}`, W - 80) as string[];
    const isAlertCover = meta.kindLabel === 'Brand Alerts';
    if (isAlertCover) {
      const infoTop = 58;
      const infoBottom = 126;
      const lineHeight = 12;
      const totalHeight = lineHeight * (2 + sessionLines.length);
      const startY = infoTop + Math.max(0, ((infoBottom - infoTop) - totalHeight) / 2) + 9;
      doc.text(`${subtitle} • ${meta.kindLabel}`, 40, startY);
      doc.text(sessionLines, 40, startY + lineHeight);
      doc.text(this.fitSingleLine(doc, `Generated: ${meta.generatedAt}`, W - 80), 40, startY + lineHeight + (sessionLines.length * lineHeight));
    }
    else {
      doc.text(`${subtitle} • ${meta.kindLabel}`, 40, 70);
      doc.text(sessionLines, 40, 90);
      const generatedY = 90 + (sessionLines.length * 12);
      doc.text(this.fitSingleLine(doc, `Generated: ${meta.generatedAt}`, W - 80), 40, generatedY);
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(40, 146, W - 40, 146);
    doc.setTextColor(15, 23, 42);
  }

  private makeHeaderFooterHooks(payload: GraphReportPayload, meta: GraphReportMeta): {
    didDrawPage: (data: any) => void;
  } {
    const drawnPages = new Set<number>();
    const drawHeader = (doc: jsPDF, section: string) => {
      this.drawStandardPageHeader(doc, payload.title || 'Network Report', section, 54);
    };
    const drawFooter = (doc: jsPDF, meta2: GraphReportMeta) => {
      const W = this.getPageW(doc);
      const H = this.getPageH(doc);
      const pageNo = doc.getCurrentPageInfo().pageNumber;
      const total = doc.getNumberOfPages();
      doc.setDrawColor(226, 232, 240);
      doc.line(40, H - 54, W - 40, H - 54);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const compactSession = this.compactSession(payload.sessionName || '—');
      doc.text(this.fitSingleLine(doc, `${meta2.kindLabel} • ${compactSession} • ${meta2.generatedAt}`, W - 170), 40, H - 32);
      doc.text(`Page ${pageNo} of ${total}`, W - 40, H - 32, { align: 'right' });
    };
    const didDrawPage = (data: any) => {
      const pageNo = data?.pageNumber ?? docPageNumberSafe(data?.doc);
      if (drawnPages.has(pageNo)) {
        return;
      }
      drawnPages.add(pageNo);
      const section = pageNo === 1 ? 'Overview' : 'Details';
      const d = data?.doc as jsPDF;
      drawHeader(d, section);
      drawFooter(d, meta);
    };
    const docPageNumberSafe = (d?: jsPDF): number => {
      try {
        return d?.getCurrentPageInfo().pageNumber ?? 1;
      }
      catch {
        return 1;
      }
    };
    return { didDrawPage };
  }
}
