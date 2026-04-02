import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { from, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { GraphReportExportType, GraphReportMeta, GraphReportNode, GraphReportPayload, GraphReportTableRow } from '../../model/report/report-export.model';
@Injectable({ providedIn: 'root' })
export class GraphExportService {
  private pdfLibs$: Observable<{ jsPDF: typeof import('jspdf').default; autoTable: typeof import('jspdf-autotable').default; }> | null = null;
  private loadedAutoTable: typeof import('jspdf-autotable').default | null = null;

  protected readonly SECTION_RADIUS = 4;
  protected readonly INTERNAL_HEADER_RGB: [number, number, number] = [51, 64, 84];
  protected readonly TABLE_ROW_BG_RGB: [number, number, number] = [236, 242, 250];
  protected readonly TABLE_ROW_ALT_BG_RGB: [number, number, number] = [224, 233, 245];
  protected readonly TABLE_BORDER_RGB: [number, number, number] = [194, 212, 238];
  protected readonly TABLE_BORDER_WIDTH = 0.2;

  exportByType(payload: GraphReportPayload, type: GraphReportExportType): void {
    if (type === 'json') {
      this.exportGraphJson(payload);
      return;
    }
    if (type !== 'graph_pdf') {
      throw new Error(`GraphExportService only supports graph exports. Received: ${type}`);
    }
    this.exportGraphPdf(payload);
  }

  protected getPdfLibs(): Observable<{ jsPDF: typeof import('jspdf').default; autoTable: typeof import('jspdf-autotable').default; }> {
    if (!this.pdfLibs$) {
      this.pdfLibs$ = from(Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ])).pipe(tap(([_, autoTableModule]) => {
        this.loadedAutoTable = autoTableModule.default;
      }), map(([jspdfModule, autoTableModule]) => ({
        jsPDF: jspdfModule.default,
        autoTable: autoTableModule.default
      })), shareReplay(1));
    }
    return this.pdfLibs$;
  }

  protected requireAutoTable(): typeof import('jspdf-autotable').default {
    if (!this.loadedAutoTable) {
      throw new Error('PDF export library not loaded');
    }
    return this.loadedAutoTable;
  }

  private exportGraphPdf(payload: GraphReportPayload): void {
    this.getPdfLibs().subscribe((libs) => {
      const bytes = this.buildGraphPdfBytes(payload, libs.jsPDF, libs.autoTable);
      this.downloadBinary(bytes, 'application/pdf', `${this.buildSafeFilename(payload)}-graph-report.pdf`);
    });
  }

  private exportGraphJson(payload: GraphReportPayload): void {
    const jsonString = JSON.stringify(payload, null, 2);
    this.downloadText(jsonString, 'application/json', `${this.buildSafeFilename(payload)}-graph.json`);
  }

  protected buildGraphPdfBytes(payload: GraphReportPayload, JsPdfCtor: typeof import('jspdf').default, autoTable: typeof import('jspdf-autotable').default): Uint8Array {
    const doc = new JsPdfCtor({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
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
      { label: 'Session', value: this.truncateWithEllipsis(payload.sessionName || '-', 15) }
    ];
    kpis.forEach((kpi, idx) => {
      this.drawKpiCard(doc, 40 + idx * (kpiW + gap), kpiTop, kpiW, kpiH, kpi.label, kpi.value); 
    });
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
        lineWidth: this.TABLE_BORDER_WIDTH,
        lineColor: this.TABLE_BORDER_RGB
      },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      didDrawPage: analysisDidDrawPage,
      theme: 'plain' as const
    };
    this.drawInfoSectionMarker(doc, 220, contentW, 'Graph Summary');
    this.requireAutoTable()(doc, {
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
    this.requireAutoTable()(doc, {
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
      this.requireAutoTable()(doc, {
        startY: 138,
        margin: { top: 126, left: 40, right: 40, bottom: 58 },
        tableWidth: contentW,
        body: [['#', 'Platform', 'Node Count'], ...socialPlatformCounts.map((item, i) => [String(i + 1), item.name, String(item.count)])] as RowInput[],
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'top', lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
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
        const sectionTitle = this.getReportSectionTitle(t, idx);
        const tableRows = this.buildReportSectionRows(t.values ?? {});
        let markerY = idx === 0 ? 126 : ((doc as any).lastAutoTable?.finalY ?? 126) + 18;
        markerY = this.resolveMarkerY(doc, markerY, 126, () => {
          const pageNo = doc.getCurrentPageInfo().pageNumber;
          sectionsByPage[pageNo] = 'Report Sections';
          this.drawConnectionMatrixHeader(doc, 'Report Sections', 'Metadata, screenshot, and related reports');
        });
        this.drawInfoSectionMarker(doc, markerY, contentW, sectionTitle);
        const reportSectionDidDrawPage = (data: any) => {
          this.makeSectionHeaderCallback(sectionsByPage, 'Report Sections', 'Metadata, screenshot, and related reports')(data);
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
          didDrawPage: reportSectionDidDrawPage,
          theme: 'plain'
        });
        const screenshotDataUrl = this.findTableScreenshotDataUrl(t);
        if (screenshotDataUrl) {
          const lastY = (doc as any).lastAutoTable?.finalY ?? (markerY + 12);
          const imageY = this.resolveMarkerY(doc, lastY + 10, 126, () => {
            const pageNo = doc.getCurrentPageInfo().pageNumber;
            sectionsByPage[pageNo] = 'Report Sections';
            this.drawConnectionMatrixHeader(doc, 'Report Sections', 'Metadata, screenshot, and related reports');
            this.drawInfoSectionMarker(doc, 126, contentW, sectionTitle);
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
    this.requireAutoTable()(doc, {
      startY: 138,
      margin: { top: 126, left: 40, right: 40, bottom: 58 },
      tableWidth: contentW,
      body: [['#', 'From', 'To', 'Label'], ...payload.edges.slice(0, 240).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? ''])] as RowInput[],
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
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
    const sectionItems: {
            label: string;
            page: number;
        }[] = [];
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

    const tocX = 40;
    const tocY = 252;
    const tocW = W - 80;
    const rowH = 20;
    const pageColW = 72;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Section', tocX, tocY - 6);
    doc.text('Page', tocX + tocW - pageColW, tocY - 6);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.45);
    sectionItems.forEach((item, index) => {
      const rowTop = tocY + (index * rowH);
      const baselineY = rowTop + 13;
      const rowLabel = item.label;
      const labelX = tocX;
      const pageX = tocX + tocW - pageColW;
      doc.setDrawColor(226, 232, 240);
      doc.line(tocX, rowTop + rowH, tocX + tocW, rowTop + rowH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const labelText = this.fitSingleLine(doc, rowLabel, tocW - pageColW - 12);
      doc.text(labelText, labelX, baselineY);
      doc.link(labelX, rowTop + 2, tocW - pageColW - 4, rowH - 4, { pageNumber: item.page });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      const pageText = `Page ${String(item.page).padStart(2, '0')}`;
      doc.text(pageText, pageX, baselineY);
      doc.link(pageX, rowTop + 2, pageColW, rowH - 4, { pageNumber: item.page });
    });
    const composition = this.buildTypeComposition(payload.nodes).slice(0, 7);
    const compositionStartY = tocY + (sectionItems.length * rowH) + 24;
    this.drawInfoSectionMarker(doc, compositionStartY, W - 80, 'Top Node Types');
    this.requireAutoTable()(doc, {
      startY: compositionStartY + 12,
      margin: { left: 40, right: 40 },
      tableWidth: W - 80,
      body: [['Type', 'Count'], ...composition.map(item => [item.type, String(item.count)])] as RowInput[],
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [207, 220, 236];
        }
      },
      theme: 'plain'
    });
    this.drawRoundedTableContainer(doc, 40, W - 80, compositionStartY, (doc as any).lastAutoTable?.finalY ?? compositionStartY);
    if (payload.graphKind === 'social') {
      const platformCounts = this.extractSocialPlatformCounts(payload);
      const platformMarkerY = (doc as any).lastAutoTable.finalY + 10;
      this.drawInfoSectionMarker(doc, platformMarkerY, W - 80, `Found Social Platforms (${platformCounts.length})`);
      this.requireAutoTable()(doc, {
        startY: platformMarkerY + 12,
        margin: { left: 40, right: 40 },
        tableWidth: W - 80,
        body: [['Platform', 'Count'], ...platformCounts.slice(0, 12).map(item => [item.name, String(item.count)])] as RowInput[],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        bodyStyles: { fillColor: this.TABLE_ROW_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
        alternateRowStyles: { fillColor: this.TABLE_ROW_ALT_BG_RGB, lineWidth: this.TABLE_BORDER_WIDTH, lineColor: this.TABLE_BORDER_RGB },
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
    const compactSession = this.truncateWithEllipsis(this.compactSession(payload.sessionName || '-'), 15);
    const subtitle = this.fitSingleLineStrict(doc, `${meta.kindLabel} | Session: ${compactSession}`, 250, 48, 0.84);
    this.drawClippedText(doc, subtitle, W - 56, 104, 56, 84, W - 112, 30, 'right');
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
    this.drawClippedText(doc, this.fitSingleLineStrict(doc, subtitle, 260, 58, 0.86), W - 56, 104, 56, 84, W - 112, 30, 'right');
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

  protected toTitle(input: string): string {
    return input.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

  private extractSocialPlatformCounts(payload: GraphReportPayload): {
        name: string;
        count: number;
    }[] {
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

  protected makeMeta(payload: GraphReportPayload): GraphReportMeta {
    const generatedAt = new Date(payload.generatedAtIso).toLocaleString();
    const isAlertReport = payload.nodes.length > 0 && payload.nodes.every(node => String(node.type || '').toLowerCase() === 'alert');
    const kindLabel = isAlertReport ? 'Brand Alerts' : (payload.graphKind === 'cti' ? 'CTI Network' : 'Social Network');
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

  protected isJpegDataUrl(dataUrl?: string): boolean {
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

  protected fitRect(_: jsPDF, maxW: number, maxH: number, x: number, y: number): {
        x: number;
        y: number;
        w: number;
        h: number;
    } {
    return { x, y, w: maxW, h: maxH };
  }

  protected drawStandardPageHeader(doc: jsPDF, title: string, section: string, barBottom: number): void {
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

  protected fitSingleLine(doc: jsPDF, text: string, maxWidth: number): string {
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

  protected fitSingleLineStrict(doc: jsPDF, text: string, maxWidth: number, maxChars: number, safetyFactor: number = 0.86): string {
    const limited = String(text || '').slice(0, Math.max(0, maxChars));
    return this.fitSingleLine(doc, limited, maxWidth * safetyFactor);
  }

  protected truncateWithEllipsis(value: string, maxChars: number): string {
    const input = String(value || '');
    if (input.length <= maxChars) {
      return input;
    }
    return `${input.slice(0, Math.max(0, maxChars))}...`;
  }

  protected drawReportBackgroundPattern(doc: jsPDF): void {
    const W = this.getPageW(doc);
    const H = this.getPageH(doc);
    doc.setDrawColor(246, 248, 252);
    doc.setLineWidth(0.25);
    const step = 12;
    for (let x = -H; x < W + H; x += step) {
      doc.line(x, 0, x + H, H);
    }
  }

  protected drawRoundedTableContainer(doc: jsPDF, x: number, width: number, startY: number, endY: number): void {
    // Intentionally no outer border for tables.
    void doc;
    void x;
    void width;
    void startY;
    void endY;
  }

  protected drawInfoSectionMarker(doc: jsPDF, y: number, width: number, label: string): void {
    const x = 40;
    const normalizedLabel = String(label || '').trim();
    const text = this.fitSingleLine(doc, normalizedLabel || 'Info', Math.max(110, width - 24));
    const badgeWidth = width;
    const badgeX = x;
    // Keep the section badge close to table content with no separator rule below.
    const badgeTopY = y - 4;
    doc.setFillColor(...this.INTERNAL_HEADER_RGB);
    doc.roundedRect(badgeX, badgeTopY, badgeWidth, 16, 4, 4, 'F');
    doc.setFillColor(...this.INTERNAL_HEADER_RGB);
    doc.rect(badgeX, badgeTopY + 8, badgeWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(text, badgeX + 8, badgeTopY + 11);
  }

  protected drawClippedText( doc: jsPDF, text: string, x: number, y: number, clipX: number, clipY: number, clipWidth: number, clipHeight: number, align: 'left' | 'center' | 'right' = 'left' ): void {
    doc.saveGraphicsState();
    doc.rect(clipX, clipY, clipWidth, clipHeight, null).clip().discardPath();
    doc.text(text, x, y, { align });
    doc.restoreGraphicsState();
  }

  protected getReportSectionTitle(table: GraphReportTableRow, index: number): string {
    const fromTitle = this.cleanReportFieldLabel(table?.title ?? '');
    if (fromTitle) {
      return fromTitle;
    }
    const keys = Object.keys(table?.values ?? {});
    const hasMetadataPrefix = keys.some(key => /^\s*m\s+/i.test(String(key)));
    const cleanedKeys = keys.map(k => this.cleanReportFieldLabel(k).toLowerCase());
    const hasMetadataLikeKeys = cleanedKeys.some(k => /(scrap file|organization|domain|language|hash|update date|creation date|company|leak date|data size|revenue|location)/i.test(k));
    if (hasMetadataPrefix || hasMetadataLikeKeys) {
      return 'Metadata';
    }
    return `Section ${index + 1}`;
  }

  protected buildReportSectionRows(values: Record<string, string>): [string, string][] {
    const rows: [string, string][] = [['Field', 'Value']];
    Object.entries(values ?? {}).forEach(([rawKey, rawValue]) => {
      const key = this.cleanReportFieldLabel(rawKey);
      const value = this.cleanReportFieldValue(rawValue, key);
      if (!key && !value) {
        return;
      }
      rows.push([key || 'Field', value || '-']);
    });
    return rows;
  }

  private cleanReportFieldLabel(input: string): string {
    const compact = String(input || '')
      .replace(/^\s*m\s+/i, '')
      .replace(/[:\s]+$/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!compact) {
      return '';
    }
    if (/^[a-z0-9\s]+$/i.test(compact)) {
      return compact.replace(/\b\w/g, c => c.toUpperCase());
    }
    return compact;
  }

  private cleanReportFieldValue(input: string, key: string): string {
    const raw = String(input ?? '').trim();
    if (!raw) {
      return '';
    }
    if (key.trim().toLowerCase() === 'json') {
      return String(input ?? '');
    }
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes('date')) {
      const asDate = new Date(raw);
      if (!Number.isNaN(asDate.getTime())) {
        return asDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
      }
    }
    if (normalizedKey.includes('url') || normalizedKey.includes('link')) {
      return raw.replace(/\s+/g, '');
    }
    return raw.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
  }

  protected resolveMarkerY(doc: jsPDF, requestedY: number, resetY: number, onNewPage?: () => void): number {
    const pageBottom = this.getPageH(doc) - 58;
    const minBlockHeight = 26; // marker + minimum first-row space
    if (requestedY + minBlockHeight <= pageBottom) {
      return requestedY;
    }
    doc.addPage();
    onNewPage?.();
    return resetY;
  }

  protected findTableScreenshotDataUrl(table: GraphReportTableRow): string | null {
    const title = String(table?.title || '').toLowerCase();
    const values = table?.values ?? {};
    // Prefer fields that are explicitly screenshot-related, then fall back to any image data URL.
    for (const [key, value] of Object.entries(values)) {
      if (key.toLowerCase().includes('screenshot') && this.isImageDataUrl(value)) {
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

  protected drawScreenshotPreview(doc: jsPDF, dataUrl: string, x: number, y: number, width: number, maxH: number): void {
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

  protected compactSession(session: string): string {
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

  protected getPageW(doc: jsPDF): number {
    return doc.internal.pageSize.getWidth();
  }

  protected getPageH(doc: jsPDF): number {
    return doc.internal.pageSize.getHeight();
  }

  protected docToBytes(doc: jsPDF): Uint8Array {
    const buf = doc.output('arraybuffer');
    return new Uint8Array(buf);
  }

  protected buildSafeFilename(payload: GraphReportPayload): string {
    const date = new Date(payload.generatedAtIso).toISOString().slice(0, 10);
    const base = `${payload.graphKind}-${payload.sessionName || 'session'}-${date}-${payload.title || 'report'}`;
    return base.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  protected downloadText(content: string, mimeType: string, filename: string): void {
    this.downloadBlobFromParts([content], mimeType, filename);
  }

  protected downloadBinary(content: Uint8Array, mimeType: string, filename: string): void {
    const binary = new Uint8Array(content);
    this.downloadBlobFromParts([binary], mimeType, filename);
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
