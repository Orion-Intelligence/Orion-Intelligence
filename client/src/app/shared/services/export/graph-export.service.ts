import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { GraphReportExportType, GraphReportMeta, GraphReportNode, GraphReportPayload, GraphReportTableRow } from '../../model/report/report-export.model';
@Injectable({ providedIn: 'root' })
export class GraphExportService {
  private readonly SECTION_RADIUS = 4;
  private readonly INTERNAL_HEADER_RGB: [number, number, number] = [51, 64, 84];
  private readonly TABLE_ROW_BG_RGB: [number, number, number] = [236, 242, 250];
  private readonly TABLE_ROW_ALT_BG_RGB: [number, number, number] = [224, 233, 245];

  exportByType(payload: GraphReportPayload, type: GraphReportExportType): void {
    if (type === 'json') {
      this.exportGraphJson(payload);
      return;
    }
    if (type === 'graph_pdf') {
      const bytes = this.buildGraphPdfBytes(payload);
      this.downloadBinary(bytes, 'application/pdf', `${this.buildSafeFilename(payload)}-graph-report.pdf`);
      return;
    }
    const bytes = this.buildDocPdfBytes(payload);
    this.downloadBinary(bytes, 'application/pdf', `${this.buildSafeFilename(payload)}-doc-report.pdf`);
  }

  private exportGraphJson(payload: GraphReportPayload): void {
    const jsonString = JSON.stringify(payload, null, 2);
    this.downloadText(jsonString, 'application/json', `${this.buildSafeFilename(payload)}-graph.json`);
  }

