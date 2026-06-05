import { ChangeDetectorRef, Component, forwardRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityDetailsComponent } from '../entity-details/entity-details';
import { ReportFeedbackCommentsComponent } from '../../../../../sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component';
import { ReportUserSidebarComponent } from '../../../../../sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component';
import { ReportFeedbackModel } from '../../../../../sections/report/templates/report_general/models/report-feedback.model';
import { ArtifactReportOption, Case, CaseAnalyst, CaseArtifact, CaseArtifactRequest, CaseClosure, CaseClosureRequest, CaseComment, CaseCommentRequest, CaseEntity, CaseEntityRequest, CaseLink, CaseTag, CaseTask, CaseTaskRequest, CaseUpdateRequest, SharedCaseReport } from '../../../../../shared/model/case-management/case.model';
import { CASE_STATUS_OPTIONS, CASE_TAG_OPTIONS, CASE_TYPE_OPTIONS, DEFAULT_CASE_ARTIFACT_TEMPLATE, DEFAULT_CASE_TASK_TEMPLATE, DEFAULT_PRIMARY_CASE_ENTITY_TEMPLATE, DEFAULT_RELATED_CASE_ENTITY_TEMPLATE, INTAKE_SOURCE_OPTIONS, PRIORITY_OPTIONS, SEVERITY_OPTIONS } from '../../../../../shared/model/case-management/case-management.defaults';
import { CaseManagement } from '../../case-management-service/case-management';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';
import { ConfirmationPopupComponent } from '../../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { TooltipDirective } from '../../../../../shared/directive/tooltip-directive.directive';
import { HttpClient } from '@angular/common/http';
import { CaseArtifactsSectionComponent } from './case-artifacts-section/case-artifacts-section';
import { CaseClosureSectionComponent } from './case-closure-section/case-closure-section';
import { CaseLinkedCasesSectionComponent } from './case-linked-cases-section/case-linked-cases-section';
import { CaseRelatedEntitiesSectionComponent } from './case-related-entities-section/case-related-entities-section';
import { CaseTasksSectionComponent } from './case-tasks-section/case-tasks-section';
import { CaseDetailsEditSection, CaseDetailsStore } from './case-details.store';
import { caseInlineMotion, caseModeSwapMotion, caseSectionMotion } from './case-details.animations';
import { CaseEditDrawerComponent } from './case-edit-drawer/case-edit-drawer';
import { CasePdfExportService } from '../../case-management-service/case-pdf-export.service';

@Component({
  selector: 'app-case-details',
  imports: [
    CommonModule,
    FormsModule,
    EntityDetailsComponent,
    ReportFeedbackCommentsComponent,
    ReportUserSidebarComponent,
    ConfirmationPopupComponent,
    TooltipDirective,
    CaseArtifactsSectionComponent,
    CaseClosureSectionComponent,
    CaseEditDrawerComponent,
    CaseLinkedCasesSectionComponent,
    CaseRelatedEntitiesSectionComponent,
    CaseTasksSectionComponent
  ],
  providers: [
    { provide: CaseDetailsStore, useExisting: forwardRef(() => CaseDetails) }
  ],
  animations: [caseInlineMotion, caseModeSwapMotion, caseSectionMotion],
  templateUrl: './case-details.html',
})
export class CaseDetails extends CaseDetailsStore implements OnInit {
  @ViewChild(ReportUserSidebarComponent) private userSidebar?: ReportUserSidebarComponent;
  private artifactReportSearchTimer: ReturnType<typeof setTimeout> | null = null;

  caseData: Case | null = null;
  isLoading = true;
  caseMotionDisabled = false;
  isEditing = false;
  activeEditSection: CaseDetailsEditSection | null = null;
  editedCase: Case | null = null;
  isAddingRelatedEntity = false;
  isAddingArtifact = false;
  isAddingTask = false;
  isAddingLinkedCase = false;
  isClosingCase = false;
  newRelatedEntity: CaseEntity | null = null;
  newArtifact: CaseArtifact | null = null;
  newTask: CaseTask | null = null;
  newLinkedCase: CaseLink | null = null;
  newClosure: CaseClosure | null = null;
  analysts: CaseAnalyst[] = [];
  accessibleCases: Case[] = [];
  isCommentSaving = false;
  isShareCreating = false;
  isShareRevoking = false;
  isPdfExporting = false;
  pendingShareAction: 'create' | 'revoke' | null = null;
  commentErrorMessage = '';
  caseTypeOptions = CASE_TYPE_OPTIONS;
  intakeSourceOptions = INTAKE_SOURCE_OPTIONS;
  statusOptions = CASE_STATUS_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  tagOptions: { value: CaseTag; label: string }[] = CASE_TAG_OPTIONS;
  readonly artifactAllowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  pendingNewArtifactFiles: File[] = [];
  pendingNewArtifactFileInput: HTMLInputElement | null = null;
  artifactReports: ArtifactReportOption[] = [];
  isArtifactReportsLoading = false;
  isArchiveConfirmationOpen = false;
  isArchivingCase = false;

  constructor(private route: ActivatedRoute, private router: Router, private caseService: CaseManagement, private casePdfExportService: CasePdfExportService, private messageNotificationService: MessageNotificationService, private http: HttpClient, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.loadCaseDetails();
    this.loadAnalysts();
    this.loadAccessibleCases();
  }

  loadAnalysts(): void {
    this.caseService.getAnalysts().subscribe({
      next: analysts => {
        this.analysts = analysts || [];
      },
      error: () => {
        this.analysts = [];
      }
    });
  }

  loadCaseDetails(): void {
    this.isLoading = true;
    const caseId = this.route.snapshot.queryParamMap.get('caseId');

    if (!caseId) {
      this.isLoading = false;
      this.messageNotificationService.show('No case ID provided');
      this.router.navigate(['/dashboard/profile/case-management']);
      return;
    }

    this.caseService.getCaseById(caseId).subscribe({
      next: (caseData) => {
        caseData.artifacts = caseData.artifacts || [];
        caseData.tasks = caseData.tasks || [];
        caseData.comments = caseData.comments || [];
        caseData.linkedCases = caseData.linkedCases || [];
        caseData.closure = caseData.closure || null;
        caseData.assignedAnalystIds = caseData.assignedAnalystIds || [];
        this.caseData = caseData;
        this.caseMotionDisabled = true;
        this.isLoading = false;
        setTimeout(() => {
          this.caseMotionDisabled = false;
        });
      },
      error: () => {
        this.messageNotificationService.show('Case not found');
        this.router.navigate(['/dashboard/profile/case-management']);
        this.isLoading = false;
      }
    });
  }

