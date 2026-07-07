import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { GraphReportMeta, GraphReportPayload, GraphReportTableRow } from '../../model/report/report-export.model';
import { GraphExportService } from './graph-export.service';

interface DocumentPdfTheme {
  coverBandRgb: [number, number, number];
  coverSubtitleRgb: [number, number, number];
  coverPanelRgb: [number, number, number];
  coverPanelBorderRgb: [number, number, number];
  coverLabelRgb: [number, number, number];
  dividerRgb: [number, number, number];
  headerAccentRgb: [number, number, number];
  sectionHeaderRgb: [number, number, number];
  tableRowBgRgb: [number, number, number];
  tableRowAltBgRgb: [number, number, number];
  tableBorderRgb: [number, number, number];
  headerRowFillRgb: [number, number, number];
  firstColumnFillRgb: [number, number, number];
}

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
    const theme = this.getDocumentTheme(payload);
    const tableTheme = this.getTableTheme(theme);
    const hooks = this.makeHeaderFooterHooks(payload, meta, theme);
    const firstSectionY = this.drawCover(doc, payload, meta, 'Document Report', theme);
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - 80;
    this.drawInfoSectionMarker(doc, firstSectionY, contentW, 'Executive Summary', theme?.sectionHeaderRgb);
    autoTable(doc, {
      startY: firstSectionY + 12,
      margin: { left: 40, right: 40 },
      tableWidth: contentW,
      body: Object.entries(payload.summary ?? {}).map(([k, v]) => [k, String(v)]) as RowInput[],
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
        margin: { left: 40, right: 40 },
        tableWidth: contentW,
        body: [['', '']] as RowInput[],
        styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: theme?.tableBorderRgb ?? this.TABLE_BORDER_RGB },
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
        margin: { left: 40, right: 40 },
        tableWidth: contentW,
        body: [['Node', 'Type', 'ID'], ...payload.nodes.slice(0, 150).map(n => [n.label || n.id, n.type, this.truncateWithEllipsis(String(n.id || ''), 20)])] as RowInput[],
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
            const pageNo = data?.pageNumber ?? (data?.doc as jsPDF | undefined)?.getCurrentPageInfo?.().pageNumber ?? sectionStartPage;
            if (pageNo !== sectionStartPage) {
              this.drawInfoSectionMarker(data.doc as jsPDF, 126, contentW, sectionTitle || 'Info', theme?.sectionHeaderRgb);
            }
          };
          autoTable(doc, {
            startY: markerY + 12,
            margin: { top: 139, left: 40, right: 40, bottom: 58 },
            tableWidth: contentW,
            body: recordBlockRows.rows,
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
        const reportSectionDidDrawPage = (data: any) => {
          hooks.didDrawPage(data);
          this.drawInfoSectionMarker(data.doc as jsPDF, 126, contentW, sectionTitle || 'Info', theme?.sectionHeaderRgb);
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
        margin: { left: 40, right: 40 },
        tableWidth: contentW,
        body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 200).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? ''])] as RowInput[],
        ...this.buildPlainTableTheme({ fontSize: 8, cellPadding: 5, ...tableTheme }),
        columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 150 }, 2: { cellWidth: 150 }, 3: { cellWidth: 177 } },
        didParseCell: this.makeHeaderRowDidParse(theme?.headerRowFillRgb),
        didDrawPage: hooks.didDrawPage
      });
      this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    }
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

  private makeRecordBlockDidParse(titleRowIndexes: Set<number>, theme: DocumentPdfTheme | null): (data: any) => void {
    return (data: any) => {
      if (titleRowIndexes.has(data?.row?.index)) {
        data.cell.styles.fillColor = theme?.headerRowFillRgb ?? [226, 232, 240];
        data.cell.styles.textColor = theme?.sectionHeaderRgb ?? [15, 23, 42];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 8.2;
        data.cell.styles.cellPadding = { top: 6, right: 7, bottom: 5, left: 8 };
        return;
      }
      if (data?.column?.index === 0) {
        data.cell.styles.fillColor = theme?.firstColumnFillRgb ?? [248, 250, 252];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [71, 85, 105];
      }
    };
  }

  private drawCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, subtitle: string, theme: DocumentPdfTheme | null): number {
    this.drawReportBackgroundPattern(doc);
    const W = this.getPageW(doc);
    if (theme) {
      return this.drawCredentialCover(doc, payload, meta, subtitle, theme);
    }
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 138, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(this.fitSingleLine(doc, payload.title || 'Network Report', W - 80), 40, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    const sessionLines = this.getSessionLines(doc, payload.sessionName || '—', W - 80);
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
      this.drawSessionBlock(doc, payload.sessionName || '—', meta.generatedAt, 40, 90, W - 80, 12);
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(40, 146, W - 40, 146);
    doc.setTextColor(15, 23, 42);
    return 160;
  }

  private drawCredentialCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, subtitle: string, theme: DocumentPdfTheme): number {
    const W = this.getPageW(doc);
    const contentX = 40;
    const contentW = W - 80;
    const coverH = 226;
    doc.setFillColor(...theme.coverBandRgb);
    doc.rect(0, 0, W, coverH, 'F');
    doc.setFillColor(...theme.headerAccentRgb);
    doc.rect(0, 0, W, 5, 'F');

    this.drawCoverPill(doc, contentX, 30, subtitle.toUpperCase(), theme.headerAccentRgb, [255, 255, 255]);
    const kindText = String(meta.kindLabel || '').toUpperCase();
    const kindW = Math.max(82, doc.getTextWidth(kindText) + 22);
    this.drawCoverPill(doc, W - contentX - kindW, 30, kindText, theme.coverPanelRgb, theme.coverLabelRgb, theme.coverPanelBorderRgb);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(this.fitSingleLine(doc, payload.title || 'Credentials Export', contentW - 18), contentX, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...theme.coverSubtitleRgb);
    doc.text('Credential exposure intelligence dossier', contentX, 92);

    doc.setFillColor(...theme.coverPanelRgb);
    doc.roundedRect(contentX, 108, contentW, 50, 7, 7, 'F');
    doc.setDrawColor(...theme.coverPanelBorderRgb);
    doc.setLineWidth(0.6);
    doc.roundedRect(contentX, 108, contentW, 50, 7, 7, 'S');
    doc.setDrawColor(...theme.coverPanelBorderRgb);
    doc.line(contentX + 262, 118, contentX + 262, 148);
    this.drawCoverMetaItem(doc, contentX + 16, 127, 232, 'Session', payload.sessionName || 'Stealerlogs Search', theme);
    this.drawCoverMetaItem(doc, contentX + 278, 127, contentW - 294, 'Generated', meta.generatedAt, theme);

    const cardGap = 10;
    const cardW = (contentW - (cardGap * 2)) / 3;
    const cardY = 174;
    this.drawCoverMetric(doc, contentX, cardY, cardW, 'Total Records', payload.summary?.['total_records'] ?? '-');
    this.drawCoverMetric(doc, contentX + cardW + cardGap, cardY, cardW, 'Stealer Records', payload.summary?.['stealer_records'] ?? '-');
    this.drawCoverMetric(doc, contentX + ((cardW + cardGap) * 2), cardY, cardW, 'Ranked Records', payload.summary?.['ranked_records'] ?? '-');

    doc.setDrawColor(...theme.dividerRgb);
    doc.setLineWidth(0.6);
    doc.line(contentX, coverH + 10, W - contentX, coverH + 10);
    doc.setTextColor(15, 23, 42);
    return coverH + 24;
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

  private drawCoverMetaItem(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, theme: DocumentPdfTheme): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(...theme.coverLabelRgb);
    doc.text(String(label || '').toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(this.fitSingleLine(doc, value || '-', width), x, y + 17);
  }

  private drawCoverMetric(doc: jsPDF, x: number, y: number, width: number, label: string, value: string | number): void {
    doc.setFillColor(45, 30, 34);
    doc.roundedRect(x, y, width, 34, 6, 6, 'F');
    doc.setDrawColor(127, 29, 29);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, 34, 6, 6, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(this.fitSingleLine(doc, String(value ?? '-'), width - 18), x + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(254, 202, 202);
    doc.text(this.fitSingleLine(doc, label.toUpperCase(), width - 18), x + 10, y + 27);
  }

  private makeHeaderFooterHooks(payload: GraphReportPayload, meta: GraphReportMeta, theme: DocumentPdfTheme | null): {
    didDrawPage: (data: any) => void;
  } {
    const drawnPages = new Set<number>();
    const drawHeader = (doc: jsPDF, section: string) => {
      if (theme) {
        this.drawCredentialPageHeader(doc, payload.title || 'Credentials Export', section, meta, theme);
        return;
      }
      this.drawStandardPageHeader(doc, payload.title || 'Network Report', section, 54);
    };
    const drawFooter = (doc: jsPDF, meta2: GraphReportMeta) => {
      const pageNo = doc.getCurrentPageInfo().pageNumber;
      const total = doc.getNumberOfPages();
      this.drawStandardFooter(doc, payload.sessionName || '—', meta2, pageNo, total, 54, 32);
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

  private drawCredentialPageHeader(doc: jsPDF, title: string, section: string, meta: GraphReportMeta, theme: DocumentPdfTheme): void {
    const W = this.getPageW(doc);
    doc.setFillColor(255, 251, 251);
    doc.rect(0, 0, W, 58, 'F');
    doc.setFillColor(...theme.headerAccentRgb);
    doc.rect(0, 0, W, 5, 'F');
    doc.setDrawColor(...theme.tableBorderRgb);
    doc.line(40, 58, W - 40, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(24, 24, 27);
    doc.text(this.fitSingleLine(doc, title, W - 245), 40, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(127, 29, 29);
    doc.text(this.fitSingleLine(doc, `${meta.kindLabel} / ${section}`, 190), W - 40, 24, { align: 'right' });
    doc.setFontSize(7.4);
    doc.setTextColor(100, 116, 139);
    doc.text(this.fitSingleLine(doc, meta.generatedAt, 190), W - 40, 39, { align: 'right' });
  }

  private getDocumentTheme(payload: GraphReportPayload): DocumentPdfTheme | null {
    if (String(payload.title || '').trim().toLowerCase() !== 'credentials export') {
      return null;
    }
    return {
      coverBandRgb: [24, 24, 27],
      coverSubtitleRgb: [241, 245, 249],
      coverPanelRgb: [39, 24, 27],
      coverPanelBorderRgb: [127, 29, 29],
      coverLabelRgb: [254, 202, 202],
      dividerRgb: [248, 113, 113],
      headerAccentRgb: [185, 28, 28],
      sectionHeaderRgb: [127, 29, 29],
      tableRowBgRgb: [255, 251, 251],
      tableRowAltBgRgb: [254, 247, 247],
      tableBorderRgb: [229, 199, 199],
      headerRowFillRgb: [254, 226, 226],
      firstColumnFillRgb: [255, 241, 242]
    };
  }

  private getTableTheme(theme: DocumentPdfTheme | null): {
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
