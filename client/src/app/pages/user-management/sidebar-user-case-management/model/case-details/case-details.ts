import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityDetailsComponent } from '../entity-details/entity-details';
import { ReportFeedbackCommentsComponent } from '../../../../../sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component';
import { ReportUserSidebarComponent } from '../../../../../sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component';
import { ReportFeedbackModel } from '../../../../../sections/report/templates/report_general/models/report-feedback.model';
import { Case, CaseAnalyst, CaseArtifact, CaseArtifactRequest, CaseClosure, CaseClosureRequest, CaseComment, CaseCommentRequest, CaseEntity, CaseEntityRequest, CaseTag, CaseTask, CaseTaskRequest, CaseUpdateRequest } from '../../../../../shared/model/case-management/case.model';
import { ARTIFACT_TYPE_OPTIONS, CASE_LINK_RELATIONSHIP_OPTIONS, CASE_STATUS_OPTIONS, CASE_TAG_OPTIONS, CASE_TYPE_OPTIONS, CLOSURE_REASON_OPTIONS, DEFAULT_CASE_ARTIFACT_TEMPLATE, DEFAULT_CASE_TASK_TEMPLATE, DEFAULT_PRIMARY_CASE_ENTITY_TEMPLATE, DEFAULT_RELATED_CASE_ENTITY_TEMPLATE, INTAKE_SOURCE_OPTIONS, PRIORITY_OPTIONS, SEVERITY_OPTIONS, SOURCE_TYPE_OPTIONS, TASK_STATUS_OPTIONS } from '../../../../../shared/model/case-management/case-management.defaults';
import { CaseManagement } from '../../case-management-service/case-management';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';
import { ConfirmationPopupComponent } from '../../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { TooltipDirective } from '../../../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-case-details',
  imports: [CommonModule, FormsModule, EntityDetailsComponent, ReportFeedbackCommentsComponent, ReportUserSidebarComponent, ConfirmationPopupComponent, TooltipDirective],
  templateUrl: './case-details.html',
})
export class CaseDetails implements OnInit {
  @ViewChild(ReportUserSidebarComponent) private userSidebar?: ReportUserSidebarComponent;

  caseData: Case | null = null;
  isLoading = true;
  isEditing = false;
  editedCase: Case | null = null;
  expandedRelatedEntityIds = new Set<string>();
  analysts: CaseAnalyst[] = [];
  accessibleCases: Case[] = [];
  isCommentSaving = false;
  isShareCreating = false;
  isShareRevoking = false;
  pendingShareAction: 'create' | 'revoke' | null = null;
  commentErrorMessage = '';
  caseTypeOptions = CASE_TYPE_OPTIONS;
  intakeSourceOptions = INTAKE_SOURCE_OPTIONS;
  statusOptions = CASE_STATUS_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  taskStatusOptions = TASK_STATUS_OPTIONS;
  artifactTypeOptions = ARTIFACT_TYPE_OPTIONS;
  sourceTypeOptions = SOURCE_TYPE_OPTIONS;
  caseLinkRelationshipOptions = CASE_LINK_RELATIONSHIP_OPTIONS;
  closureReasonOptions = CLOSURE_REASON_OPTIONS;
  tagOptions: { value: CaseTag; label: string }[] = CASE_TAG_OPTIONS;

  constructor(private route: ActivatedRoute, private router: Router, private caseService: CaseManagement, private messageNotificationService: MessageNotificationService) { }

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
        this.isLoading = false;
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

  enableEditing(): void {
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
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editedCase = null;
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

  saveChanges(): void {
    if (!this.editedCase) {
      return;
    }

    if (!this.editedCase.title.trim()) {
      this.messageNotificationService.show('Case title is required');
      return;
    }

    const primaryEntity = this.ensurePrimaryEntity(this.editedCase);
    if (!primaryEntity.value.trim()) {
      this.messageNotificationService.show('Primary entity value is required');
      return;
    }

    const invalidRelatedEntityIndex = this.getRelatedEntities(this.editedCase).findIndex(entity => !entity.value.trim());
    if (invalidRelatedEntityIndex >= 0) {
      this.messageNotificationService.show(`Related entity ${invalidRelatedEntityIndex + 1} value is required`);
      return;
    }

    const invalidArtifactIndex = (this.editedCase.artifacts || []).findIndex(artifact => !artifact.title.trim());
    if (invalidArtifactIndex >= 0) {
      this.messageNotificationService.show(`Artifact ${invalidArtifactIndex + 1} title is required`);
      return;
    }

    const invalidTaskIndex = (this.editedCase.tasks || []).findIndex(task => !task.title.trim());
    if (invalidTaskIndex >= 0) {
      this.messageNotificationService.show(`Task ${invalidTaskIndex + 1} title is required`);
      return;
    }

    const payload = this.cleanCaseForSave(this.editedCase);
    this.caseService.updateCase(this.editedCase.caseId, payload).subscribe({
      next: (updated) => {
        this.caseData = updated;
        this.isEditing = false;
        this.editedCase = null;
        this.messageNotificationService.show('Case updated successfully', 'success');
      },
      error: (err) => {
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to update case');
      }
    });
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

  addRelatedEntity(): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.entities = this.editedCase.entities || [];
    this.editedCase.entities.push({
      ...structuredClone(DEFAULT_RELATED_CASE_ENTITY_TEMPLATE),
      entityId: this.createId()
    });
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
  }

  addArtifact(): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.artifacts = this.editedCase.artifacts || [];
    this.editedCase.artifacts.push({
      ...structuredClone(DEFAULT_CASE_ARTIFACT_TEMPLATE),
      artifactId: this.createId()
    });
  }

