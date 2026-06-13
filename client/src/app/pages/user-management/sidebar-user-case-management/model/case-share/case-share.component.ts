import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../../../../services/core/app/app.service';
import type { SharedCaseComment, SharedCaseEntity, SharedCaseReport } from '../../../../../shared/model/case-management/case.model';
import { ApiService } from '../../../../../shared/services/api.service';
import { CasePdfExportService } from '../../case-management-service/case-pdf-export.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-case-share',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './case-share.component.html',
})
export class CaseShareComponent implements OnInit, OnDestroy {
  private previousTheme: 'light-theme' | 'dark-theme' | null = null;

  report: SharedCaseReport | null = null;
  isLoading = true;
  errorMessage = '';
  expandedArtifactIds = new Set<string>();
  expandedRelatedEntityIds = new Set<string>();
  brandingResolved = false;

  constructor(private route: ActivatedRoute, private api: ApiService, private casePdfExportService: CasePdfExportService, public appService: AppService) { }

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
        report.entities = report.entities || [];
        report.artifacts = report.artifacts || [];
        report.comments = report.comments || [];
        report.tasks = report.tasks || [];
        report.linkedCases = report.linkedCases || [];

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
    this.casePdfExportService.exportCaseReport(this.report, {
      appName: this.getAppName(),
      filenameSuffix: 'shared-report',
      reportLabel: 'Shared Case Report'
    }).subscribe({
      error: () => {
        this.errorMessage = 'Unable to export PDF.';
      }
    });
  }

  getPrimaryEntity(): SharedCaseEntity | null {
    const entities = this.report?.entities || [];
    return entities.find(entity => entity.entityId === this.report?.primaryEntityId)
      || entities.find(entity => entity.role === 'primary')
      || null;
  }

  getRelatedEntities(): SharedCaseEntity[] {
    const entities = this.report?.entities || [];
    const primaryEntity = this.getPrimaryEntity();

    return entities.filter(entity =>
      entity.entityId !== primaryEntity?.entityId &&
      entity.role !== 'primary');
  }

  getComments(): SharedCaseComment[] {
    return this.report?.comments || [];
  }

  toggleRelatedEntity(entityId: string): void {
    if (this.expandedRelatedEntityIds.has(entityId)) {
      this.expandedRelatedEntityIds.delete(entityId);
      return;
    }

    this.expandedRelatedEntityIds.add(entityId);
  }

  isRelatedEntityExpanded(entityId: string): boolean {
    return this.expandedRelatedEntityIds.has(entityId);
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
}
