import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { forkJoin, from } from 'rxjs';
import { GraphReportMeta, GraphReportPayload, GraphReportTableRow } from '../../model/report/report-export.model';
import { GraphExportService } from './graph-export.service';
import { PdfExportTheme } from './pdf-export-theme';
import { preparePdfValue } from './pdf-text.util';

@Injectable({ providedIn: 'root' })
export class DocumentExportService extends GraphExportService {
  exportDocumentPdf(payload: GraphReportPayload): void {
    this.exportDocumentPdfStream(payload);
  }

  private exportDocumentPdfStream(payload: GraphReportPayload): void {
    forkJoin({
      libs: this.getPdfLibs(),
      tenantLogoDataUrl: from(this.exportBranding.loadTenantLogoDataUrl())
    }).subscribe(({ libs, tenantLogoDataUrl }) => {
      const bytes = this.buildDocPdfBytes(this.preparePayloadForPdf(payload), libs.jsPDF, libs.autoTable, tenantLogoDataUrl);
      this.downloadBinary(bytes, 'application/pdf', `${this.buildSafeFilename(payload)}.pdf`);
    });
  }

  private buildDocPdfBytes(payload: GraphReportPayload, JsPdfCtor: typeof import('jspdf').default, autoTable: typeof import('jspdf-autotable').default, tenantLogoDataUrl: string | null): Uint8Array {
    const doc = new JsPdfCtor({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
    const meta = this.makeMeta(payload, tenantLogoDataUrl);
    this.applyPdfDocumentProperties(doc, payload, meta);
    const theme = this.PDF_THEME;
    const tableTheme = this.getTableTheme(theme);
    const hooks = this.makeHeaderFooterHooks(payload, meta, theme);
    const firstSectionY = this.drawCover(doc, payload, meta, 'Document Report', theme);
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - 80;
    this.drawInfoSectionMarker(doc, firstSectionY, contentW, 'Executive Summary', theme?.sectionHeaderRgb);
    autoTable(doc, {
      startY: firstSectionY + 12,
      margin: { top: 72, left: 40, right: 40, bottom: 58 },
      tableWidth: contentW,
      body: Object.entries(payload.summary ?? {}).map(([k, v]) => [this.toTitle(k), String(v)]) as RowInput[],
      ...this.buildPlainTableTheme({ fontSize: 9, cellPadding: 6, ...tableTheme }),
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: contentW - 150 } },
      didParseCell: this.makeFirstColumnDidParse(theme?.firstColumnFillRgb),
      didDrawPage: hooks.didDrawPage
    });
    this.drawRoundedTableContainer(doc, 40, contentW, firstSectionY, (doc as any).lastAutoTable?.finalY ?? firstSectionY);
    if (this.isJpegDataUrl(payload.graphImageDataUrl)) {
      const snapshotMarkerY = (doc as any).lastAutoTable.finalY + 14;
      this.drawInfoSectionMarker(doc, snapshotMarkerY, contentW, 'Network Snapshot', theme?.sectionHeaderRgb);
      autoTable(doc, {
        startY: snapshotMarkerY + 12,
        margin: { top: 72, left: 40, right: 40, bottom: 58 },
        tableWidth: contentW,
        body: [['', '']] as RowInput[],
        styles: { fontSize: 9, cellPadding: 6, textColor: this.PDF_THEME.textBodyRgb, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: theme?.tableBorderRgb ?? this.TABLE_BORDER_RGB },
        bodyStyles: { lineWidth: this.TABLE_BORDER_WIDTH, lineColor: theme?.tableBorderRgb ?? this.TABLE_BORDER_RGB },
        theme: 'plain',
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
      const y = (doc as any).lastAutoTable.finalY + 10;
      const fit = this.fitRect(doc, this.getPageW(doc) - 80, 260, 40, y);
      doc.addImage(payload.graphImageDataUrl!, 'JPEG', fit.x, fit.y, fit.w, fit.h, undefined, 'FAST');
    }
    if (payload.nodes.length) {
      const nodeMarkerY = Math.max((doc as any).lastAutoTable?.finalY ?? 160, 160) + 18;
      this.drawInfoSectionMarker(doc, nodeMarkerY, contentW, 'Nodes', theme?.sectionHeaderRgb);
      autoTable(doc, {
        startY: nodeMarkerY + 12,
        margin: { top: 72, left: 40, right: 40, bottom: 58 },
        tableWidth: contentW,
        body: [['Node', 'Type', 'ID'], ...payload.nodes.slice(0, 150).map(n => [
          preparePdfValue(n.label || n.id, 34),
          preparePdfValue(n.type, 24),
          preparePdfValue(String(n.id || ''), 34)
        ])] as RowInput[],
        ...this.buildPlainTableTheme({ fontSize: 8, cellPadding: 5, ...tableTheme }),
        columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 90 }, 2: { cellWidth: 185 } },
        didParseCell: this.makeHeaderRowDidParse(theme?.headerRowFillRgb),
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    }
    if (payload.tables?.length) {
      payload.tables.forEach((t, idx) => {
        const sectionTitle = this.getReportSectionTitle(t, idx);
        const recordBlockRows = this.buildRecordBlockSectionRows(t);
        if (recordBlockRows.rows.length) {
          let markerY = ((doc as any).lastAutoTable.finalY ?? 160) + 18;
          markerY = this.resolveMarkerY(doc, markerY, 126);
          this.drawInfoSectionMarker(doc, markerY, contentW, sectionTitle, theme?.sectionHeaderRgb);
          const sectionStartPage = doc.getCurrentPageInfo().pageNumber;
          const reportBlockDidDrawPage = (data: any) => {
            hooks.didDrawPage(data);
            const pageNo = (data?.doc as jsPDF | undefined)?.getCurrentPageInfo?.().pageNumber ?? data?.pageNumber ?? sectionStartPage;
            if (pageNo !== sectionStartPage) {
              this.drawInfoSectionMarker(data.doc as jsPDF, 126, contentW, sectionTitle || 'Info', theme?.sectionHeaderRgb);
            }
          };
          autoTable(doc, {
            startY: markerY + 12,
            margin: { top: 139, left: 40, right: 40, bottom: 58 },
            tableWidth: contentW,
            body: recordBlockRows.rows,
            rowPageBreak: 'avoid',
            ...this.buildPlainTableTheme({
              fontSize: 8,
              cellPadding: 5,
              overflow: 'linebreak',
              valign: 'top',
              ...tableTheme
            }),
            columnStyles: { 0: { cellWidth: 132 }, 1: { cellWidth: contentW - 132 } },
            didParseCell: this.makeRecordBlockDidParse(recordBlockRows.titleRowIndexes, theme),
            didDrawPage: reportBlockDidDrawPage
          });
          this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
          return;
        }
        const structuredRows = this.buildStructuredSectionRows(t);
        const hasStructuredRows = structuredRows.length > 1;
        const tableRows = hasStructuredRows ? structuredRows : this.buildReportSectionRows(t.values ?? {});
        let markerY = ((doc as any).lastAutoTable.finalY ?? 160) + 18;
        markerY = this.resolveMarkerY(doc, markerY, 126);
        this.drawInfoSectionMarker(doc, markerY, contentW, sectionTitle, theme?.sectionHeaderRgb);
        const sectionStartPage = doc.getCurrentPageInfo().pageNumber;
        const reportSectionDidDrawPage = (data: any) => {
          hooks.didDrawPage(data);
          const pageNo = (data?.doc as jsPDF | undefined)?.getCurrentPageInfo?.().pageNumber ?? data?.pageNumber ?? sectionStartPage;
          if (pageNo !== sectionStartPage) {
            this.drawInfoSectionMarker(data.doc as jsPDF, 126, contentW, sectionTitle || 'Info', theme?.sectionHeaderRgb);
          }
        };
        autoTable(doc, {
          startY: markerY + 12,
          margin: { top: 139, left: 40, right: 40, bottom: 58 },
          tableWidth: contentW,
          body: tableRows as RowInput[],
          ...this.buildPlainTableTheme({
            fontSize: hasStructuredRows ? 7.4 : 9,
            cellPadding: hasStructuredRows ? 4 : 6,
            overflow: hasStructuredRows ? 'linebreak' : undefined,
            valign: hasStructuredRows ? 'top' : undefined,
            ...tableTheme
          }),
          columnStyles: hasStructuredRows ? this.buildStructuredColumnStyles(t.columns ?? [], contentW) : { 0: { cellWidth: 170 }, 1: { cellWidth: contentW - 170 } },
          didParseCell: hasStructuredRows ? this.makeHeaderRowDidParse(theme?.headerRowFillRgb) : this.makeHeaderAndFirstColumnDidParse(theme?.headerRowFillRgb, theme?.firstColumnFillRgb),
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
      this.drawInfoSectionMarker(doc, edgeMarkerY, contentW, 'Connection Matrix', theme?.sectionHeaderRgb);
      autoTable(doc, {
        startY: edgeMarkerY + 12,
        margin: { top: 72, left: 40, right: 40, bottom: 58 },
        tableWidth: contentW,
        body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 200).map((e, i) => [
          String(i + 1),
          preparePdfValue(e.from, 30),
          preparePdfValue(e.to, 30),
          preparePdfValue(e.label ?? '', 30)
        ])] as RowInput[],
        ...this.buildPlainTableTheme({ fontSize: 7.4, cellPadding: 4, ...tableTheme }),
        columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 150 }, 2: { cellWidth: 150 }, 3: { cellWidth: 177 } },
        didParseCell: this.makeHeaderRowDidParse(theme?.headerRowFillRgb),
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    }
    this.finalizeDocumentPages(doc, payload, meta, theme);
    return this.docToBytes(doc);
  }

  private buildRecordBlockSectionRows(table: GraphReportTableRow): { rows: RowInput[]; titleRowIndexes: Set<number> } {
    const rows: RowInput[] = [];
    const titleRowIndexes = new Set<number>();
    (table.recordBlocks ?? []).forEach((block, index) => {
      const title = String(block?.title || `Record ${index + 1}`).trim() || `Record ${index + 1}`;
      titleRowIndexes.add(rows.length);
      rows.push([{ content: title, colSpan: 2 }] as RowInput);
      const fieldRows = this.buildReportSectionRows(block?.values ?? {}).slice(1);
      if (!fieldRows.length) {
        rows.push(['Status', 'No details available'] as RowInput);
        return;
      }
      fieldRows.forEach(row => rows.push(row as RowInput));
    });
    return { rows, titleRowIndexes };
  }

  private makeRecordBlockDidParse(titleRowIndexes: Set<number>, theme: PdfExportTheme | null): (data: any) => void {
    return (data: any) => {
      if (titleRowIndexes.has(data?.row?.index)) {
        data.cell.styles.fillColor = theme?.sectionHeaderRgb ?? this.PDF_THEME.sectionHeaderRgb;
        data.cell.styles.textColor = theme?.whiteRgb ?? this.PDF_THEME.whiteRgb;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 8.6;
        data.cell.styles.cellPadding = { top: 7, right: 8, bottom: 7, left: 9 };
        return;
      }
      if (data?.column?.index === 0) {
        data.cell.styles.fillColor = theme?.firstColumnFillRgb ?? this.PDF_THEME.headerBackgroundRgb;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = this.PDF_THEME.textSecondaryRgb;
        data.cell.styles.fontSize = 7.7;
      }
      const rawRow = Array.isArray(data?.row?.raw) ? data.row.raw : [];
      const fieldLabel = String(rawRow[0] ?? '');
      if (data?.column?.index === 1 && this.isTechnicalPdfField(fieldLabel)) {
        data.cell.styles.font = 'courier';
        data.cell.styles.fontSize = 7.2;
        data.cell.styles.cellPadding = { top: 6, right: 7, bottom: 6, left: 7 };
      }
    };
  }

  private isTechnicalPdfField(label: string): boolean {
    return /(password|hash|url|link|domain|email|username|ioc|file|identifier|ip|wallet|address)/i.test(label);
  }

  private drawCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, subtitle: string, theme: PdfExportTheme | null): number {
    this.drawReportBackgroundPattern(doc);
    const W = this.getPageW(doc);
    if (theme) {
      return this.drawCredentialCover(doc, payload, meta, subtitle, theme);
    }
    doc.setFillColor(...this.PDF_THEME.textPrimaryRgb);
    doc.rect(0, 0, W, 138, 'F');
    doc.setTextColor(...this.PDF_THEME.whiteRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(this.fitSingleLine(doc, payload.title || 'Network Report', W - 80), 40, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...this.PDF_THEME.softTextRgb);
    const sessionLines = this.getSessionLines(doc, this.getReportContext(payload), W - 80);
    const isAlertCover = meta.kindLabel === 'Brand Alerts';
    if (isAlertCover) {
      const infoTop = 58;
      const infoBottom = 126;
      const lineHeight = 12;
      const totalHeight = lineHeight * (2 + sessionLines.length);
      const startY = infoTop + Math.max(0, ((infoBottom - infoTop) - totalHeight) / 2) + 9;
      doc.text(`${subtitle} | ${meta.kindLabel}`, 40, startY);
      doc.text(sessionLines, 40, startY + lineHeight);
      doc.text(this.fitSingleLine(doc, `Generated: ${meta.generatedAt}`, W - 80), 40, startY + lineHeight + (sessionLines.length * lineHeight));
    }
    else {
      doc.text(`${subtitle} | ${meta.kindLabel}`, 40, 70);
      this.drawSessionBlock(doc, this.getReportContext(payload), meta.generatedAt, 40, 90, W - 80, 12);
    }
    doc.setDrawColor(...this.PDF_THEME.softTextRgb);
    doc.setLineWidth(0.5);
    doc.line(40, 146, W - 40, 146);
    doc.setTextColor(...this.PDF_THEME.textPrimaryRgb);
    return 160;
  }

  private drawCredentialCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, subtitle: string, theme: PdfExportTheme): number {
    const W = this.getPageW(doc);
    const H = this.getPageH(doc);
    const contentX = 48;
    const contentW = W - 96;
    doc.setFillColor(...theme.whiteRgb);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...theme.coverBandRgb);
    doc.rect(0, 0, 14, H, 'F');
    doc.setFillColor(...theme.headerAccentRgb);
    doc.rect(14, 0, W - 14, 6, 'F');

    this.drawCoverPill(doc, contentX, 60, subtitle.toUpperCase(), theme.headerRowFillRgb, theme.sectionHeaderRgb);
    const kindText = String(meta.kindLabel || '').toUpperCase();
    this.drawCoverPill(doc, contentX + 112, 60, kindText, theme.whiteRgb, theme.textSecondaryRgb, theme.coverPanelBorderRgb);
    this.drawTenantBrand(doc, meta, W - contentX, 30, 150, 32, theme.textPrimaryRgb);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(...theme.textPrimaryRgb);
    const titleLines = (doc.splitTextToSize(payload.title || 'Intelligence Report', contentW) as string[]).slice(0, 3);
    const titleY = 190;
    doc.text(titleLines, contentX, titleY, { lineHeightFactor: 1.1 });
    const titleBottom = titleY + ((titleLines.length - 1) * 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...theme.textSecondaryRgb);
    doc.text(this.getCoverSubtitle(meta), contentX, titleBottom + 34);
    doc.setDrawColor(...theme.dividerRgb);
    doc.setLineWidth(1.6);
    doc.line(contentX, titleBottom + 58, contentX + 74, titleBottom + 58);

    const infoY = 520;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...theme.sectionHeaderRgb);
    doc.text('REPORT INFORMATION', contentX, infoY);
    doc.setDrawColor(...theme.coverPanelBorderRgb);
    doc.setLineWidth(0.7);
    doc.line(contentX, infoY + 14, W - contentX, infoY + 14);
    doc.line(contentX + (contentW / 2), infoY + 30, contentX + (contentW / 2), infoY + 136);
    this.drawCoverInformation(doc, contentX, infoY + 42, (contentW / 2) - 24, 'Prepared By', meta.tenantName, theme);
    this.drawCoverInformation(doc, contentX + (contentW / 2) + 24, infoY + 42, (contentW / 2) - 24, 'Generated', meta.generatedAt, theme);
    this.drawCoverInformation(doc, contentX, infoY + 104, (contentW / 2) - 24, 'Report Family', meta.kindLabel, theme);
    this.drawCoverInformation(doc, contentX + (contentW / 2) + 24, infoY + 104, (contentW / 2) - 24, 'Classification', 'Confidential', theme);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...theme.sectionHeaderRgb);
    doc.text('AUTHORIZED RECIPIENTS ONLY', contentX, H - 86);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...theme.textMutedRgb);
    doc.text('Prepared for authorized recipients. Handle according to organizational policy.', contentX, H - 69);
    doc.setDrawColor(...theme.coverPanelBorderRgb);
    doc.setLineWidth(0.6);
    doc.line(contentX, H - 50, W - contentX, H - 50);
    doc.setFontSize(8);
    doc.setTextColor(...theme.footerTextRgb);
    doc.text(`${meta.tenantName} | ${meta.kindLabel}`, contentX, H - 30);
    doc.text(meta.generatedAt, W - contentX, H - 30, { align: 'right' });