  loadAccessibleCases(): void {
    this.caseService.getCases().subscribe({
      next: cases => {
        this.accessibleCases = cases || [];
      },
      error: () => {
        this.accessibleCases = [];
      }
    });
  }

  enableEditing(section: CaseDetailsEditSection = 'caseDetails'): void {
    if (!this.caseData) {
      return;
    }
    if (this.caseData.closure) {
      this.messageNotificationService.show('Closed cases cannot be edited');
      return;
    }
    const editedCase: Case = JSON.parse(JSON.stringify(this.caseData));
    editedCase.tags = editedCase.tags || [];
    editedCase.assignedAnalystIds = editedCase.assignedAnalystIds || [];
    editedCase.comments = editedCase.comments || [];
    editedCase.linkedCases = editedCase.linkedCases || [];
    editedCase.closure = editedCase.closure || null;
    editedCase.entities = (editedCase.entities || []).map(entity => this.ensureEntityDefaults(entity));
    editedCase.artifacts = (editedCase.artifacts || []).map(artifact => this.ensureArtifactDefaults(artifact));
    editedCase.tasks = (editedCase.tasks || []).map(task => this.ensureTaskDefaults(task));
    this.ensurePrimaryEntity(editedCase);
    this.editedCase = editedCase;
    this.activeEditSection = section;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.activeEditSection = null;
    this.editedCase = null;
    this.cancelAllSectionModes();
  }

  private patchArtifactFiles(artifactId: string, files: CaseArtifact['files']): void {
    if (this.editedCase?.artifacts) {
      this.editedCase = {
        ...this.editedCase,
        artifacts: this.editedCase.artifacts.map(artifact =>
          artifact.artifactId === artifactId
            ? { ...artifact, files }
            : artifact)
      };
    }

    if (this.caseData?.artifacts) {
      this.caseData = {
        ...this.caseData,
        artifacts: this.caseData.artifacts.map(artifact =>
          artifact.artifactId === artifactId
            ? { ...artifact, files }
            : artifact)
      };
    }

    this.cdr.detectChanges();
  }

  uploadArtifactFiles(artifact: CaseArtifact, fileInput: HTMLInputElement): void {
    if (!this.caseData || !artifact.artifactId) {
      return;
    }

    const files = Array.from(fileInput.files || []);

    if (!this.validateArtifactFiles(artifact, files)) {
      fileInput.value = '';
      return;
    }

    this.caseService.uploadArtifactFiles(this.caseData.caseId, artifact.artifactId, files).subscribe({
      next: uploaded => {
        const nextFiles = [
          ...(artifact.files || []),
          ...(uploaded.files || [])
        ];

        this.patchArtifactFiles(artifact.artifactId, nextFiles);

        fileInput.value = '';
        this.messageNotificationService.show('Files uploaded successfully', 'success');
      },
      error: err => {
        fileInput.value = '';
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to upload files');
      }
    });
  }

  loadArtifactReports(source: string, q: string = ''): void {
    this.artifactReports = [];

    if (!source) {
      return;
    }

    this.isArtifactReportsLoading = true;

    this.caseService.getArtifactReports(source, q, 10).subscribe({
      next: reports => {
        this.artifactReports = reports || [];
        this.isArtifactReportsLoading = false;
      },
      error: err => {
        this.artifactReports = [];
        this.isArtifactReportsLoading = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to load reports');
      }
    });
  }

  scheduleArtifactReportSearch(artifact: CaseArtifact): void {
    if (this.artifactReportSearchTimer) {
      clearTimeout(this.artifactReportSearchTimer);
    }

    if (artifact.type !== 'report' || !artifact.linkedReportSource) {
      this.artifactReports = [];
      return;
    }

    this.artifactReportSearchTimer = setTimeout(() => {
      this.loadArtifactReports(artifact.linkedReportSource || '', artifact.title || '');
    }, 1000);
  }

  onArtifactReportSelected(artifact: CaseArtifact, reportId: string): void {
    const report = this.artifactReports.find(item => item.id === reportId);

    artifact.linkedReportId = reportId;
    artifact.linkedReportTitle = report?.title || '';

    if (report?.title) {
      artifact.title = report.title;
    }
  }

  viewArtifactReport(artifact: CaseArtifact): void {
    const url = this.getArtifactReportViewUrl(artifact);

    if (!url) {
      this.messageNotificationService.show('Report link is not available');
      return;
    }

    window.open(url, '_blank', 'noopener');
  }

  private getArtifactReportViewUrl(artifact: CaseArtifact): string {
    if (!artifact.linkedReportSource || !artifact.linkedReportId) {
      return '';
    }

    const source = artifact.linkedReportSource;
    const reportId = encodeURIComponent(artifact.linkedReportId);

    const sourcePathMap: Record<string, { base: string; category: string }> = {
      strategic: { base: 'strategic', category: 'all' },
      breach: { base: 'breach', category: 'all' },
      defacement: { base: 'defacement', category: 'all' },
      social: { base: 'social', category: 'all' },
      feed: { base: 'feed', category: 'news' },
      exploit: { base: 'exploit', category: 'all' }
    };

    const config = sourcePathMap[source];

    if (!config) {
      return '';
    }

    const tree = this.router.createUrlTree([
      '/dashboard',
      config.base,
      config.category,
      reportId
    ]);

    return this.router.serializeUrl(tree);
  }

