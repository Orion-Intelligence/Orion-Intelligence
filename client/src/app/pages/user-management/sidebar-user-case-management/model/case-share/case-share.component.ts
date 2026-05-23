import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import type jsPDF from 'jspdf';
import type { RowInput } from 'jspdf-autotable';
import { forkJoin, from } from 'rxjs';
import { AppService } from '../../../../../services/core/app/app.service';
import type { SharedCaseArtifact, SharedCaseEntity, SharedCaseLink, SharedCaseReport, SharedCaseTask } from '../../../../../shared/model/case-management/case.model';
import { ApiService } from '../../../../../shared/services/api.service';

@Component({
  selector: 'app-case-share',
  imports: [CommonModule],
  templateUrl: './case-share.component.html',
})
export class CaseShareComponent implements OnInit, OnDestroy {
  private previousTheme: 'light-theme' | 'dark-theme' | null = null;

  report: SharedCaseReport | null = null;
  isLoading = true;
  errorMessage = '';
  expandedArtifactIds = new Set<string>();
  brandingResolved = false;

  constructor(private route: ActivatedRoute, private api: ApiService, public appService: AppService) { }

  ngOnInit(): void {
    this.forceDarkTheme();
    this.appService.loadConfig().subscribe(() => {
      this.brandingResolved = true;
    });
    const shareId = this.route.snapshot.paramMap.get('shareId') || '';
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!shareId || !token) {
      this.errorMessage = 'Invalid share link.';
      this.isLoading = false;
      return;
    }
    this.api.get<SharedCaseReport>(`public/case-shares/${shareId}`, {
      params: new HttpParams().set('token', token)
    }).subscribe({
      next: report => {
        this.report = report;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = err?.error?.detail || 'This share link is unavailable.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    if (this.previousTheme) {
      document.body.classList.add(this.previousTheme);
    }
  }

  toggleArtifact(artifactId: string): void {
    if (this.expandedArtifactIds.has(artifactId)) {
      this.expandedArtifactIds.delete(artifactId);
      return;
    }
    this.expandedArtifactIds.add(artifactId);
  }

  isArtifactExpanded(artifactId: string): boolean {
    return this.expandedArtifactIds.has(artifactId);
  }

  exportPdf(): void {
    if (!this.report) {
      return;
    }
    forkJoin({
      jspdfModule: from(import('jspdf')),
      autoTableModule: from(import('jspdf-autotable')),
    }).subscribe(({ jspdfModule, autoTableModule }) => {
      const doc = new jspdfModule.default({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
      this.buildPdf(doc, autoTableModule.default);
      doc.save(`${this.safeFilename(this.report?.caseId || 'case')}-shared-report.pdf`);
    });
  }

  getPrimaryEntity(): SharedCaseEntity | null {
    const entities = this.report?.entities || [];
    return entities.find(entity => entity.entityId === this.report?.primaryEntityId)
      || entities.find(entity => entity.role === 'primary')
      || null;
  }

  formatConfidence(value?: string | null): string {
    return this.formatLabel(value || 'high');
  }

  formatLabel(value?: string | null, otherValue?: string | null): string {
    if (value === 'other' && otherValue?.trim()) {
      return `Other: ${otherValue}`;
    }
    if (!value) {
      return '-';
    }
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getLogoSrc(): string {
    return '/assets/images/shared/logo-wide-light.svg';
  }

  private forceDarkTheme(): void {
    this.previousTheme = document.body.classList.contains('light-theme') ? 'light-theme'
      : document.body.classList.contains('dark-theme') ? 'dark-theme'
        : null;
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }

  getAppName(): string {
    if (!this.brandingResolved) {
      return 'Orion Intelligence';
    }
    return this.appService.getConfig().appSettings.app_name || 'Orion Intelligence';
  }

  private buildPdf(doc: jsPDF, autoTable: typeof import('jspdf-autotable').default): void {
    const report = this.report;
    if (!report) {
      return;
    }
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 80;
    let y = 40;

    this.drawPdfCover(doc, report);
    y = 150;
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

    const primaryEntity = this.getPrimaryEntity();
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

    y = this.addPdfSection(doc, autoTable, y, 'Artifacts', this.buildArtifactRows(report.artifacts || []), contentWidth);
    y = this.addPdfSection(doc, autoTable, y, 'Tasks', this.buildTaskRows(report.tasks || []), contentWidth);
    this.addPdfSection(doc, autoTable, y, 'Linked Cases', this.buildLinkedCaseRows(report.linkedCases || []), contentWidth);
    this.addPdfFooters(doc);
  }

  private drawPdfCover(doc: jsPDF, report: SharedCaseReport): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(14, 22, 38);
    doc.rect(0, 0, pageWidth, 120, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(this.fitPdfLine(doc, report.title || 'Shared Case Report', pageWidth - 80), 40, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    doc.text(`Shared Case Report · ${report.caseId} · ${this.formatLabel(report.caseType)}`, 40, 68);
    doc.text(`Generated by ${this.getAppName()} · Expires ${this.formatDate(report.expiresAt)}`, 40, 86);
  }

  private addPdfSection(doc: jsPDF, autoTable: typeof import('jspdf-autotable').default, y: number, title: string, rows: RowInput[], contentWidth: number): number {
    const startY = this.resolvePdfY(doc, y, 86);
    doc.setFillColor(236, 242, 250);
    doc.setDrawColor(194, 212, 238);
    doc.roundedRect(40, startY, contentWidth, 24, 4, 4, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 52, startY + 16);
    autoTable(doc, {
      startY: startY + 32,
      margin: { left: 40, right: 40, bottom: 56 },
      tableWidth: contentWidth,
      body: rows.length ? rows : [['-', 'No data added.']] as RowInput[],
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'top',
        textColor: [30, 41, 59],
        lineWidth: 0.2,
        lineColor: [194, 212, 238],
      },
      bodyStyles: {
        fillColor: [248, 251, 255],
        lineWidth: 0.2,
        lineColor: [194, 212, 238],
      },
      alternateRowStyles: {
        fillColor: [236, 242, 250],
        lineWidth: 0.2,
        lineColor: [194, 212, 238],
      },
      columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' }, 1: { cellWidth: contentWidth - 130 } },
    });
    return ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || startY) + 18;
  }

  private buildArtifactRows(artifacts: SharedCaseArtifact[]): RowInput[] {
    if (!artifacts.length) {
      return [['Artifacts', 'No artifacts added.']];
    }
    return artifacts.flatMap((artifact, index) => [
      [`Artifact ${index + 1}`, artifact.title || 'Untitled artifact'],
      ['Type / Source', `${this.formatLabel(artifact.type, artifact.artifactTypeOtherValue)} · ${this.formatLabel(artifact.source, artifact.artifactSourceOtherValue)}`],
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
      ['Status / Priority', `${this.formatLabel(task.status)} · ${this.formatLabel(task.priority)}`],
      ['Assigned To', task.assignedTo || '-'],
      ['Due', this.formatDate(task.dueAt)],
      ['Created / Updated', `${this.formatDate(task.createdAt)} · ${this.formatDate(task.updatedAt)}`],
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
      ['Created By / At', `${linkedCase.createdBy || '-'} · ${this.formatDate(linkedCase.createdAt)}`],
    ]);
  }

  private resolvePdfY(doc: jsPDF, y: number, neededHeight: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + neededHeight > pageHeight - 56) {
      doc.addPage();
      return 40;
    }
    return y;
  }

  private addPdfFooters(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(194, 212, 238);
      doc.line(40, pageHeight - 38, pageWidth - 40, pageHeight - 38);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Confidential intelligence. Do not redistribute without authorization.', 40, pageHeight - 22);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - 84, pageHeight - 22);
    }
  }

  private fitPdfLine(doc: jsPDF, text: string, maxWidth: number): string {
    if (doc.getTextWidth(text) <= maxWidth) {
      return text;
    }
    let value = text;
    while (value.length > 4 && doc.getTextWidth(`${value}...`) > maxWidth) {
      value = value.slice(0, -1);
    }
    return `${value}...`;
  }

  private safeFilename(value: string): string {
    return value.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'case';
  }
}