    doc.addPage();
    this.drawReportBackgroundPattern(doc);
    return 82;
  }

  private drawCoverPill(doc: jsPDF, x: number, y: number, label: string, fillRgb: [number, number, number], textRgb: [number, number, number], borderRgb?: [number, number, number]): void {
    const text = String(label || '').trim();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    const w = Math.max(64, doc.getTextWidth(text) + 22);
    doc.setFillColor(...fillRgb);
    doc.roundedRect(x, y - 12, w, 20, 5, 5, 'F');
    if (borderRgb) {
      doc.setDrawColor(...borderRgb);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y - 12, w, 20, 5, 5, 'S');
    }
    doc.setTextColor(...textRgb);
    doc.text(text, x + 11, y + 1);
  }

  private drawCoverInformation(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, theme: PdfExportTheme): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...theme.coverLabelRgb);
    doc.text(String(label || '').toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...theme.textPrimaryRgb);
    doc.text(this.fitSingleLine(doc, value || '-', width), x, y + 21);
  }

  private getCoverSubtitle(meta: GraphReportMeta): string {
    if (meta.kindLabel === 'Brand Alerts') {
      return 'Brand alert intelligence dossier';
    }
    if (meta.kindLabel === 'CTI Network') {
      return 'CTI intelligence dossier';
    }
    if (meta.kindLabel === 'Social Network') {
      return 'Social intelligence dossier';
    }
    return 'Credential exposure intelligence dossier';
  }

  private makeHeaderFooterHooks(payload: GraphReportPayload, meta: GraphReportMeta, theme: PdfExportTheme | null): {
    didDrawPage: (data: any) => void;
  } {
    const drawnPages = new Set<number>();
    const drawHeader = (doc: jsPDF, section: string) => {
      if (theme) {
        this.drawCredentialPageHeader(doc, payload.title || 'Network Report', section, meta, theme);
        return;
      }
      this.drawStandardPageHeader(doc, payload.title || 'Network Report', section, 54);
    };
    const didDrawPage = (data: any) => {
      const pageNo = data?.pageNumber ?? docPageNumberSafe(data?.doc);
      if (drawnPages.has(pageNo)) {
        return;
      }
      drawnPages.add(pageNo);
      const section = pageNo === 1 ? 'Overview' : 'Details';
      const d = data?.doc as jsPDF;
      if (!(theme && pageNo === 1)) {
        drawHeader(d, section);
      }
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

  private finalizeDocumentPages(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, theme: PdfExportTheme | null): void {
    const totalPages = doc.getNumberOfPages();
    const pageWidth = this.getPageW(doc);
    const pageHeight = this.getPageH(doc);
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      if (page === 1) {
        continue;
      }
      if (theme) {
        this.drawCredentialPageHeader(doc, payload.title || 'Network Report', 'Details', meta, theme);
      }
      else {
        this.drawStandardPageHeader(doc, payload.title || 'Network Report', 'Details', 54);
      }
      doc.setFillColor(...(theme?.tableRowBgRgb ?? this.PDF_THEME.whiteRgb));
      doc.rect(0, pageHeight - 58, pageWidth, 58, 'F');
      this.drawStandardFooter(doc, this.getReportContext(payload), meta, page - 1, totalPages - 1, 54, 32);
    }
  }

  private drawCredentialPageHeader(doc: jsPDF, title: string, section: string, meta: GraphReportMeta, theme: PdfExportTheme): void {
    const W = this.getPageW(doc);
    doc.setFillColor(...theme.tableRowBgRgb);
    doc.rect(0, 0, W, 58, 'F');
    doc.setFillColor(...theme.headerAccentRgb);
    doc.rect(0, 0, W, 5, 'F');
    doc.setDrawColor(...theme.tableBorderRgb);
    doc.line(40, 58, W - 40, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...theme.coverBandRgb);
    doc.text(this.fitSingleLine(doc, title, W - 245), 40, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...theme.sectionHeaderRgb);
    doc.text(this.fitSingleLine(doc, `${meta.kindLabel} / ${section}`, 190), W - 40, 24, { align: 'right' });
    doc.setFontSize(7.4);
    doc.setTextColor(...theme.textMutedRgb);
    doc.text(this.fitSingleLine(doc, meta.generatedAt, 190), W - 40, 39, { align: 'right' });
  }

  private getTableTheme(theme: PdfExportTheme | null): {
    rowFillColor?: [number, number, number];
    alternateRowFillColor?: [number, number, number];
    lineColor?: [number, number, number];
  } {
    if (!theme) {
      return {};
    }
    return {
      rowFillColor: theme.tableRowBgRgb,
      alternateRowFillColor: theme.tableRowAltBgRgb,
      lineColor: theme.tableBorderRgb
    };
  }

  private buildStructuredSectionRows(table: GraphReportTableRow): string[][] {
    const columns = table.columns ?? [];
    const rows = table.rows ?? [];
    if (!columns.length || !rows.length) {
      return [];
    }
    return [
      columns,
      ...rows.map(row => columns.map(column => String(row[column] ?? '-')))
    ];
  }

  private buildStructuredColumnStyles(columns: string[], contentW: number): Record<number, { cellWidth: number }> {
    const normalized = columns.map(column => column.toLowerCase());
    if (normalized.includes('email / username')) {
      return {
        0: { cellWidth: 28 },
        1: { cellWidth: 112 },
        2: { cellWidth: 98 },
        3: { cellWidth: 154 },
        4: { cellWidth: contentW - 392 }
      };
    }
    if (normalized.includes('title') && normalized.includes('url')) {
      return {
        0: { cellWidth: 28 },
        1: { cellWidth: 142 },
        2: { cellWidth: 154 },
        3: { cellWidth: 46 },
        4: { cellWidth: 72 },
        5: { cellWidth: contentW - 442 }
      };
    }
    const fallbackWidth = contentW / Math.max(columns.length, 1);
    return Object.fromEntries(columns.map((_, index) => [index, { cellWidth: fallbackWidth }]));
  }
}