  private buildGraphPdfBytes(payload: GraphReportPayload): Uint8Array {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
    const meta = this.makeMeta(payload);
    const sectionsByPage: Record<number, string> = { 1: 'Overview' };
    this.drawGraphCover(doc, payload, meta);
    if (this.isJpegDataUrl(payload.graphImageDataUrl)) {
      doc.addPage();
      const graphPageNo = doc.getCurrentPageInfo().pageNumber;
      sectionsByPage[graphPageNo] = 'Graph Snapshot';
      this.drawGraphSnapshot(doc, payload);
    }
    doc.addPage();
    const analysisPageNo = doc.getCurrentPageInfo().pageNumber;
    sectionsByPage[analysisPageNo] = 'Graph Analysis';
    this.drawGraphAnalysisHeader(doc, payload, meta);
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - 80;
    const composition = this.buildTypeComposition(payload.nodes);
    const kpiTop = 122;
    const kpiH = 78;
    const gap = 12;
    const kpiW = (contentW - (gap * 3)) / 4;
    const kpis = [
      { label: 'Nodes', value: String(payload.nodes.length) },
      { label: 'Edges', value: String(payload.edges.length) },
      { label: 'Node Types', value: String(composition.length) },
      { label: 'Session', value: payload.sessionName || '-' }
    ];
    kpis.forEach((kpi, idx) => this.drawKpiCard(doc, 40 + idx * (kpiW + gap), kpiTop, kpiW, kpiH, kpi.label, kpi.value));
    const analysisDidDrawPage = (data: any) => {
      sectionsByPage[data.pageNumber] = 'Graph Analysis';
    };
    const analysisTableBase = {
      margin: { left: 40, right: 40, bottom: 58 },
      tableWidth: contentW,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak' as const,
        valign: 'middle' as const,
        textColor: [30, 41, 59] as [number, number, number],
        lineWidth: 0
      },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB as [
                    number,
                    number,
                    number
                ] },
      didDrawPage: analysisDidDrawPage,
      theme: 'plain' as const
    };
    this.drawInfoSectionMarker(doc, 220, contentW, 'Graph Summary');
    autoTable(doc, {
      startY: 232,
      body: Object.entries(payload.summary ?? {}).map(([k, v]) => [this.toTitle(k), String(v)]) as RowInput[],
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: contentW - 150 } },
      didParseCell: (data: any) => {
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [214, 226, 240];
        }
      },
      ...analysisTableBase
    });
    this.drawRoundedTableContainer(doc, 40, contentW, 220, (doc as any).lastAutoTable?.finalY ?? 220);
    const compositionMarkerY = (doc as any).lastAutoTable.finalY + 12;
    this.drawInfoSectionMarker(doc, compositionMarkerY, contentW, 'Node Type Distribution');
    autoTable(doc, {
      startY: compositionMarkerY + 12,
      body: composition.map(x => [x.type, String(x.count)]) as RowInput[],
      ...analysisTableBase
    });
    this.drawRoundedTableContainer(doc, 40, contentW, (doc as any).lastAutoTable?.startY ?? 232, (doc as any).lastAutoTable?.finalY ?? 232);
    const socialPlatformCounts = this.extractSocialPlatformCounts(payload);
    let platformPageNo: number | null = null;
    if (payload.graphKind === 'social' && socialPlatformCounts.length > 0) {
      doc.addPage();
      platformPageNo = doc.getCurrentPageInfo().pageNumber;
      sectionsByPage[platformPageNo] = 'Platform Inventory';
      this.drawConnectionMatrixHeader(doc, 'Platform Inventory', 'Detected social platforms in current graph');
      this.drawInfoSectionMarker(doc, 126, contentW, 'Platform Inventory');
      autoTable(doc, {
        startY: 138,
        margin: { top: 126, left: 40, right: 40, bottom: 58 },
        tableWidth: contentW,
        body: [['#', 'Platform', 'Node Count'], ...socialPlatformCounts.map((item, i) => [String(i + 1), item.name, String(item.count)])] as RowInput[],
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'top', lineWidth: 0 },
        bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, textColor: [30, 41, 59], lineWidth: 0 },
        alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
        didParseCell: (data: any) => {
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [207, 220, 236];
          }
        },
        didDrawPage: this.makeSectionHeaderCallback(sectionsByPage, 'Platform Inventory', 'Detected social platforms in current graph'),
        theme: 'plain'
      });
      this.drawRoundedTableContainer(doc, 40, contentW, 126, (doc as any).lastAutoTable?.finalY ?? 126);
    }
    let reportsPageNo: number | null = null;
    if (payload.tables?.length) {
      doc.addPage();
      reportsPageNo = doc.getCurrentPageInfo().pageNumber;
      sectionsByPage[reportsPageNo] = 'Report Sections';
      this.drawConnectionMatrixHeader(doc, 'Report Sections', 'Metadata, screenshot, and related reports');
      payload.tables.forEach((t, idx) => {
        let markerY = idx === 0 ? 126 : ((doc as any).lastAutoTable?.finalY ?? 126) + 18;
        markerY = this.resolveMarkerY(doc, markerY, 126, () => {
          const pageNo = doc.getCurrentPageInfo().pageNumber;
          sectionsByPage[pageNo] = 'Report Sections';
          this.drawConnectionMatrixHeader(doc, 'Report Sections', 'Metadata, screenshot, and related reports');
        });
        this.drawInfoSectionMarker(doc, markerY, contentW, t.title);
        autoTable(doc, {
          startY: markerY + 12,
          margin: { top: 126, left: 40, right: 40, bottom: 58 },
          tableWidth: contentW,
          body: Object.entries(t.values ?? {}).map(([k, v]) => [k, v]) as RowInput[],
          styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
          columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: contentW - 170 } },
          bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
          alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
          didParseCell: (data: any) => {
            if (data.column.index === 0) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [214, 226, 240];
            }
          },
          didDrawPage: this.makeSectionHeaderCallback(sectionsByPage, 'Report Sections', 'Metadata, screenshot, and related reports'),
          theme: 'plain'
        });
        const screenshotDataUrl = this.findTableScreenshotDataUrl(t);
        if (screenshotDataUrl) {
          const lastY = (doc as any).lastAutoTable?.finalY ?? (markerY + 12);
          const imageY = this.resolveMarkerY(doc, lastY + 10, 126, () => {
            const pageNo = doc.getCurrentPageInfo().pageNumber;
            sectionsByPage[pageNo] = 'Report Sections';
            this.drawConnectionMatrixHeader(doc, 'Report Sections', 'Metadata, screenshot, and related reports');
            this.drawInfoSectionMarker(doc, 126, contentW, t.title);
          });
          this.drawScreenshotPreview(doc, screenshotDataUrl, 40, imageY, contentW, 190);
        }
      });
    }
    doc.addPage();
    const edgesPageNo = doc.getCurrentPageInfo().pageNumber;
    sectionsByPage[edgesPageNo] = 'Connection Matrix';
    this.drawConnectionMatrixHeader(doc, 'Connection Matrix', 'Relationship listing from current graph state');
    this.drawInfoSectionMarker(doc, 126, contentW, 'Connection Matrix');
    autoTable(doc, {
      startY: 138,
      margin: { top: 126, left: 40, right: 40, bottom: 58 },
      tableWidth: contentW,
      body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 240).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? ''])] as RowInput[],
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [207, 220, 236];
        }
      },
      didDrawPage: this.makeSectionHeaderCallback(sectionsByPage, 'Connection Matrix', 'Relationship listing from current graph state'),
      theme: 'plain'
    });
    const totalPages = doc.getNumberOfPages();
    this.drawGraphToc(doc, payload, {
      graphPage: this.isJpegDataUrl(payload.graphImageDataUrl) ? 2 : null,
      analysisPage: this.isJpegDataUrl(payload.graphImageDataUrl) ? 3 : 2,
      platformPage: platformPageNo,
      reportsPage: reportsPageNo,
      edgesPage: edgesPageNo
    });
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      if (page !== 1) {
        this.drawGraphChrome(doc, payload, meta, sectionsByPage[page] ?? 'Details');
      }
      this.drawGraphFooter(doc, payload, meta, page, totalPages);
    }
    return this.docToBytes(doc);
  }

  private drawGraphCover(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta): void {
    this.drawReportBackgroundPattern(doc);
    const W = this.drawDarkTopBand(doc, 168, false);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(this.fitSingleLine(doc, payload.title || 'Graph Intelligence Report', W - 80), 40, 64);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(219, 234, 254);
    doc.text(`${meta.kindLabel} • Graph-Centric Report`, 40, 92);
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    const sessionText = this.compactSession(payload.sessionName || '—');
    const sessionLines = doc.splitTextToSize(`Session: ${sessionText}`, W - 80) as string[];
    doc.text(sessionLines, 40, 116);
    const generatedY = 116 + (sessionLines.length * 14);
    doc.text(this.fitSingleLine(doc, `Generated: ${meta.generatedAt}`, W - 80), 40, generatedY);
  }

  private drawGraphToc( doc: jsPDF, payload: GraphReportPayload, pages: { graphPage: number | null; analysisPage: number; platformPage: number | null; reportsPage: number | null; edgesPage: number; } ): void {
    doc.setPage(1);
    const W = this.getPageW(doc);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.line(40, 190, W - 40, 190);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Report Sections', 40, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Click any section to jump directly to that page.', 40, 230);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    const sectionItems: Array<{
            label: string;
            page: number;
        }> = [];
    if (pages.graphPage) {
      sectionItems.push({ label: 'Graph Snapshot', page: pages.graphPage });
    }
    sectionItems.push({ label: 'Structural Analysis', page: pages.analysisPage });
    if (pages.platformPage) {
      sectionItems.push({ label: 'Platform Inventory', page: pages.platformPage });
    }
    if (pages.reportsPage) {
      sectionItems.push({ label: 'Report Sections', page: pages.reportsPage });
    }
    sectionItems.push({ label: 'Connection Matrix', page: pages.edgesPage });
    const cardX = 40;
    const cardY = 232;
    const cardW = W - 80;
    const rowH = 22;
    const rowGap = 7;
    const innerPad = 14;
    const topPad = 12;
    const bottomPad = 12;
    const cardH = topPad + bottomPad + (sectionItems.length * rowH) + (Math.max(0, sectionItems.length - 1) * rowGap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, cardY, cardW, cardH, this.SECTION_RADIUS, this.SECTION_RADIUS, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cardY, cardW, cardH, this.SECTION_RADIUS, this.SECTION_RADIUS, 'S');
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(cardX, cardY, 5, cardH, this.SECTION_RADIUS, this.SECTION_RADIUS, 'F');

    sectionItems.forEach((item, index) => {
      const rowY = cardY + topPad + (index * (rowH + rowGap));
      const rowX = cardX + 10;
      const rowW = cardW - 20;
      doc.setFillColor(index % 2 === 0 ? 238 : 232, index % 2 === 0 ? 244 : 239, index % 2 === 0 ? 251 : 247);
      doc.roundedRect(rowX, rowY, rowW, rowH, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.35);
      doc.roundedRect(rowX, rowY, rowW, rowH, 3, 3, 'S');
      doc.setFillColor(51, 65, 85);
      doc.circle(rowX + 8, rowY + 11, 2.2, 'F');

      const rowLabel = `${index + 1}. ${item.label}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.textWithLink(this.fitSingleLine(doc, rowLabel, cardW - 154), rowX + innerPad, rowY + 14, { pageNumber: item.page });

      const pillText = `Page ${item.page}`;
      const pillW = Math.max(44, doc.getTextWidth(pillText) + 14);
      const pillX = rowX + rowW - innerPad - pillW;
      doc.setFillColor(51, 64, 84);
      doc.roundedRect(pillX, rowY + 4, pillW, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(pillText, pillX + 7, rowY + 13);
    });
    const composition = this.buildTypeComposition(payload.nodes).slice(0, 7);
    this.drawInfoSectionMarker(doc, 370, W - 80, 'Top Node Types');
    autoTable(doc, {
      startY: 382,
      margin: { left: 40, right: 40 },
      tableWidth: W - 80,
      body: [['Type', 'Count'], ...composition.map(item => [item.type, String(item.count)])] as RowInput[],
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineWidth: 0 },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [207, 220, 236];
        }
      },
      theme: 'plain'
    });
    this.drawRoundedTableContainer(doc, 40, W - 80, 370, (doc as any).lastAutoTable?.finalY ?? 370);
    if (payload.graphKind === 'social') {
      const platformCounts = this.extractSocialPlatformCounts(payload);
      const platformMarkerY = (doc as any).lastAutoTable.finalY + 10;
      this.drawInfoSectionMarker(doc, platformMarkerY, W - 80, `Found Social Platforms (${platformCounts.length})`);
      autoTable(doc, {
        startY: platformMarkerY + 12,
        margin: { left: 40, right: 40 },
        tableWidth: W - 80,
        body: [['Platform', 'Count'], ...platformCounts.slice(0, 12).map(item => [item.name, String(item.count)])] as RowInput[],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineWidth: 0 },
        bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
        alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
        didParseCell: (data: any) => {
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [207, 220, 236];
          }
        },
        theme: 'plain'
      });
      this.drawRoundedTableContainer(doc, 40, W - 80, (doc as any).lastAutoTable?.startY ?? 0, (doc as any).lastAutoTable?.finalY ?? 0);
    }
  }

  private drawGraphSnapshot(doc: jsPDF, payload: GraphReportPayload): void {
    this.drawReportBackgroundPattern(doc);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Expanded Graph View', 40, 88);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Snapshot captured from the rendered graph canvas at export time.', 40, 104);
    const fit = this.fitRectToPage(doc, 40, 146, 40, 122);
    const img = doc.getImageProperties(payload.graphImageDataUrl as string);
    let imgW = fit.w;
    let imgH = (imgW * img.height) / img.width;
    if (imgH > fit.h) {
      const ratio = fit.h / imgH;
      imgH = fit.h;
      imgW = imgW * ratio;
    }
    const safeScale = 0.94;
    imgW = imgW * safeScale;
    imgH = imgH * safeScale;
    const drawX = fit.x + (fit.w - imgW) / 2;
    const drawY = fit.y + (fit.h - imgH) / 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.rect(fit.x, fit.y, fit.w, fit.h);
    doc.addImage(payload.graphImageDataUrl as string, 'JPEG', drawX, drawY, imgW, imgH, undefined, 'FAST');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nodes: ${payload.nodes.length}   Edges: ${payload.edges.length}`, 40, this.getPageH(doc) - 56);
  }

  private drawGraphAnalysisHeader(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta): void {
    this.drawReportBackgroundPattern(doc);
    const W = this.drawDarkTopBand(doc, 30, true);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Graph Analysis', 56, 104);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(219, 234, 254);
    const compactSession = this.compactSession(payload.sessionName || '-');
    doc.text(this.fitSingleLine(doc, `${meta.kindLabel} | Session: ${compactSession}`, 290), W - 56, 104, { align: 'right' });
  }

  private drawConnectionMatrixHeader(doc: jsPDF, title: string, subtitle: string): void {
    const W = this.getPageW(doc);
    doc.setFillColor(...this.INTERNAL_HEADER_RGB);
    doc.roundedRect(40, 84, W - 80, 30, this.SECTION_RADIUS, this.SECTION_RADIUS, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 56, 104);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(219, 234, 254);
    doc.text(this.fitSingleLine(doc, subtitle, 300), W - 56, 104, { align: 'right' });
  }

  private drawGraphChrome(doc: jsPDF, payload: GraphReportPayload, _meta: GraphReportMeta, section: string): void {
    this.drawStandardPageHeader(doc, payload.title || 'Graph Report', section, 56);
  }

  private drawGraphFooter(doc: jsPDF, payload: GraphReportPayload, meta: GraphReportMeta, pageNo: number, totalPages: number): void {
    const W = this.getPageW(doc);
    const H = this.getPageH(doc);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, H - 40, W - 40, H - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const compactSession = this.compactSession(payload.sessionName || '—');
    doc.text(this.fitSingleLine(doc, `${meta.kindLabel} • ${compactSession} • ${meta.generatedAt}`, W - 170), 40, H - 24);
    doc.text(`Page ${pageNo} of ${totalPages}`, W - 40, H - 24, { align: 'right' });
  }

  private drawKpiCard(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string): void {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, this.SECTION_RADIUS, this.SECTION_RADIUS, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, this.SECTION_RADIUS, this.SECTION_RADIUS, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x + 12, y + 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 12, y + 50);
  }

  private toTitle(input: string): string {
    return input.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private buildDocPdfBytes(payload: GraphReportPayload): Uint8Array {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
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
      styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: contentW - 150 } },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
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
        styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59], lineWidth: 0 },
        bodyStyles: { lineWidth: 0 },
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
      body: [['Node', 'Type', 'ID'], ...payload.nodes.slice(0, 150).map(n => [n.label || n.id, n.type, n.id])] as RowInput[],
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
      columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 110 }, 2: { cellWidth: 150 } },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
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
      payload.tables.forEach(t => {
        let markerY = ((doc as any).lastAutoTable.finalY ?? 160) + 18;
        markerY = this.resolveMarkerY(doc, markerY, 86);
        this.drawInfoSectionMarker(doc, markerY, contentW, t.title);
        autoTable(doc, {
          startY: markerY + 12,
          margin: { left: 40, right: 40 },
          tableWidth: contentW,
          body: Object.entries(t.values ?? {}).map(([k, v]) => [k, v]) as RowInput[],
          styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
          columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: contentW - 170 } },
          bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
          alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
          didParseCell: (data: any) => {
            if (data.column.index === 0) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [214, 226, 240];
            }
          },
          theme: 'plain',
          didDrawPage: hooks.didDrawPage
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
    const edgeMarkerY = (doc as any).lastAutoTable.finalY + 18;
    this.drawInfoSectionMarker(doc, edgeMarkerY, contentW, 'Connection Matrix');
    autoTable(doc, {
      startY: edgeMarkerY + 12,
      margin: { left: 40, right: 40 },
      tableWidth: contentW,
      body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 200).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? ''])] as RowInput[],
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
      columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 150 }, 2: { cellWidth: 150 }, 3: { cellWidth: 177 } },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: 0 },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB },
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
    doc.text(`${subtitle} • ${meta.kindLabel}`, 40, 70);
    const sessionText = this.compactSession(payload.sessionName || '—');
    const sessionLines = doc.splitTextToSize(`Session: ${sessionText}`, W - 80) as string[];
    doc.text(sessionLines, 40, 90);
    const generatedY = 90 + (sessionLines.length * 12);
    doc.text(this.fitSingleLine(doc, `Generated: ${meta.generatedAt}`, W - 80), 40, generatedY);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(40, 146, W - 40, 146);
    doc.setTextColor(15, 23, 42);
  }

  private makeHeaderFooterHooks(payload: GraphReportPayload, meta: GraphReportMeta): {
        didDrawPage: (data: any) => void;
        drawHeader: (doc: jsPDF, section: string) => void;
        drawFooter: (doc: jsPDF, meta: any) => void;
    } {
    const drawHeader = (doc: jsPDF, section: string) => {
      this.drawStandardPageHeader(doc, payload.title || 'Network Report', section, 54);
    };
    const drawFooter = (doc: jsPDF, meta2: any) => {
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
    return { didDrawPage, drawHeader, drawFooter };
  }

  private buildTypeComposition(nodes: GraphReportNode[]): {
        type: string;
        count: number;
    }[] {
    const counts: Record<string, number> = {};
    nodes.forEach(n => {
      const key = this.normalizeNodeType(n.type || 'unknown');
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }

  private normalizeNodeType(type: string): string {
    const normalized = String(type || '').trim().toLowerCase();
    if (!normalized) {
      return 'unknown';
    }
    if (normalized === 'circularimage' || normalized === 'icon') {
      return 'entity';
    }
    if (normalized === 'dot') {
      return 'property';
    }
    return normalized;
  }

  private extractSocialPlatformCounts(payload: GraphReportPayload): Array<{
        name: string;
        count: number;
    }> {
    if (payload.graphKind !== 'social') {
      return [];
    }
    const counts = new Map<string, number>();
    payload.nodes.forEach(node => {
      const id = String(node.id ?? '');
      const match = id.match(/^platform-[^|]+\|([^|]+)\|/i);
      if (match?.[1]) {
        const name = match[1].toLowerCase();
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  private makeMeta(payload: GraphReportPayload): GraphReportMeta {
    const generatedAt = new Date(payload.generatedAtIso).toLocaleString();
    const kindLabel = payload.graphKind === 'cti' ? 'CTI Network' : 'Social Network';
    return { generatedAt, kindLabel };
  }

  private drawDarkTopBand(doc: jsPDF, height: number, rounded: boolean = false): number {
    const W = this.getPageW(doc);
    doc.setFillColor(15, 23, 42);
    if (rounded) {
      doc.roundedRect(40, 84, W - 80, height, this.SECTION_RADIUS, this.SECTION_RADIUS, 'F');
    }
    else {
      doc.rect(0, 0, W, height, 'F');
    }
    return W;
  }

  private isJpegDataUrl(dataUrl?: string): boolean {
    return typeof dataUrl === 'string' && /^data:image\/jpeg;base64,/.test(dataUrl);
  }

  private fitRectToPage(doc: jsPDF, left: number, top: number, right: number, bottom: number): {
        x: number;
        y: number;
        w: number;
        h: number;
    } {
    const W = this.getPageW(doc);
    const H = this.getPageH(doc);
    return { x: left, y: top, w: W - left - right, h: H - top - bottom };
  }

  private fitRect(_: jsPDF, maxW: number, maxH: number, x: number, y: number): {
        x: number;
        y: number;
        w: number;
        h: number;
    } {
    return { x, y, w: maxW, h: maxH };
  }

  private drawStandardPageHeader(doc: jsPDF, title: string, section: string, barBottom: number): void {
    const W = this.getPageW(doc);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, W, barBottom, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, W, 5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(40, barBottom, W - 40, barBottom);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(this.fitSingleLine(doc, title, W - 230), 40, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(this.fitSingleLine(doc, section, 170), W - 40, 34, { align: 'right' });
  }

  private fitSingleLine(doc: jsPDF, text: string, maxWidth: number): string {
    const input = String(text || '');
    if (!input) {
      return '';
    }
    if (doc.getTextWidth(input) <= maxWidth) {
      return input;
    }
    const ellipsis = '...';
    let out = input;
    while (out.length > 1 && doc.getTextWidth(out + ellipsis) > maxWidth) {
      out = out.slice(0, -1);
    }
    return out + ellipsis;
  }

  private drawReportBackgroundPattern(doc: jsPDF): void {
    const W = this.getPageW(doc);
    const H = this.getPageH(doc);
    doc.setDrawColor(246, 248, 252);
    doc.setLineWidth(0.25);
    const step = 12;
    for (let x = -H; x < W + H; x += step) {
      doc.line(x, 0, x + H, H);
    }
  }

  private drawRoundedTableContainer(doc: jsPDF, x: number, width: number, startY: number, endY: number): void {
    // Intentionally no outer border for tables.
    void doc;
    void x;
    void width;
    void startY;
    void endY;
  }

  private drawInfoSectionMarker(doc: jsPDF, y: number, width: number, label: string): void {
    const x = 40;
    const text = this.fitSingleLine(doc, label || 'Information', Math.max(110, width - 24));
    const badgeWidth = width;
    const badgeX = x;
    const badgeTopY = y - 7; // 8px up from previous y+1 placement
    const lineY = badgeTopY + 18;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.6);
    doc.line(x, lineY, x + width, lineY);
    doc.setFillColor(...this.INTERNAL_HEADER_RGB);
    doc.roundedRect(badgeX, badgeTopY, badgeWidth, 16, 4, 4, 'F');
    doc.setFillColor(...this.INTERNAL_HEADER_RGB);
    doc.rect(badgeX, badgeTopY + 8, badgeWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(text, badgeX + 8, badgeTopY + 11);
  }

  private resolveMarkerY(doc: jsPDF, requestedY: number, resetY: number, onNewPage?: () => void): number {
    const pageBottom = this.getPageH(doc) - 58;
    const minBlockHeight = 26; // marker + minimum first-row space
    if (requestedY + minBlockHeight <= pageBottom) {
      return requestedY;
    }
    doc.addPage();
    onNewPage?.();
    return resetY;
  }

  private findTableScreenshotDataUrl(table: GraphReportTableRow): string | null {
    const title = String(table?.title || '').toLowerCase();
    const values = table?.values ?? {};
    // Prefer fields that are explicitly screenshot-related, then fall back to any image data URL.
    for (const [key, value] of Object.entries(values)) {
      if (`${key}`.toLowerCase().includes('screenshot') && this.isImageDataUrl(value)) {
        return this.normalizeDataUrl(value);
      }
    }
    for (const value of Object.values(values)) {
      if (this.isImageDataUrl(value)) {
        return this.normalizeDataUrl(value);
      }
    }
    if (title.includes('screenshot')) {
      // Keep a direct fallback if title indicates screenshot and values have slightly malformed data URL text.
      for (const value of Object.values(values)) {
        const normalized = this.normalizeDataUrl(value);
        if (normalized.startsWith('data:image/')) {
          return normalized;
        }
      }
    }
    return null;
  }

  private isImageDataUrl(value: string): boolean {
    return /^data:image\/(png|jpe?g|webp);base64,/i.test(this.normalizeDataUrl(value));
  }

  private normalizeDataUrl(value: string): string {
    return String(value || '').replace(/\s+/g, '').trim();
  }

  private getImageTypeFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
    const normalized = this.normalizeDataUrl(dataUrl).toLowerCase();
    if (normalized.startsWith('data:image/png')) {
      return 'PNG';
    }
    if (normalized.startsWith('data:image/webp')) {
      return 'WEBP';
    }
    return 'JPEG';
  }

  private drawScreenshotPreview(doc: jsPDF, dataUrl: string, x: number, y: number, width: number, maxH: number): void {
    const normalizedDataUrl = this.normalizeDataUrl(dataUrl);
    const pageBottom = this.getPageH(doc) - 58;
    const renderY = Math.min(y, pageBottom - 20);
    const fit = this.fitRect(doc, width, maxH, x, renderY);
    const img = doc.getImageProperties(normalizedDataUrl);
    const imgType = this.getImageTypeFromDataUrl(normalizedDataUrl);
    let drawW = fit.w;
    let drawH = (drawW * img.height) / img.width;
    if (drawH > fit.h) {
      const ratio = fit.h / drawH;
      drawH = fit.h;
      drawW = drawW * ratio;
    }
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.rect(fit.x, fit.y, fit.w, drawH + 8);
    doc.addImage(normalizedDataUrl, imgType, fit.x + ((fit.w - drawW) / 2), fit.y + 4, drawW, drawH, undefined, 'FAST');
  }

  private compactSession(session: string): string {
    const value = String(session || '').trim();
    if (!value || value.length <= 26) {
      return value || '—';
    }
    const start = value.slice(0, 11);
    const end = value.slice(-8);
    return `${start}...${end}`;
  }

  private makeSectionHeaderCallback(sectionsByPage: Record<number, string>, section: string, subtitle: string): (data: any) => void {
    return (data: any) => {
      sectionsByPage[data.pageNumber] = section;
      this.drawConnectionMatrixHeader(data.doc as jsPDF, section, subtitle);
    };
  }

  private getPageW(doc: jsPDF): number {
    return doc.internal.pageSize.getWidth();
  }

  private getPageH(doc: jsPDF): number {
    return doc.internal.pageSize.getHeight();
  }

  private docToBytes(doc: jsPDF): Uint8Array {
    const buf = doc.output('arraybuffer');
    return new Uint8Array(buf);
  }

  private buildSafeFilename(payload: GraphReportPayload): string {
    const date = new Date(payload.generatedAtIso).toISOString().slice(0, 10);
    const base = `${payload.graphKind}-${payload.sessionName || 'session'}-${date}-${payload.title || 'report'}`;
    return base.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  private downloadText(content: string, mimeType: string, filename: string): void {
    this.downloadBlobFromParts([content], mimeType, filename);
  }

  private downloadBinary(content: Uint8Array, mimeType: string, filename: string): void {
    this.downloadBlobFromParts([content], mimeType, filename);
  }

  private downloadBlobFromParts(content: BlobPart[], mimeType: string, filename: string): void {
    const blob = new Blob(content, { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