  viewArtifactFile(artifact: CaseArtifact, fileId: string): void {
    if (!this.caseData || !artifact.artifactId) {
      return;
    }

    this.http.get(`/api/profile/cases/${this.caseData.caseId}/artifacts/${artifact.artifactId}/files/${fileId}/view`,
      { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to view file');
      }
    });
  }

  downloadArtifactFile(artifact: CaseArtifact, fileId: string): void {
    if (!this.caseData || !artifact.artifactId) {
      return;
    }

    const artifactFile = (artifact.files || []).find(file => file.fileId === fileId);

    this.http.get(`/api/profile/cases/${this.caseData.caseId}/artifacts/${artifact.artifactId}/files/${fileId}/download`,
      { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = artifactFile?.fileName || 'artifact-file';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to download file');
      }
    });
  }

  deleteArtifactFile(artifact: CaseArtifact, fileId: string): void {
    if (!this.caseData || !artifact.artifactId) {
      return;
    }

    this.caseService.deleteArtifactFile(this.caseData.caseId, artifact.artifactId, fileId).subscribe({
      next: () => {
        const nextFiles = (artifact.files || []).filter(file => file.fileId !== fileId);

        this.patchArtifactFiles(artifact.artifactId, nextFiles);

        this.messageNotificationService.show('File deleted successfully', 'success');
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to delete file');
      }
    });
  }

  setPendingNewArtifactFiles(fileInput: HTMLInputElement): void {
    if (!this.newArtifact) {
      return;
    }

    const files = Array.from(fileInput.files || []);

    if (!files.length) {
      this.pendingNewArtifactFiles = [];
      this.pendingNewArtifactFileInput = null;
      return;
    }

    if (!this.validateArtifactFiles(this.newArtifact, files)) {
      fileInput.value = '';
      this.pendingNewArtifactFiles = [];
      this.pendingNewArtifactFileInput = null;
      return;
    }

    this.pendingNewArtifactFiles = files;
    this.pendingNewArtifactFileInput = fileInput;
  }

  getPendingNewArtifactFileNames(): string {
    return this.pendingNewArtifactFiles.map(file => file.name).join(', ');
  }

  exportPdf(): void {
    if (!this.caseData || this.isPdfExporting) {
      return;
    }
    this.isPdfExporting = true;
    this.casePdfExportService.exportCaseReport(this.buildCasePdfReport(this.caseData), {
      filenameSuffix: 'case-report',
      reportLabel: 'Case Report'
    }).subscribe({
      next: () => {
        this.isPdfExporting = false;
      },
      error: err => {
        this.isPdfExporting = false;
        this.messageNotificationService.show(err?.message || 'Failed to export PDF');
      }
    });
  }

  openArchiveConfirmation(): void {
    if (!this.caseData?.closure || this.caseData.isArchived || this.isArchivingCase) {
      return;
    }

    this.isArchiveConfirmationOpen = true;
  }

  openShareConfirmation(): void {
    if (!this.caseData || this.isShareCreating) {
      return;
    }
    this.pendingShareAction = 'create';
  }

  openRevokeShareConfirmation(): void {
    if (!this.caseData || this.isShareRevoking) {
      return;
    }
    this.pendingShareAction = 'revoke';
  }

  handleShareConfirmation(confirmed: boolean): void {
    const action = this.pendingShareAction;
    this.pendingShareAction = null;
    if (!confirmed || !action) {
      return;
    }
    if (action === 'create') {
      this.shareCase();
      return;
    }
    this.revokeShareLinks();
  }

  getShareConfirmationMessage(): string {
    if (this.pendingShareAction === 'create') {
      return 'Creating a share link will allow anyone with the link to access this case report until the link expires. Do you want to continue?';
    }
    if (this.pendingShareAction === 'revoke') {
      return 'Revoking share links will expire all previously shared links for this case. Do you want to continue?';
    }
    return '';
  }

  archiveCase(confirmed: boolean): void {
    this.isArchiveConfirmationOpen = false;

    if (!confirmed || !this.caseData || this.isArchivingCase) {
      return;
    }

    this.isArchivingCase = true;

    this.caseService.archiveCase(this.caseData.caseId).subscribe({
      next: () => {
        this.isArchivingCase = false;
        if (this.caseData) {
          this.caseData.isArchived = true;
        }
        this.messageNotificationService.show('Case archived successfully', 'success');
      },
      error: err => {
        this.isArchivingCase = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to archive case');
      }
    });
  }

  private shareCase(): void {
    if (!this.caseData || this.isShareCreating) {
      return;
    }
    this.isShareCreating = true;
    this.caseService.createCaseShare(this.caseData.caseId, {
      expiresInHours: 168
    }).subscribe({
      next: share => {
        let shareUrl = share.path;
        try {
          shareUrl = new URL(share.path, window.location.origin).toString();
        }
        catch {
          shareUrl = share.path;
        }
        window.open(shareUrl, '_blank', 'noopener');
        this.isShareCreating = false;
      },
      error: err => {
        this.isShareCreating = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to create share link');
      }
    });
  }

  private revokeShareLinks(): void {
    if (!this.caseData || this.isShareRevoking) {
      return;
    }
    this.isShareRevoking = true;
    this.caseService.revokeCaseShares(this.caseData.caseId).subscribe({
      next: result => {
        this.isShareRevoking = false;
        this.messageNotificationService.show(`${result.revokedCount || 0} share links revoked.`, 'success');
      },
      error: err => {
        this.isShareRevoking = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to revoke share links');
      }
    });
  }

  private buildCasePdfReport(caseData: Case): SharedCaseReport {
    const report: SharedCaseReport = {
      shareId: '',
      caseId: caseData.caseId,
      title: caseData.title,
      description: caseData.description,
      caseType: caseData.caseType,
      otherValue: caseData.caseTypeOtherValue,
      status: caseData.status,
      severity: caseData.severity,
      priority: caseData.priority,
      tags: caseData.tags || [],
      primaryEntityId: caseData.primaryEntityId || null,
      entities: (caseData.entities || []).map(entity => {
        const createdAt = this.toPdfDate(entity.createdAt);
        const updatedAt = this.toPdfDate(entity.updatedAt);
        return {
          entityId: entity.entityId,
          type: entity.type,
          value: entity.value,
          entityTypeOtherValue: entity.entityTypeOtherValue,
          entitySourceOtherValue: entity.entitySourceOtherValue,
          entityDescription: entity.entityDescription,
          role: entity.role,
          confidence: entity.confidence,
          source: entity.source,
          identifiers: entity.identifiers || [],
          socialProfiles: entity.socialProfiles || [],
          tags: entity.tags || [],
          createdBy: entity.createdBy,
          updatedBy: entity.updatedBy,
          ...(createdAt ? { createdAt } : {}),
          ...(updatedAt ? { updatedAt } : {})
        };
      }),
      artifacts: (caseData.artifacts || []).map(artifact => {
        const capturedAt = this.toPdfDate(artifact.capturedAt);
        return {
          artifactId: artifact.artifactId,
          type: artifact.type,
          title: artifact.title,
          description: artifact.description,
          source: artifact.source,
          artifactTypeOtherValue: artifact.artifactTypeOtherValue,
          artifactSourceOtherValue: artifact.artifactSourceOtherValue,
          url: artifact.url,
          files: artifact.files || [],
          tags: artifact.tags || [],
          ...(capturedAt ? { capturedAt } : {})
        };
      }),
      tasks: (caseData.tasks || []).map(task => {
        const dueAt = this.toPdfDate(task.dueAt);
        const createdAt = this.toPdfDate(task.createdAt);
        const updatedAt = this.toPdfDate(task.updatedAt);
        const completedAt = this.toPdfDate(task.completedAt);
        return {
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo ? this.getAnalystLabel(task.assignedTo) : '',
          ...(dueAt ? { dueAt } : {}),
          ...(createdAt ? { createdAt } : {}),
          ...(updatedAt ? { updatedAt } : {}),
          ...(completedAt ? { completedAt } : {})
        };
      }),
      linkedCases: (caseData.linkedCases || []).map(linkedCase => {
        const createdAt = this.toPdfDate(linkedCase.createdAt);
        return {
          targetCaseId: linkedCase.targetCaseId,
          relationship: linkedCase.relationship,
          reason: linkedCase.reason,
          createdBy: linkedCase.createdBy,
          ...(createdAt ? { createdAt } : {})
        };
      }),
      comments: (caseData.comments || []).map(comment => {
        const createdAt = this.toPdfDate(comment.createdAt);
        const updatedAt = this.toPdfDate(comment.updatedAt);
        return {
          commentId: comment.commentId,
          body: comment.body,
          entityIds: comment.entityIds || [],
          artifactIds: comment.artifactIds || [],
          createdBy: comment.createdBy,
          ...(createdAt ? { createdAt } : {}),
          ...(updatedAt ? { updatedAt } : {})
        };
      }),
      closure: caseData.closure ? {
        reason: caseData.closure.reason,
        closureReasonOtherValue: caseData.closure.closureReasonOtherValue,
        summary: caseData.closure.summary,
        resolution: caseData.closure.resolution,
        ...((this.toPdfDate(caseData.closure.closedAt || caseData.closedAt)) ? { closedAt: this.toPdfDate(caseData.closure.closedAt || caseData.closedAt) } : {})
      } : null
    };

    const createdAt = this.toPdfDate(caseData.createdAt);
    const updatedAt = this.toPdfDate(caseData.updatedAt);
    const closedAt = this.toPdfDate(caseData.closedAt);
    if (createdAt) {
      report.createdAt = createdAt;
    }
    if (updatedAt) {
      report.updatedAt = updatedAt;
    }
    if (closedAt) {
      report.closedAt = closedAt;
    }
    return report;
  }

  private toPdfDate(value?: Date | string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    return value instanceof Date ? value.toISOString() : String(value);
  }

  private cancelAllSectionModes(): void {
    this.isAddingRelatedEntity = false;
    this.isAddingArtifact = false;
    this.isAddingTask = false;
    this.isAddingLinkedCase = false;
    this.isClosingCase = false;

    this.newRelatedEntity = null;
    this.newArtifact = null;
    this.pendingNewArtifactFiles = [];
    this.pendingNewArtifactFileInput = null;
    this.newTask = null;
    this.newLinkedCase = null;
    this.newClosure = null;
  }

  get editablePrimaryEntity(): CaseEntity | null {
    if (!this.editedCase) {
      return null;
    }
    return this.ensurePrimaryEntity(this.editedCase);
  }

  getPrimaryEntity(caseItem: Case | null = this.caseData): CaseEntity | null {
    if (!caseItem?.entities?.length) {
      return null;
    }
    return caseItem.entities.find(entity => entity.entityId === caseItem.primaryEntityId)
      || caseItem.entities.find(entity => entity.role === 'primary')
      || caseItem.entities[0];
  }

  getRelatedEntities(caseItem: Case | null = this.caseData): CaseEntity[] {
    const primaryEntity = this.getPrimaryEntity(caseItem);
    return caseItem?.entities?.filter(entity => entity.entityId !== primaryEntity?.entityId) || [];
  }

  removeRelatedEntity(index: number): void {
    if (!this.editedCase) {
      return;
    }

    const relatedEntity = this.getRelatedEntities(this.editedCase)[index];

    if (!relatedEntity) {
      return;
    }

    this.editedCase.entities = this.editedCase.entities.filter(entity => entity.entityId !== relatedEntity.entityId);

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase),
      'Related entity removed successfully');
  }

  removeArtifact(index: number): void {
    if (!this.editedCase?.artifacts) {
      return;
    }

    this.editedCase.artifacts = this.editedCase.artifacts.filter((_, i) => i !== index);

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase),
      'Artifact removed successfully');
  }

  removeTask(index: number): void {
    if (!this.editedCase?.tasks) {
      return;
    }

    this.editedCase.tasks = this.editedCase.tasks.filter((_, i) => i !== index);

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase),
      'Task removed successfully');
  }

  removeLinkedCase(index: number): void {
    if (!this.editedCase?.linkedCases) {
      return;
    }

    this.editedCase.linkedCases = this.editedCase.linkedCases.filter((_, i) => i !== index);

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase),
      'Linked case removed successfully');
  }

  hasCaseChanged(): boolean {
    if (!this.editedCase || !this.caseData) {
      return false;
    }
    return this.getCaseSaveSignature(this.editedCase) !== this.getCaseSaveSignature(this.caseData);
  }

  getLinkableCases(caseItem: Case | null = this.editedCase || this.caseData, currentSelectedCaseId = ''): Case[] {
    const currentCaseId = caseItem?.caseId;

    const alreadyLinkedCaseIds = new Set((caseItem?.linkedCases || [])
      .map(linkedCase => linkedCase.targetCaseId)
      .filter(caseId => caseId && caseId !== currentSelectedCaseId));

    return this.accessibleCases.filter(item =>
      item.caseId !== currentCaseId &&
      !alreadyLinkedCaseIds.has(item.caseId));
  }

  hasLinkableCases(caseItem: Case | null = this.editedCase || this.caseData, currentSelectedCaseId = ''): boolean {
    return this.getLinkableCases(caseItem, currentSelectedCaseId).length > 0;
  }

  getCaseCommentsFeedback(): ReportFeedbackModel {
    const comments = (this.caseData?.comments || []).map(comment => ({
      user_id: comment.createdBy || '',
      username: this.getAnalystLabel(comment.createdBy),
      comment: comment.body,
      created_at: String(comment.createdAt || ''),
      updated_at: String(comment.updatedAt || comment.createdAt || '')
    }));
    return new ReportFeedbackModel({
      doc_id: this.caseData?.caseId || '',
      comments
    });
  }

  openAddRelatedEntity(): void {
    if (!this.caseData || this.isEditing) {
      return;
    }

    this.cancelAllSectionModes();
    this.isAddingRelatedEntity = true;
    this.newRelatedEntity = {
      ...structuredClone(DEFAULT_RELATED_CASE_ENTITY_TEMPLATE),
      entityId: this.createId()
    };
  }

  openAddArtifact(): void {
    if (!this.caseData || this.isEditing) {
      return;
    }

    this.cancelAllSectionModes();
    this.isAddingArtifact = true;
    this.newArtifact = {
      ...structuredClone(DEFAULT_CASE_ARTIFACT_TEMPLATE),
      artifactId: this.createId()
    };
  }

  openAddTask(): void {
    if (!this.caseData || this.isEditing) {
      return;
    }

    this.cancelAllSectionModes();
    this.isAddingTask = true;
    this.newTask = {
      ...structuredClone(DEFAULT_CASE_TASK_TEMPLATE),
      taskId: this.createId()
    };
  }

  openAddLinkedCase(): void {
    if (!this.caseData || this.isEditing || !this.hasLinkableCases(this.caseData)) {
      return;
    }

    this.cancelAllSectionModes();
    this.isAddingLinkedCase = true;
    this.newLinkedCase = {
      targetCaseId: '',
      relationship: 'related',
      reason: ''
    };
  }

  openCloseCase(): void {
    if (!this.caseData || this.isEditing || this.caseData.closure) {
      return;
    }

    this.cancelAllSectionModes();
    this.isClosingCase = true;
    this.newClosure = {
      reason: 'remediated',
      summary: '',
      resolution: ''
    };
  }

  openEditClosure(): void {
    if (!this.caseData || this.isEditing || !this.caseData.closure) {
      return;
    }

    this.cancelAllSectionModes();
    this.isClosingCase = true;
    this.newClosure = JSON.parse(JSON.stringify(this.caseData.closure));
  }

  cancelSectionMode(): void {
    this.cancelAllSectionModes();
  }

  private saveCasePayload(payload: CaseUpdateRequest, successMessage: string): void {
    if (!this.caseData) {
      return;
    }

    this.caseService.updateCase(this.caseData.caseId, payload).subscribe({
      next: updated => {
        updated.artifacts = updated.artifacts || [];
        updated.tasks = updated.tasks || [];
        updated.comments = updated.comments || [];
        updated.linkedCases = updated.linkedCases || [];
        updated.assignedAnalystIds = updated.assignedAnalystIds || [];
        updated.closure = updated.closure || null;

        this.caseData = updated;
        this.isEditing = false;
        this.activeEditSection = null;
        this.editedCase = null;
        this.cancelAllSectionModes();

        this.messageNotificationService.show(successMessage, 'success');
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to save changes');
      }
    });
  }

  saveCaseDetails(): void {
    if (!this.editedCase) {
      return;
    }

    if (!this.editedCase.title.trim()) {
      this.messageNotificationService.show('Case title is required');
      return;
    }

    if (!this.validateOtherValue(this.editedCase.caseType, this.editedCase.caseTypeOtherValue, 'Other case type is required')) {
      return;
    }
    if (!this.validateOtherValue(this.editedCase.intakeSource, this.editedCase.intakeSourceOtherValue, 'Other intake source is required')) {
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Case details updated successfully');
  }

  savePrimaryEntity(): void {
    if (!this.editedCase) {
      return;
    }

    const primaryEntity = this.ensurePrimaryEntity(this.editedCase);

    if (!primaryEntity.value.trim()) {
      this.messageNotificationService.show('Primary entity value is required');
      return;
    }

    if (!this.validateOtherValue(primaryEntity.type, primaryEntity.entityTypeOtherValue, 'Other primary entity type is required')) {
      return;
    }
    if (!this.validateOtherValue(primaryEntity.source, primaryEntity.entitySourceOtherValue, 'Other primary entity source is required')) {
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Primary entity updated successfully');
  }

  saveRelatedEntities(): void {
    if (!this.editedCase) {
      return;
    }

    const invalidIndex = this.getRelatedEntities(this.editedCase).findIndex(entity =>
      !entity.value.trim()
      || (entity.type === 'other' && !entity.entityTypeOtherValue?.trim())
      || (entity.source === 'other' && !entity.entitySourceOtherValue?.trim()));

    if (invalidIndex >= 0) {
      this.messageNotificationService.show(`Related entity ${invalidIndex + 1} is invalid`);
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Related entities updated successfully');
  }

  saveNewRelatedEntity(): void {
    if (!this.caseData || !this.newRelatedEntity) {
      return;
    }

    if (!this.newRelatedEntity.value.trim()) {
      this.messageNotificationService.show('Related entity value is required');
      return;
    }

    if (!this.validateOtherValue(this.newRelatedEntity.type, this.newRelatedEntity.entityTypeOtherValue, 'Other related entity type is required')) {
      return;
    }
    if (!this.validateOtherValue(this.newRelatedEntity.source, this.newRelatedEntity.entitySourceOtherValue, 'Other related entity source is required')) {
      return;
    }

    const draft: Case = JSON.parse(JSON.stringify(this.caseData));
    draft.entities = draft.entities || [];
    draft.entities.push(this.ensureEntityDefaults(this.newRelatedEntity));

    this.saveCasePayload(this.cleanCaseForSave(draft), 'Related entity added successfully');
  }

  saveArtifacts(): void {
    if (!this.editedCase) {
      return;
    }

    const invalidIndex = (this.editedCase.artifacts || []).findIndex(artifact =>
      !artifact.title.trim()
      || (artifact.type === 'other' && !artifact.artifactTypeOtherValue?.trim())
      || (artifact.source === 'other' && !artifact.artifactSourceOtherValue?.trim())
      || (artifact.type === 'report' && (!artifact.linkedReportSource || !artifact.linkedReportId)));

    if (invalidIndex >= 0) {
      this.messageNotificationService.show(`Artifact ${invalidIndex + 1} is invalid`);
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Artifacts updated successfully');
  }

  saveNewArtifact(): void {
    if (!this.caseData || !this.newArtifact) {
      return;
    }

    if (!this.newArtifact.title.trim()) {
      this.messageNotificationService.show('Artifact title is required');
      return;
    }

    if (!this.validateOtherValue(this.newArtifact.type, this.newArtifact.artifactTypeOtherValue, 'Other artifact type is required')) {
      return;
    }

    if (!this.validateOtherValue(this.newArtifact.source, this.newArtifact.artifactSourceOtherValue, 'Other artifact source is required')) {
      return;
    }

    if (this.newArtifact.type === 'url_capture' && !this.newArtifact.url?.trim()) {
      this.messageNotificationService.show('URL is required');
      return;
    }

    if (this.newArtifact.type === 'report' && (!this.newArtifact.linkedReportSource || !this.newArtifact.linkedReportId)) {
      this.messageNotificationService.show('Please select a report');
      return;
    }

    if ((this.newArtifact.type === 'screenshot' || this.newArtifact.type === 'file') && !this.pendingNewArtifactFiles.length) {
      this.messageNotificationService.show('Please select at least one file');
      return;
    }

    const artifactToSave = this.ensureArtifactDefaults(this.newArtifact);
    const draft: Case = JSON.parse(JSON.stringify(this.caseData));
    draft.artifacts = [...(draft.artifacts || []), artifactToSave];

    const payload = this.cleanCaseForSave(draft);

    this.caseService.updateCase(this.caseData.caseId, payload).subscribe({
      next: updated => {
        updated.artifacts = updated.artifacts || [];
        updated.tasks = updated.tasks || [];
        updated.comments = updated.comments || [];
        updated.linkedCases = updated.linkedCases || [];
        updated.assignedAnalystIds = updated.assignedAnalystIds || [];
        updated.closure = updated.closure || null;

        this.caseData = updated;

        const savedArtifact = updated.artifacts.find(item => item.artifactId === artifactToSave.artifactId);

        if (savedArtifact && this.pendingNewArtifactFiles.length && (savedArtifact.type === 'screenshot' || savedArtifact.type === 'file')) {
          this.caseService.uploadArtifactFiles(updated.caseId, savedArtifact.artifactId, this.pendingNewArtifactFiles).subscribe({
            next: uploaded => {
              savedArtifact.files = uploaded.files || [];
              this.pendingNewArtifactFiles = [];

              if (this.pendingNewArtifactFileInput) {
                this.pendingNewArtifactFileInput.value = '';
              }

              this.pendingNewArtifactFileInput = null;
              this.cancelAllSectionModes();

              this.messageNotificationService.show('Artifact added successfully', 'success');
            },
            error: err => {
              this.pendingNewArtifactFiles = [];
              this.pendingNewArtifactFileInput = null;
              this.messageNotificationService.show(err?.error?.detail || err?.message || 'Artifact saved, but file upload failed');
            }
          });

          return;
        }

        this.pendingNewArtifactFiles = [];
        this.pendingNewArtifactFileInput = null;
        this.cancelAllSectionModes();

        this.messageNotificationService.show('Artifact added successfully', 'success');
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to add artifact');
      }
    });
  }

  saveTasks(): void {
    if (!this.editedCase) {
      return;
    }

    const invalidIndex = (this.editedCase.tasks || []).findIndex(task => !task.title.trim());

    if (invalidIndex >= 0) {
      this.messageNotificationService.show(`Task ${invalidIndex + 1} title is required`);
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Tasks updated successfully');
  }

  saveNewTask(): void {
    if (!this.caseData || !this.newTask) {
      return;
    }

    if (!this.newTask.title.trim()) {
      this.messageNotificationService.show('Task title is required');
      return;
    }

    const draft: Case = JSON.parse(JSON.stringify(this.caseData));
    draft.tasks = [...(draft.tasks || []), this.ensureTaskDefaults(this.newTask)];

    this.saveCasePayload(this.cleanCaseForSave(draft), 'Task added successfully');
  }

  saveLinkedCases(): void {
    if (!this.editedCase) {
      return;
    }

    const linkedCases = this.editedCase.linkedCases || [];

    const invalidIndex = linkedCases.findIndex(link => !link.targetCaseId);

    if (invalidIndex >= 0) {
      this.messageNotificationService.show(`Linked case ${invalidIndex + 1} target case is required`);
      return;
    }

    if (this.hasDuplicateLinkedCases(linkedCases)) {
      this.messageNotificationService.show('Same case cannot be linked more than once');
      return;
    }

    this.saveCasePayload(this.cleanCaseForSave(this.editedCase), 'Linked cases updated successfully');
  }

  saveNewLinkedCase(): void {
    if (!this.caseData || !this.newLinkedCase) {
      return;
    }

    if (!this.newLinkedCase.targetCaseId) {
      this.messageNotificationService.show('Target case is required');
      return;
    }

    const alreadyLinked = (this.caseData.linkedCases || [])
      .some(link => link.targetCaseId === this.newLinkedCase?.targetCaseId);

    if (alreadyLinked) {
      this.messageNotificationService.show('This case is already linked');
      return;
    }

    const draft: Case = JSON.parse(JSON.stringify(this.caseData));
    draft.linkedCases = [...(draft.linkedCases || []), this.newLinkedCase];

    this.saveCasePayload(this.cleanCaseForSave(draft), 'Linked case added successfully');
  }

  saveClosure(): void {
    if (!this.caseData || !this.newClosure) {
      return;
    }

    if (this.newClosure.reason === 'other' && !this.newClosure.closureReasonOtherValue?.trim()) {
      this.messageNotificationService.show('Other closure reason is required');
      return;
    }

    const draft: Case = JSON.parse(JSON.stringify(this.caseData));
    draft.status = 'closed';
    draft.closure = this.newClosure;

    this.saveCasePayload(this.cleanCaseForSave(draft), 'Case closed successfully');
  }

  saveCaseComment(body: string): void {
    if (!this.caseData || !body.trim()) {
      return;
    }
    this.isCommentSaving = true;
    this.commentErrorMessage = '';
    const comments: CaseCommentRequest[] = [
      ...(this.caseData.comments || []).map(comment => this.cleanComment(comment)),
      {
        commentId: this.createId(),
        body: body.trim(),
        entityIds: [],
        artifactIds: []
      }
    ];
    const payload = {
      ...this.cleanCaseForSave(this.caseData),
      comments
    };
    this.caseService.updateCase(this.caseData.caseId, payload).subscribe({
      next: updated => {
        updated.comments = updated.comments || [];
        updated.linkedCases = updated.linkedCases || [];
        this.caseData = updated;
        this.isCommentSaving = false;
      },
      error: err => {
        this.isCommentSaving = false;
        this.commentErrorMessage = err?.error?.detail || err?.message || 'Unable to save comment.';
      }
    });
  }

  openUserSidebar(userId: string): void {
    this.userSidebar?.open(userId);
  }

  getAnalystLabel(userId?: string): string {
    if (!userId) {
      return 'Unassigned';
    }
    const analyst = this.analysts.find(item => item.id === userId);
    if (!analyst) {
      return userId;
    }
    return analyst.username || analyst.email || analyst.id;
  }

  toggleTag(tag: CaseTag): void {
    if (!this.editedCase) {
      return;
    }
    if (this.editedCase.tags.includes(tag)) {
      this.editedCase.tags = this.editedCase.tags.filter(item => item !== tag);
      return;
    }
    this.editedCase.tags = [...this.editedCase.tags, tag];
  }

  isTagSelected(tag: CaseTag): boolean {
    return this.editedCase?.tags.includes(tag) || false;
  }

  toggleAssignedAnalyst(userId: string): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.assignedAnalystIds = this.editedCase.assignedAnalystIds || [];
    if (this.editedCase.assignedAnalystIds.includes(userId)) {
      this.editedCase.assignedAnalystIds = this.editedCase.assignedAnalystIds.filter(id => id !== userId);
      this.editedCase.tasks = (this.editedCase.tasks || []).map(task => task.assignedTo === userId ? { ...task, assignedTo: '' } : task);
      return;
    }
    this.editedCase.assignedAnalystIds = [...this.editedCase.assignedAnalystIds, userId];
  }

  isAnalystAssignedToCase(userId: string): boolean {
    return this.editedCase?.assignedAnalystIds?.includes(userId) || false;
  }

  getCaseAnalysts(caseItem: Case | null = this.caseData): CaseAnalyst[] {
    const assignedIds = new Set(caseItem?.assignedAnalystIds || []);
    return this.analysts.filter(analyst => assignedIds.has(analyst.id));
  }

  getFormattedDateTime(date?: Date | string | null): string {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }
    return value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  goToLinkedCase(caseId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { caseId },
      queryParamsHandling: 'merge'
    }).then(() => this.loadCaseDetails());
  }

  formatConfidence(value?: string | null): string {
    return this.formatLabel(value || 'high');
  }

  private ensurePrimaryEntity(caseItem: Case): CaseEntity {
    if (!caseItem.entities) {
      caseItem.entities = [];
    }
    let primaryEntity = this.getPrimaryEntity(caseItem);
    if (!primaryEntity) {
      primaryEntity = this.createPrimaryEntity();
      caseItem.entities.push(primaryEntity);
    }
    this.ensureEntityDefaults(primaryEntity);
    primaryEntity.role = 'primary';
    caseItem.primaryEntityId = primaryEntity.entityId;
    return primaryEntity;
  }

  private ensureEntityDefaults(entity: CaseEntity): CaseEntity {
    entity.entityId = entity.entityId || this.createId();
    entity.type = entity.type || 'person';
    entity.value = entity.value || '';
    entity.entityDescription = entity.entityDescription || '';
    entity.role = entity.role || 'related';
    entity.confidence = entity.confidence || 'high';
    entity.source = entity.source || 'manual';
    entity.identifiers = entity.identifiers || [];
    entity.socialProfiles = entity.socialProfiles || [];
    entity.tags = entity.tags || [];
    entity.linkedEntityId = entity.linkedEntityId || '';
    return entity;
  }

  private cleanCaseForSave(caseItem: Case): CaseUpdateRequest {
    const primaryEntity = this.cleanEntity(this.ensurePrimaryEntity(caseItem));
    const relatedEntities = this.getRelatedEntities(caseItem)
      .map(entity => this.cleanEntity(this.ensureEntityDefaults(entity)));

    return {
      title: caseItem.title.trim(),
      description: caseItem.description?.trim() || '',
      caseType: caseItem.caseType,
      caseTypeOtherValue: caseItem.caseTypeOtherValue?.trim() || '',
      status: caseItem.status,
      severity: caseItem.severity,
      priority: caseItem.priority,
      intakeSource: caseItem.intakeSource,
      intakeSourceOtherValue: caseItem.intakeSourceOtherValue?.trim() || '',
      tags: caseItem.tags || [],
      primaryEntityId: primaryEntity.entityId,
      assignedAnalystIds: caseItem.assignedAnalystIds || [],
      artifacts: (caseItem.artifacts || []).map(artifact => this.cleanArtifact(this.ensureArtifactDefaults(artifact))),
      entities: [
        primaryEntity,
        ...relatedEntities
      ],
      tasks: (caseItem.tasks || []).map(task => this.cleanTask(this.ensureTaskDefaults(task))),
      linkedCases: (caseItem.linkedCases || []).map(link => ({
        targetCaseId: link.targetCaseId.trim(),
        relationship: link.relationship,
        reason: link.reason.trim()
      })).filter(link => link.targetCaseId && link.reason),
      closure: caseItem.closure ? this.cleanClosure(caseItem.closure) : null
    };
  }

  private getCaseSaveSignature(caseItem: Case): string {
    return JSON.stringify(this.cleanCaseForSave(JSON.parse(JSON.stringify(caseItem))));
  }

  private ensureArtifactDefaults(artifact: CaseArtifact): CaseArtifact {
    artifact.artifactId = artifact.artifactId || this.createId();
    artifact.type = artifact.type || 'evidence';
    artifact.title = artifact.title || '';
    artifact.description = artifact.description || '';
    artifact.source = artifact.source || 'manual';
    artifact.url = artifact.url || '';
    artifact.files = artifact.files || [];
    artifact.entityIds = artifact.entityIds || [];
    artifact.tags = artifact.tags || [];
    artifact.linkedReportSource = artifact.linkedReportSource || '';
    artifact.linkedReportId = artifact.linkedReportId || '';
    artifact.linkedReportTitle = artifact.linkedReportTitle || '';
    artifact.capturedAt = artifact.capturedAt || null;
    return artifact;
  }

  private cleanArtifact(artifact: CaseArtifact): CaseArtifactRequest {
    return {
      artifactId: artifact.artifactId || this.createId(),
      type: artifact.type,
      artifactTypeOtherValue: artifact.artifactTypeOtherValue?.trim() || '',
      title: artifact.title.trim(),
      description: artifact.description?.trim() || '',
      source: artifact.source || 'manual',
      artifactSourceOtherValue: artifact.artifactSourceOtherValue?.trim() || '',
      url: artifact.url?.trim() || '',
      files: artifact.files || [],
      entityIds: artifact.entityIds || [],
      tags: artifact.tags || [],
      linkedReportSource: artifact.linkedReportSource || '',
      linkedReportId: artifact.linkedReportId || '',
      linkedReportTitle: artifact.linkedReportTitle || '',
      capturedAt: artifact.capturedAt || null
    };
  }

  private ensureTaskDefaults(task: CaseTask): CaseTask {
    task.taskId = task.taskId || this.createId();
    task.title = task.title || '';
    task.description = task.description || '';
    task.status = task.status || 'open';
    task.priority = task.priority || 'medium';
    task.assignedTo = task.assignedTo || '';
    task.dueAt = task.dueAt || null;
    task.entityIds = task.entityIds || [];
    task.artifactIds = task.artifactIds || [];
    return task;
  }

  private cleanTask(task: CaseTask): CaseTaskRequest {
    return {
      taskId: task.taskId || this.createId(),
      title: task.title.trim(),
      description: task.description?.trim() || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      dueAt: task.dueAt || null,
      entityIds: task.entityIds || [],
      artifactIds: task.artifactIds || []
    };
  }

  private cleanComment(comment: CaseComment): CaseCommentRequest {
    return {
      commentId: comment.commentId || this.createId(),
      body: comment.body?.trim() || '',
      entityIds: comment.entityIds || [],
      artifactIds: comment.artifactIds || []
    };
  }

  private cleanClosure(closure: CaseClosure | CaseClosureRequest): CaseClosureRequest {
    return {
      reason: closure.reason || 'other',
      closureReasonOtherValue: closure.closureReasonOtherValue?.trim() || '',
      summary: closure.summary?.trim() || '',
      resolution: closure.resolution?.trim() || ''
    };
  }

  private cleanEntity(entity: CaseEntity): CaseEntityRequest {
    const value = entity.value.trim();

    return {
      entityId: entity.entityId || this.createId(),
      type: entity.type,
      entityTypeOtherValue: entity.entityTypeOtherValue?.trim() || '',
      value,
      entityDescription: entity.entityDescription?.trim() || value,
      role: entity.role,
      confidence: entity.confidence,
      source: entity.source,
      entitySourceOtherValue: entity.entitySourceOtherValue?.trim() || '',
      identifiers: (entity.identifiers || [])
        .filter(identifier => identifier.type && identifier.value.trim())
        .map(identifier => ({
          type: identifier.type,
          identifierTypeOtherValue: identifier.identifierTypeOtherValue?.trim() || '',
          value: identifier.value.trim(),
          issuer: identifier.issuer?.trim() || '',
          verified: !!identifier.verified
        })),
      socialProfiles: (entity.socialProfiles || [])
        .filter(profile => profile.platform && profile.username.trim())
        .map(profile => ({
          platform: profile.platform,
          platformOtherValue: profile.platformOtherValue?.trim() || '',
          username: profile.username.trim(),
          profileUrl: profile.profileUrl?.trim() || '',
          displayName: profile.displayName?.trim() || ''
        })),
      tags: entity.tags || [],
      linkedEntityId: entity.linkedEntityId || '',
    };
  }

  private createPrimaryEntity(): CaseEntity {
    return {
      ...structuredClone(DEFAULT_PRIMARY_CASE_ENTITY_TEMPLATE),
      entityId: this.createId()
    };
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    if (value === 'other' && otherValue?.trim()) {
      return `Other: ${otherValue}`;
    }
    return this.formatLabel(value);
  }

  private validateOtherValue(value: string | undefined | null, otherValue: string | undefined | null, message: string): boolean {
    if (value === 'other' && !otherValue?.trim()) {
      this.messageNotificationService.show(message);
      return false;
    }
    return true;
  }

  private hasDuplicateLinkedCases(linkedCases: { targetCaseId: string }[] = []): boolean {
    const selectedCaseIds = linkedCases
      .map(link => link.targetCaseId)
      .filter(Boolean);

    return new Set(selectedCaseIds).size !== selectedCaseIds.length;
  }

  private validateArtifactFiles(artifact: CaseArtifact, files: File[]): boolean {
    if (!files.length) {
      return false;
    }

    for (const file of files) {
      if (artifact.type === 'screenshot' && file.type !== 'image/png') {
        this.messageNotificationService.show('Screenshots must be PNG images');
        return false;
      }

      if (artifact.type === 'file' && !this.artifactAllowedFileTypes.includes(file.type)) {
        this.messageNotificationService.show('Allowed file types: PDF, JPG, PNG, TXT, DOCX');
        return false;
      }
    }

    return true;
  }
}
