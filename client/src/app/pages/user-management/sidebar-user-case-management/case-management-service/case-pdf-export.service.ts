import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { forkJoin, from, map, Observable } from 'rxjs';
import type { SharedCaseArtifact, SharedCaseComment, SharedCaseEntity, SharedCaseLink, SharedCaseReport, SharedCaseTask } from '../../../../shared/model/case-management/case.model';
import { ExportBrandingService } from '../../../../shared/services/export/export-branding.service';
import { buildExportFileStem } from '../../../../shared/services/export/export-filename.util';
import { PDF_EXPORT_THEME } from '../../../../shared/services/export/pdf-export-theme';
import { normalizePdfText, preparePdfValue } from '../../../../shared/services/export/pdf-text.util';

interface CasePdfExportOptions {
  appName?: string;
  filenameSuffix?: string;
  logoDataUrl?: string | null;
  reportLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class CasePdfExportService {
  private readonly theme = PDF_EXPORT_THEME;

  constructor(private exportBranding: ExportBrandingService) {
  }

  exportCaseReport(report: SharedCaseReport, options: CasePdfExportOptions = {}): Observable<void> {
    return forkJoin({
      jspdfModule: from(import('jspdf')),
      autoTableModule: from(import('jspdf-autotable')),
      logoDataUrl: from(this.exportBranding.loadTenantLogoDataUrl())
    }).pipe(map(({ jspdfModule, autoTableModule, logoDataUrl }) => {
      const doc = new jspdfModule.default({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
      this.buildPdf(doc, autoTableModule.default, report, {
        ...options,
        appName: this.exportBranding.getTenantName(),
        logoDataUrl
      });
      doc.save(`${buildExportFileStem(report.title, report.updatedAt || report.createdAt, 'case-report')}.pdf`);
    }));
  }

  private buildPdf(doc: jsPDF, autoTable: typeof import('jspdf-autotable').default, report: SharedCaseReport, options: CasePdfExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 80;
    const appName = normalizePdfText(options.appName || this.exportBranding.getTenantName());
    doc.setProperties({
      title: normalizePdfText(report.title || options.reportLabel || 'Case Report'),
      subject: normalizePdfText(options.reportLabel || 'Case intelligence export'),
      author: appName,
      creator: appName
    });
    doc.viewerPreferences({ DisplayDocTitle: true, FitWindow: true });
    let y = 40;

    this.drawPdfCover(doc, report, options);
    y = 178;
    y = this.addPdfSection(doc, autoTable, y, 'Case Summary', [
      ['Case ID', report.caseId],
      ['Title', report.title],
      ['Type', this.formatLabel(report.caseType, report.otherValue)],
      ['Status', this.formatLabel(report.status)],
      ['Severity', this.formatLabel(report.severity)],
      ['Priority', this.formatLabel(report.priority)],
      ['Created', this.formatDate(report.createdAt)],
      ['Updated', this.formatDate(report.updatedAt)],
      ['Expires', this.formatDate(report.expiresAt)],
      ['Tags', (report.tags || []).map(tag => this.formatLabel(tag)).join(', ') || '-'],
      ['Description', report.description || 'No description provided.'],
    ], contentWidth);

    const primaryEntity = this.getPrimaryEntity(report);
    if (primaryEntity) {
      y = this.addPdfSection(doc, autoTable, y, 'Primary Entity', [
        ['Value', primaryEntity.value],
        ['Display Name', primaryEntity.entityDescription || primaryEntity.value],
        ['Type', this.formatLabel(primaryEntity.type, primaryEntity.entityTypeOtherValue)],
        ['Role', this.formatLabel(primaryEntity.role)],
        ['Confidence', this.formatConfidence(primaryEntity.confidence)],
        ['Relationship', this.formatLabel(primaryEntity.relationshipToCase)],
        ['Source', this.formatLabel(primaryEntity.source, primaryEntity.entitySourceOtherValue)],
        ['Created By', primaryEntity.createdBy || '-'],
        ['Updated By', primaryEntity.updatedBy || '-'],
        ['Created At', this.formatDate(primaryEntity.createdAt)],
        ['Updated At', this.formatDate(primaryEntity.updatedAt)],
        ['Tags', (primaryEntity.tags || []).map(tag => this.formatLabel(tag)).join(', ') || '-'],
        ['Social Profiles', (primaryEntity.socialProfiles || []).map(profile => `${this.formatLabel(profile.platform, profile.platformOtherValue)}: ${profile.username}${profile.displayName ? ` (${profile.displayName})` : ''}${profile.profileUrl ? ` - ${profile.profileUrl}` : ''}`).join('\n') || '-'],
        ['Identifiers', (primaryEntity.identifiers || []).map(identifier => `${this.formatLabel(identifier.type, identifier.identifierTypeOtherValue)}: ${identifier.value}${identifier.issuer ? `, Issuer: ${identifier.issuer}` : ''}${identifier.verified ? ', Verified' : ''}`).join('\n') || '-'],
      ], contentWidth);
    }

    if (report.closure || report.closedAt) {
      y = this.addPdfSection(doc, autoTable, y, 'Closure', [
        ['Reason', this.formatLabel(report.closure?.reason, report.closure?.closureReasonOtherValue)],
        ['Summary', report.closure?.summary || 'No closure summary provided.'],
        ['Resolution', report.closure?.resolution || '-'],
        ['Closed At', this.formatDate(report.closedAt || report.closure?.closedAt)],
      ], contentWidth);
    }

    y = this.addPdfSection(doc, autoTable, y, 'Related Entities', this.buildRelatedEntityRows(this.getRelatedEntities(report)), contentWidth);
    y = this.addPdfSection(doc, autoTable, y, 'Artifacts', this.buildArtifactRows(report.artifacts || []), contentWidth);
    y = this.addPdfSection(doc, autoTable, y, 'Comments', this.buildCommentRows(report.comments || []), contentWidth);
    y = this.addPdfSection(doc, autoTable, y, 'Tasks', this.buildTaskRows(report.tasks || []), contentWidth);
    this.addPdfSection(doc, autoTable, y, 'Linked Cases', this.buildLinkedCaseRows(report.linkedCases || []), contentWidth);
    this.addPdfFooters(doc, options.appName || this.exportBranding.getTenantName());
  }

  private getPrimaryEntity(report: SharedCaseReport): SharedCaseEntity | null {
    const entities = report.entities || [];
    return entities.find(entity => entity.entityId === report.primaryEntityId)
      || entities.find(entity => entity.role === 'primary')
      || null;
  }

  private getRelatedEntities(report: SharedCaseReport): SharedCaseEntity[] {
    const entities = report.entities || [];
    const primaryEntity = this.getPrimaryEntity(report);

    return entities.filter(entity =>
      entity.entityId !== primaryEntity?.entityId &&
      entity.role !== 'primary');
  }

  private buildRelatedEntityRows(entities: SharedCaseEntity[]): RowInput[] {
    if (!entities.length) {
      return [['Related Entities', 'No related entities added.']];
    }

    return entities.flatMap((entity, index) => [
      [`Related Entity ${index + 1}`, entity.entityDescription || entity.value],
      ['Value', entity.value],
      ['Type', this.formatLabel(entity.type, entity.entityTypeOtherValue)],
      ['Role', this.formatLabel(entity.role)],
      ['Confidence', this.formatLabel(entity.confidence)],
      ['Source', this.formatLabel(entity.source, entity.entitySourceOtherValue)],
      ['Tags', (entity.tags || []).map(tag => this.formatLabel(tag)).join(', ') || '-'],
      ['Social Profiles', (entity.socialProfiles || []).map(profile => `${this.formatLabel(profile.platform, profile.platformOtherValue)}: ${profile.username}${profile.displayName ? ` (${profile.displayName})` : ''}${profile.profileUrl ? ` - ${profile.profileUrl}` : ''}`).join('\n') || '-'],
      ['Identifiers', (entity.identifiers || []).map(identifier => `${this.formatLabel(identifier.type, identifier.identifierTypeOtherValue)}: ${identifier.value}${identifier.issuer ? `, Issuer: ${identifier.issuer}` : ''}${identifier.verified ? ', Verified' : ''}`).join('\n') || '-'],
    ]);
  }

  private buildCommentRows(comments: SharedCaseComment[]): RowInput[] {
    if (!comments.length) {
      return [['Comments', 'No comments added.']];
    }

    return comments.flatMap((comment, index) => [
      [`Comment ${index + 1}`, comment.body],
      ['Created By / At', `${comment.createdBy || '-'} | ${this.formatDate(comment.createdAt)}`],
    ]);
  }

  private drawPdfCover(doc: jsPDF, report: SharedCaseReport, options: CasePdfExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const reportLabel = options.reportLabel || 'Shared Case Report';
    const appName = options.appName || this.exportBranding.getTenantName();
    doc.setFillColor(...this.theme.headerBackgroundRgb);
    doc.rect(0, 0, pageWidth, 158, 'F');
    doc.setFillColor(...this.theme.coverBandRgb);
    doc.rect(0, 0, 10, 158, 'F');
    doc.setFillColor(...this.theme.headerAccentRgb);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(...this.theme.headerRowFillRgb);
    doc.roundedRect(40, 22, 116, 18, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...this.theme.sectionHeaderRgb);
    doc.text('CASE INTELLIGENCE', 51, 34);
    doc.setTextColor(...this.theme.textPrimaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    const titleLines = (doc.splitTextToSize(normalizePdfText(report.title || reportLabel), pageWidth - 80) as string[]).slice(0, 2);
    const titleY = 65;
    doc.text(titleLines, 40, titleY, { lineHeightFactor: 1.12 });
    const titleBottom = titleY + ((titleLines.length - 1) * 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...this.theme.textSecondaryRgb);
    doc.text(this.fitPdfLine(doc, `${reportLabel} | ${report.caseId} | ${this.formatLabel(report.caseType)}`, pageWidth - 80), 40, titleBottom + 21);
    doc.setFontSize(8.5);
    doc.setTextColor(...this.theme.textMutedRgb);
    doc.text(this.fitPdfLine(doc, `Prepared by ${appName}${report.expiresAt ? ` | Expires ${this.formatDate(report.expiresAt)}` : ''}`, pageWidth - 80), 40, titleBottom + 39);
    doc.setDrawColor(...this.theme.coverPanelBorderRgb);
    doc.line(40, 146, pageWidth - 40, 146);
    this.drawTenantBrand(doc, appName, options.logoDataUrl || null, pageWidth - 40, 24, 140, 30, this.theme.textPrimaryRgb);
  }

  private addPdfSection(doc: jsPDF, autoTable: typeof import('jspdf-autotable').default, y: number, title: string, rows: RowInput[], contentWidth: number): number {
    const startY = this.resolvePdfY(doc, y, 86);
    doc.setFillColor(...this.theme.headerBackgroundRgb);
    doc.setDrawColor(...this.theme.tableBorderRgb);
    doc.rect(40, startY, contentWidth, 24, 'FD');
    doc.setFillColor(...this.theme.headerAccentRgb);
    doc.rect(40, startY, 4, 24, 'F');
    doc.setTextColor(...this.theme.sectionHeaderRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(normalizePdfText(title), 52, startY + 16);
    autoTable(doc, {
      startY: startY + 32,
      margin: { top: 70, left: 40, right: 40, bottom: 56 },
      tableWidth: contentWidth,
      body: this.preparePdfRows(rows.length ? rows : [['-', 'No data added.']] as RowInput[]),
      rowPageBreak: 'avoid',
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'top',
        textColor: this.theme.textBodyRgb,
        lineWidth: this.theme.tableBorderWidth,
        lineColor: this.theme.tableBorderRgb,
      },
      bodyStyles: {
        fillColor: this.theme.tableRowBgRgb,
        lineWidth: this.theme.tableBorderWidth,
        lineColor: this.theme.tableBorderRgb,
      },
      alternateRowStyles: {
        fillColor: this.theme.tableRowAltBgRgb,
        lineWidth: this.theme.tableBorderWidth,
        lineColor: this.theme.tableBorderRgb,
      },
      columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' }, 1: { cellWidth: contentWidth - 130 } },
      didParseCell: data => {
        const rawRow = Array.isArray(data?.row?.raw) ? data.row.raw : [];
        const label = String(rawRow[0] ?? '');
        if (data.column.index === 0) {
          data.cell.styles.fillColor = this.theme.firstColumnFillRgb;
          data.cell.styles.textColor = this.theme.textSecondaryRgb;
          data.cell.styles.fontSize = 7.7;
        }
        if (data.column.index === 1 && this.isTechnicalPdfField(label)) {
          data.cell.styles.font = 'courier';
          data.cell.styles.fontSize = 7.2;
        }
      },
    });
    return ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || startY) + 18;
  }

  private buildArtifactRows(artifacts: SharedCaseArtifact[]): RowInput[] {
    if (!artifacts.length) {
      return [['Artifacts', 'No artifacts added.']];
    }
    return artifacts.flatMap((artifact, index) => [
      [`Artifact ${index + 1}`, artifact.title || 'Untitled artifact'],
      ['Type / Source', `${this.formatLabel(artifact.type, artifact.artifactTypeOtherValue)} | ${this.formatLabel(artifact.source, artifact.artifactSourceOtherValue)}`],
      ['Description', artifact.description || '-'],
      ['URL', artifact.url || '-'],
      ['File', artifact.fileName || '-'],
      ['File Type', artifact.fileType || '-'],
      ['Captured At', this.formatDate(artifact.capturedAt)],
      ['Tags', (artifact.tags || []).map(tag => this.formatLabel(tag)).join(', ') || '-'],
    ]);
  }

  private buildTaskRows(tasks: SharedCaseTask[]): RowInput[] {
    if (!tasks.length) {
      return [['Tasks', 'No tasks added.']];
    }
    return tasks.flatMap((task, index) => [
      [`Task ${index + 1}`, task.title],
      ['Description', task.description || '-'],
      ['Status / Priority', `${this.formatLabel(task.status)} | ${this.formatLabel(task.priority)}`],
      ['Assigned To', task.assignedTo || '-'],
      ['Due', this.formatDate(task.dueAt)],
      ['Created / Updated', `${this.formatDate(task.createdAt)} | ${this.formatDate(task.updatedAt)}`],
      ['Completed', this.formatDate(task.completedAt)],
    ]);
  }

  private buildLinkedCaseRows(linkedCases: SharedCaseLink[]): RowInput[] {
    if (!linkedCases.length) {
      return [['Linked Cases', 'No linked cases added.']];
    }
    return linkedCases.flatMap((linkedCase, index) => [
      [`Linked Case ${index + 1}`, linkedCase.targetCaseId],
      ['Relationship', this.formatLabel(linkedCase.relationship)],
      ['Reason', linkedCase.reason || '-'],
      ['Created By / At', `${linkedCase.createdBy || '-'} | ${this.formatDate(linkedCase.createdAt)}`],
    ]);
  }

  private resolvePdfY(doc: jsPDF, y: number, neededHeight: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + neededHeight > pageHeight - 56) {
      doc.addPage();
      return 70;
    }
    return y;
  }

  private addPdfFooters(doc: jsPDF, appName: string): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      if (page !== 1) {
        this.drawCasePageHeader(doc, 'Case Details');
      }
      doc.setDrawColor(...this.theme.tableBorderRgb);
      doc.line(40, pageHeight - 38, pageWidth - 40, pageHeight - 38);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...this.theme.textMutedRgb);
      doc.text(this.fitPdfLine(doc, `${appName} | Confidential intelligence. Do not redistribute without authorization.`, pageWidth - 170), 40, pageHeight - 22);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - 40, pageHeight - 22, { align: 'right' });
    }
  }

  private drawCasePageHeader(doc: jsPDF, section: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(...this.theme.headerBackgroundRgb);
    doc.rect(0, 0, pageWidth, 52, 'F');
    doc.setFillColor(...this.theme.headerAccentRgb);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setDrawColor(...this.theme.tableBorderRgb);
    doc.line(40, 52, pageWidth - 40, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...this.theme.textPrimaryRgb);
    doc.text('Case Intelligence Report', 40, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.theme.sectionHeaderRgb);
    doc.text(this.fitPdfLine(doc, section, 180), pageWidth - 40, 32, { align: 'right' });
  }

  private preparePdfRows(rows: RowInput[]): RowInput[] {
    return rows.map(row => {
      if (!Array.isArray(row)) {
        return row;
      }
      return row.map(cell => {
        if (typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
          return preparePdfValue(cell);
        }
        if (cell && typeof cell === 'object' && 'content' in cell) {
          return { ...cell, content: preparePdfValue(cell.content) };
        }
        return cell;
      }) as RowInput;
    });
  }

  private isTechnicalPdfField(label: string): boolean {
    return /(password|hash|url|link|domain|email|username|ioc|file|identifier|ip|wallet|address)/i.test(label);
  }

  private drawTenantBrand(doc: jsPDF, appName: string, logoDataUrl: string | null, rightX: number, topY: number, maxWidth: number, maxHeight: number, textRgb: [number, number, number]): void {
    let textY = topY + 10;
    if (logoDataUrl) {
      try {
        const image = doc.getImageProperties(logoDataUrl);
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        const width = image.width * ratio;
        const height = image.height * ratio;
        const imageType = logoDataUrl.toLowerCase().startsWith('data:image/png') ? 'PNG'
          : logoDataUrl.toLowerCase().startsWith('data:image/webp') ? 'WEBP'
            : 'JPEG';
        doc.addImage(logoDataUrl, imageType, rightX - width, topY, width, height, undefined, 'FAST');
        textY = topY + height + 11;
      }
      catch {
        textY = topY + 10;
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textRgb);
    doc.text(this.fitPdfLine(doc, appName, maxWidth), rightX, textY, { align: 'right' });
  }

  private fitPdfLine(doc: jsPDF, text: string, maxWidth: number): string {
    const normalizedText = normalizePdfText(text);
    if (doc.getTextWidth(normalizedText) <= maxWidth) {
      return normalizedText;
    }
    let value = normalizedText;
    while (value.length > 4 && doc.getTextWidth(`${value}...`) > maxWidth) {
      value = value.slice(0, -1);
    }
    return `${value}...`;
  }

  private formatConfidence(value?: string | null): string {
    return this.formatLabel(value || 'high');
  }

  private formatLabel(value?: string | null, otherValue?: string | null): string {
    if (value === 'other' && otherValue?.trim()) {
      return normalizePdfText(`Other: ${otherValue}`);
    }
    if (!value) {
      return '-';
    }
    const label = value.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    return normalizePdfText(this.exportBranding.replaceSystemBrand(label));
  }

  private formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

}
