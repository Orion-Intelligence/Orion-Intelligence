import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
export interface GraphReportNode {
    id: string;
    label: string;
    type: string;
}
export interface GraphReportEdge {
    id: string;
    from: string;
    to: string;
    label?: string;
}
export interface GraphReportTableRow {
    title: string;
    values: Record<string, string>;
}
export interface GraphReportPayload {
    graphKind: 'cti' | 'social';
    title: string;
    sessionName: string;
    generatedAtIso: string;
    nodes: GraphReportNode[];
    edges: GraphReportEdge[];
    summary: Record<string, string | number>;
    tables?: GraphReportTableRow[];
    graphImageDataUrl?: string;
}
export type GraphReportExportType = 'json' | 'graph_pdf' | 'doc_pdf';
@Injectable({ providedIn: 'root' })
export class GraphReportExportService {
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
        const analysisDidDrawPage = (data: any) => { sectionsByPage[data.pageNumber] = 'Graph Analysis'; };
        const analysisTableBase = {
            margin: { left: 40, right: 40, bottom: 58 },
            tableWidth: contentW,
            styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' as const, valign: 'top' as const },
            alternateRowStyles: { fillColor: [248, 250, 252] as [
                    number,
                    number,
                    number
                ] },
            didDrawPage: analysisDidDrawPage,
            theme: 'grid' as const
        };
        autoTable(doc, {
            startY: 220,
            head: [['Graph Summary', 'Value']],
            body: Object.entries(payload.summary ?? {}).map(([k, v]) => [this.toTitle(k), String(v)]) as RowInput[],
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            ...analysisTableBase
        });
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 12,
            head: [['Node Type', 'Count']],
            body: composition.map(x => [x.type, String(x.count)]) as RowInput[],
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            ...analysisTableBase
        });
        const socialPlatformCounts = this.extractSocialPlatformCounts(payload);
        let platformPageNo: number | null = null;
        if (payload.graphKind === 'social' && socialPlatformCounts.length > 0) {
            doc.addPage();
            platformPageNo = doc.getCurrentPageInfo().pageNumber;
            sectionsByPage[platformPageNo] = 'Platform Inventory';
            this.drawConnectionMatrixHeader(doc, 'Platform Inventory', 'Detected social platforms in current graph');
            autoTable(doc, {
                startY: 126,
                margin: { left: 40, right: 40, bottom: 58 },
                tableWidth: contentW,
                head: [['#', 'Platform', 'Node Count']],
                body: socialPlatformCounts.map((item, i) => [String(i + 1), item.name, String(item.count)]) as RowInput[],
                styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'top' },
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                didDrawPage: this.makeSectionHeaderCallback(sectionsByPage, 'Platform Inventory', 'Detected social platforms in current graph'),
                theme: 'grid'
            });
        }
        doc.addPage();
        const edgesPageNo = doc.getCurrentPageInfo().pageNumber;
        sectionsByPage[edgesPageNo] = 'Connection Matrix';
        this.drawConnectionMatrixHeader(doc, 'Connection Matrix', 'Relationship listing from current graph state');
        autoTable(doc, {
            startY: 126,
            margin: { left: 40, right: 40, bottom: 58 },
            tableWidth: contentW,
            head: [['#', 'From', 'To', 'Label']],
            body: payload.edges.slice(0, 240).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? '']) as RowInput[],
            styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'top' },
            headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didDrawPage: this.makeSectionHeaderCallback(sectionsByPage, 'Connection Matrix', 'Relationship listing from current graph state'),
            theme: 'grid'
        });
        const totalPages = doc.getNumberOfPages();
        this.drawGraphToc(doc, payload, {
            graphPage: this.isJpegDataUrl(payload.graphImageDataUrl) ? 2 : null,
            analysisPage: this.isJpegDataUrl(payload.graphImageDataUrl) ? 3 : 2,
            platformPage: platformPageNo,
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
    private drawGraphCover(doc: jsPDF, payload: GraphReportPayload, meta: {
        generatedAt: string;
        kindLabel: string;
    }): void {
        const W = this.getPageW(doc);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 170, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text(payload.title || 'Graph Intelligence Report', 40, 64);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(191, 219, 254);
        doc.text(`${meta.kindLabel} • Graph-Centric Report`, 40, 92);
        doc.setFontSize(10);
        doc.setTextColor(203, 213, 225);
        doc.text(`Session: ${payload.sessionName || '—'}`, 40, 116);
        doc.text(`Generated: ${meta.generatedAt}`, 40, 134);
    }
    private drawGraphToc(doc: jsPDF, payload: GraphReportPayload, pages: {
        graphPage: number | null;
        analysisPage: number;
        platformPage: number | null;
        edgesPage: number;
    }): void {
        doc.setPage(1);
        const W = this.getPageW(doc);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.8);
        doc.line(40, 190, W - 40, 190);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Report Sections', 40, 220);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(40, 232, W - 80, 120, 8, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(40, 232, W - 80, 120, 8, 8, 'S');
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
        sectionItems.push({ label: 'Connection Matrix', page: pages.edgesPage });
        let y = 252;
        sectionItems.forEach((item, index) => {
            doc.textWithLink(`${index + 1}. ${item.label} (Page ${item.page})`, 52, y, { pageNumber: item.page });
            y += 18;
        });
        const composition = this.buildTypeComposition(payload.nodes).slice(0, 7);
        autoTable(doc, {
            startY: 370,
            margin: { left: 40, right: 40 },
            tableWidth: W - 80,
            head: [['Top Node Types', 'Count']],
            body: composition.map(item => [item.type, String(item.count)]) as RowInput[],
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            theme: 'grid'
        });
        if (payload.graphKind === 'social') {
            const platformCounts = this.extractSocialPlatformCounts(payload);
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                margin: { left: 40, right: 40 },
                tableWidth: W - 80,
                head: [[`Found Social Platforms (${platformCounts.length})`, 'Count']],
                body: platformCounts.slice(0, 12).map(item => [item.name, String(item.count)]) as RowInput[],
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                theme: 'grid'
            });
        }
    }
    private drawGraphSnapshot(doc: jsPDF, payload: GraphReportPayload): void {
        const W = this.getPageW(doc);
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
    private drawGraphAnalysisHeader(doc: jsPDF, payload: GraphReportPayload, meta: {
        generatedAt: string;
        kindLabel: string;
    }): void {
        const W = this.getPageW(doc);
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(40, 84, W - 80, 30, 8, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('Graph Analysis', 56, 104);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(191, 219, 254);
        doc.text(`${meta.kindLabel} | Session: ${payload.sessionName || '-'}`, W - 56, 104, { align: 'right' });
    }
    private drawConnectionMatrixHeader(doc: jsPDF, title: string, subtitle: string): void {
        const W = this.getPageW(doc);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(40, 84, W - 80, 30, 8, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(40, 84, W - 80, 30, 8, 8, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(title, 56, 104);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(subtitle, W - 56, 104, { align: 'right' });
    }
    private drawGraphChrome(doc: jsPDF, payload: GraphReportPayload, _meta: {
        generatedAt: string;
        kindLabel: string;
    }, section: string): void {
        this.drawStandardPageHeader(doc, payload.title || 'Graph Report', section, 56);
    }
    private drawGraphFooter(doc: jsPDF, payload: GraphReportPayload, meta: {
        generatedAt: string;
        kindLabel: string;
    }, pageNo: number, totalPages: number): void {
        const W = this.getPageW(doc);
        const H = this.getPageH(doc);
        doc.setDrawColor(226, 232, 240);
        doc.line(40, H - 40, W - 40, H - 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${meta.kindLabel} • ${payload.sessionName || '—'} • ${meta.generatedAt}`, 40, H - 24);
        doc.text(`Page ${pageNo} of ${totalPages}`, W - 40, H - 24, { align: 'right' });
    }
    private drawKpiCard(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string): void {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, w, h, 8, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, w, h, 8, 8, 'S');
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
        autoTable(doc, {
            startY: 160,
            margin: { left: 40, right: 40 },
            tableWidth: contentW,
            head: [['Executive Summary', '']],
            body: Object.entries(payload.summary ?? {}).map(([k, v]) => [k, String(v)]) as RowInput[],
            styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'top' },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            didDrawPage: hooks.didDrawPage
        });
        if (this.isJpegDataUrl(payload.graphImageDataUrl)) {
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 14,
                margin: { left: 40, right: 40 },
                tableWidth: contentW,
                head: [['Network Snapshot', '']],
                body: [['', '']] as RowInput[],
                styles: { fontSize: 9, cellPadding: 6 },
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
                didDrawPage: hooks.didDrawPage
            });
            const y = (doc as any).lastAutoTable.finalY + 10;
            const fit = this.fitRect(doc, this.getPageW(doc) - 80, 260, 40, y);
            doc.addImage(payload.graphImageDataUrl as string, 'JPEG', fit.x, fit.y, fit.w, fit.h, undefined, 'FAST');
        }
        autoTable(doc, {
            startY: Math.max((doc as any).lastAutoTable?.finalY ?? 160, 160) + 18,
            margin: { left: 40, right: 40 },
            tableWidth: contentW,
            head: [['Key Nodes (top 150)', '', '']],
            body: payload.nodes.slice(0, 150).map(n => [n.label || n.id, n.type, n.id]) as RowInput[],
            styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'top' },
            headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 110 }, 2: { cellWidth: 150 } },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didDrawPage: hooks.didDrawPage
        });
        if (payload.tables?.length) {
            payload.tables.forEach(t => {
                autoTable(doc, {
                    startY: (doc as any).lastAutoTable.finalY + 18,
                    margin: { left: 40, right: 40 },
                    tableWidth: contentW,
                    head: [[t.title, '']],
                    body: Object.entries(t.values ?? {}).map(([k, v]) => [k, v]) as RowInput[],
                    styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'top' },
                    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    didDrawPage: hooks.didDrawPage
                });
            });
        }
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 18,
            margin: { left: 40, right: 40 },
            tableWidth: contentW,
            head: [['Relationship Matrix (top 200)', '', '', '']],
            body: payload.edges.slice(0, 200).map((e, i) => [String(i + 1), e.from, e.to, e.label ?? '']) as RowInput[],
            styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'top' },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 150 }, 2: { cellWidth: 150 }, 3: { cellWidth: 177 } },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didDrawPage: hooks.didDrawPage
        });
        return this.docToBytes(doc);
    }
    private drawCover(doc: jsPDF, payload: GraphReportPayload, meta: {
        generatedAt: string;
        kindLabel: string;
    }, subtitle: string): void {
        const W = this.getPageW(doc);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 110, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(payload.title || 'Network Report', 40, 48);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(203, 213, 225);
        doc.text(`${subtitle} • ${meta.kindLabel}`, 40, 70);
        doc.text(`Session: ${payload.sessionName || '—'} • Generated: ${meta.generatedAt}`, 40, 90);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(40, 130, W - 40, 130);
        doc.setTextColor(15, 23, 42);
    }
    private makeHeaderFooterHooks(payload: GraphReportPayload, meta: {
        generatedAt: string;
        kindLabel: string;
    }): {
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
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`${meta2.kindLabel} • ${payload.sessionName || '—'} • ${meta2.generatedAt}`, 40, H - 32);
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
    private makeMeta(payload: GraphReportPayload): {
        generatedAt: string;
        kindLabel: string;
    } {
        const generatedAt = new Date(payload.generatedAtIso).toLocaleString();
        const kindLabel = payload.graphKind === 'cti' ? 'CTI Network' : 'Social Network';
        return { generatedAt, kindLabel };
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
        doc.setDrawColor(226, 232, 240);
        doc.line(40, barBottom, W - 40, barBottom);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(title, 40, 34);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(section, W - 40, 34, { align: 'right' });
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