  removeArtifact(index: number): void {
    if (!this.editedCase?.artifacts) {
      return;
    }
    this.editedCase.artifacts.splice(index, 1);
  }

  addTask(): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.tasks = this.editedCase.tasks || [];
    this.editedCase.tasks.push({
      ...structuredClone(DEFAULT_CASE_TASK_TEMPLATE),
      taskId: this.createId()
    });
  }

  removeTask(index: number): void {
    if (!this.editedCase?.tasks) {
      return;
    }
    this.editedCase.tasks.splice(index, 1);
  }

  addLinkedCase(): void {
    if (!this.editedCase || !this.hasLinkableCases(this.editedCase)) {
      return;
    }
    this.editedCase.linkedCases = this.editedCase.linkedCases || [];
    this.editedCase.linkedCases.push({
      targetCaseId: '',
      relationship: 'related',
      reason: ''
    });
  }

  removeLinkedCase(index: number): void {
    if (!this.editedCase?.linkedCases) {
      return;
    }
    this.editedCase.linkedCases.splice(index, 1);
  }

  addClosure(): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.closure = {
      reason: 'remediated',
      summary: '',
      resolution: ''
    };
    this.editedCase.status = 'closed';
  }

  removeClosure(): void {
    if (!this.editedCase) {
      return;
    }
    this.editedCase.closure = null;
    if (this.editedCase.status === 'closed') {
      this.editedCase.status = 'review';
    }
  }

  hasCaseChanged(): boolean {
    if (!this.editedCase || !this.caseData) {
      return false;
    }
    return this.getCaseSaveSignature(this.editedCase) !== this.getCaseSaveSignature(this.caseData);
  }

  hasClosureChanged(): boolean {
    return Boolean(this.editedCase?.closure) !== Boolean(this.caseData?.closure);
  }

  hasRelatedEntitiesChanged(): boolean {
    return this.getRelatedEntities(this.editedCase).length !== this.getRelatedEntities(this.caseData).length;
  }

  hasArtifactsChanged(): boolean {
    return (this.editedCase?.artifacts?.length || 0) !== (this.caseData?.artifacts?.length || 0);
  }

  hasTasksChanged(): boolean {
    return (this.editedCase?.tasks?.length || 0) !== (this.caseData?.tasks?.length || 0);
  }

  hasLinkedCasesChanged(): boolean {
    return (this.editedCase?.linkedCases?.length || 0) !== (this.caseData?.linkedCases?.length || 0);
  }

  getLinkableCases(caseItem: Case | null = this.editedCase || this.caseData): Case[] {
    const currentCaseId = caseItem?.caseId;
    return this.accessibleCases.filter(item => item.caseId !== currentCaseId);
  }

  hasLinkableCases(caseItem: Case | null = this.editedCase || this.caseData): boolean {
    return this.getLinkableCases(caseItem).length > 0;
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

  getDateInputValue(date?: Date | string | null): string {
    if (!date) {
      return '';
    }
    return new Date(date).toISOString().slice(0, 10);
  }

  setDateInputValue(target: { dueAt?: Date | string | null; capturedAt?: Date | string | null }, field: 'dueAt' | 'capturedAt', value: string): void {
    target[field] = value ? new Date(`${value}T00:00:00`).toISOString() : null;
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
    primaryEntity.relationshipToCase = 'subject_of_case';
    caseItem.primaryEntityId = primaryEntity.entityId;
    return primaryEntity;
  }

  private ensureEntityDefaults(entity: CaseEntity): CaseEntity {
    entity.entityId = entity.entityId || this.createId();
    entity.type = entity.type || 'person';
    entity.value = entity.value || '';
    entity.entityDescription = entity.entityDescription || '';
    entity.role = entity.role || 'related';
    entity.relationshipToCase = entity.relationshipToCase || 'related_to';
    entity.confidence = entity.confidence ?? 1;
    entity.source = entity.source || 'manual';
    entity.identifiers = entity.identifiers || [];
    entity.socialProfiles = entity.socialProfiles || [];
    entity.tags = entity.tags || [];
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
      status: caseItem.status,
      severity: caseItem.severity,
      priority: caseItem.priority,
      intakeSource: caseItem.intakeSource,
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
    artifact.fileName = artifact.fileName || '';
    artifact.fileType = artifact.fileType || '';
    artifact.entityIds = artifact.entityIds || [];
    artifact.tags = artifact.tags || [];
    artifact.capturedAt = artifact.capturedAt || null;
    return artifact;
  }

  private cleanArtifact(artifact: CaseArtifact): CaseArtifactRequest {
    return {
      artifactId: artifact.artifactId || this.createId(),
      type: artifact.type,
      title: artifact.title.trim(),
      description: artifact.description?.trim() || '',
      source: artifact.source || 'manual',
      url: artifact.url?.trim() || '',
      fileName: artifact.fileName?.trim() || '',
      fileType: artifact.fileType?.trim() || '',
      entityIds: artifact.entityIds || [],
      tags: artifact.tags || [],
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
      summary: closure.summary?.trim() || '',
      resolution: closure.resolution?.trim() || ''
    };
  }

  private cleanEntity(entity: CaseEntity): CaseEntityRequest {
    const value = entity.value.trim();
    return {
      entityId: entity.entityId || this.createId(),
      type: entity.type,
      value,
      entityDescription: entity.entityDescription?.trim() || value,
      role: entity.role,
      relationshipToCase: entity.relationshipToCase,
      confidence: entity.confidence,
      source: entity.source,
      identifiers: (entity.identifiers || []).filter(identifier => identifier.type && identifier.value.trim()),
      socialProfiles: (entity.socialProfiles || []).filter(profile => profile.platform && profile.username.trim()),
      tags: entity.tags || []
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

}
