import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragMove, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { Case, CaseStatus } from '../../../../../shared/model/case-management/case.model';
import { CaseManagement } from '../../case-management-service/case-management';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';
import { CASE_STATUS_WORKFLOW } from '../../../../../shared/model/case-management/case.config';

@Component({
  selector: 'app-case-tracking-board',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './case-tracking-board.html',
  styleUrls: ['./case-tracking-board.css']
})
export class CaseTrackingBoard implements OnInit {
  private suppressCardOpen = false;

  cases: Case[] = [];
  isLoading = false;
  selectedCase: Case | null = null;
  targetStatus: CaseStatus | null = null;
  statusReason = '';
  isReasonModalOpen = false;
  isSavingMove = false;
  draggedCase: Case | null = null;
  hoveredDropStatus: CaseStatus | null = null;
  readonly workflow = CASE_STATUS_WORKFLOW;
  readonly canDropIntoAllowedStatus = (drag: CdkDrag<Case>, drop: CdkDropList<CaseStatus>): boolean => {
    const caseItem = drag.data;
    return !!caseItem && this.getAllowedStatuses(caseItem.status).includes(drop.data);
  };

  constructor(private router: Router, private caseService: CaseManagement, private messageNotificationService: MessageNotificationService) { }

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.isLoading = true;

    this.caseService.getCases(false).subscribe({
      next: cases => {
        this.cases = cases || [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to load cases');
      }
    });
  }

  getCasesByStatus(status: CaseStatus): Case[] {
    return this.cases.filter(item => item.status === status);
  }

  getActiveCaseCount(): number {
    return this.cases.filter(item => item.status !== 'resolved' && item.status !== 'closed').length;
  }

  getCompletedCaseCount(): number {
    return this.cases.filter(item => item.status === 'resolved' || item.status === 'closed').length;
  }

  getAllowedStatuses(status: CaseStatus): CaseStatus[] {
    const index = this.workflow.findIndex(item => item.value === status);
    const statuses: CaseStatus[] = [];

    const previousStatus = this.workflow[index - 1]?.value || null;
    const nextStatus = this.workflow[index + 1]?.value || null;

    if (previousStatus && previousStatus !== 'new') {
      statuses.push(previousStatus);
    }

    if (nextStatus && nextStatus !== 'closed') {
      statuses.push(nextStatus);
    }

    return statuses;
  }

  dropCase(event: CdkDragDrop<CaseStatus, CaseStatus, Case>, targetStatus: CaseStatus): void {
    const caseItem = event.item.data;
    this.hoveredDropStatus = null;

    if (!caseItem || event.previousContainer === event.container) {
      return;
    }

    if (!this.getAllowedStatuses(caseItem.status).includes(targetStatus)) {
      this.messageNotificationService.show('Drag cases one workflow lane forward or backward only');
      return;
    }

    this.requestMove(caseItem, targetStatus);
  }

  onCaseDragStarted(caseItem: Case): void {
    this.draggedCase = caseItem;
    this.suppressCardOpen = true;
  }

  onCaseDragMoved(event: CdkDragMove<Case>): void {
    if (!this.draggedCase) {
      return;
    }

    const columnElement = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="tracking-column-shell-"]'))
      .find(element => {
        const rect = element.getBoundingClientRect();

        return event.pointerPosition.x >= rect.left
          && event.pointerPosition.x <= rect.right
          && event.pointerPosition.y >= rect.top
          && event.pointerPosition.y <= rect.bottom;
      });
    const status = columnElement?.dataset['testid']?.replace('tracking-column-shell-', '') as CaseStatus | undefined;

    this.hoveredDropStatus = status && this.getAllowedStatuses(this.draggedCase.status).includes(status)
      ? status
      : null;
  }

  onCaseDragEnded(): void {
    this.draggedCase = null;
    this.hoveredDropStatus = null;
    window.setTimeout(() => {
      this.suppressCardOpen = false;
    }, 120);
  }

  openCaseDetailsFromCard(caseId: string): void {
    if (this.suppressCardOpen) {
      return;
    }

    this.openCaseDetails(caseId);
  }

  requestMove(caseItem: Case, nextStatus: CaseStatus): void {
    const allowedStatuses = this.getAllowedStatuses(caseItem.status);

    if (!allowedStatuses.includes(nextStatus)) {
      this.messageNotificationService.show('Case can only move one step forward or backward');
      return;
    }

    this.selectedCase = caseItem;
    this.targetStatus = nextStatus;
    this.statusReason = '';
    this.isReasonModalOpen = true;
  }

  confirmMove(): void {
    if (!this.selectedCase || !this.targetStatus || this.isSavingMove) {
      return;
    }

    if (!this.statusReason.trim()) {
      this.messageNotificationService.show('Status change reason is required');
      return;
    }

    this.isSavingMove = true;

    this.caseService.updateCaseStatus(this.selectedCase.caseId, {
      status: this.targetStatus,
      reason: this.statusReason.trim()
    }).subscribe({
      next: updatedCase => {
        this.cases = this.cases.map(item =>
          item.caseId === updatedCase.caseId ? updatedCase : item);

        this.isSavingMove = false;
        this.closeReasonModal();
        this.messageNotificationService.show('Case status updated successfully', 'success');
      },
      error: err => {
        this.isSavingMove = false;
        this.messageNotificationService.show(err?.error?.detail || err?.message || 'Failed to update case status');
      }
    });
  }

  closeReasonModal(): void {
    this.isReasonModalOpen = false;
    this.selectedCase = null;
    this.targetStatus = null;
    this.statusReason = '';
  }

  openCaseDetails(caseId: string): void {
    const url = this.router.createUrlTree(['/dashboard/profile/case-management/case-details'], {
      queryParams: { caseId }
    }).toString();

    window.open(url, '_blank');
  }

  formatLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  getCaseTypeLabel(caseItem: Case): string {
    return this.formatLabel(caseItem.caseType === 'other' ? caseItem.caseTypeOtherValue : caseItem.caseType);
  }

  getDateLabel(value?: Date | string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit'
    }).format(date);
  }

  getStatusAccentClass(status: CaseStatus): string {
    if (status === 'resolved') {
      return 'before:bg-emerald-400';
    }

    if (status === 'closed') {
      return 'before:bg-slate-400';
    }

    if (status === 'new' || status === 'intake_review') {
      return 'before:bg-sky-400';
    }

    return 'before:bg-amber-400';
  }

  getStatusDotClass(status: CaseStatus): string {
    if (status === 'resolved') {
      return 'bg-emerald-400';
    }

    if (status === 'closed') {
      return 'bg-slate-400';
    }

    if (status === 'new' || status === 'intake_review') {
      return 'bg-sky-400';
    }

    return 'bg-amber-400';
  }

  getDragColumnClass(status: CaseStatus): string {
    if (!this.draggedCase) {
      return '';
    }

    const targetStatuses = this.getAllowedStatuses(this.draggedCase.status);

    if (status === this.hoveredDropStatus && targetStatuses.includes(status)) {
      return 'case-board-column-active opacity-100';
    }

    if (targetStatuses.includes(status)) {
      return 'opacity-100';
    }

    if (status === this.draggedCase.status) {
      return 'opacity-80';
    }

    return 'opacity-45';
  }

  getSeverityRailClass(value?: string | null): string {
    if (value === 'critical') {
      return 'before:bg-red-400';
    }

    if (value === 'high') {
      return 'before:bg-orange-400';
    }

    if (value === 'medium') {
      return 'before:bg-amber-400';
    }

    return 'before:bg-emerald-400';
  }

  getAssigneeLabel(caseItem: Case): string {
    const count = caseItem.assignedAnalystIds?.length || 0;

    if (count === 0) {
      return 'Unassigned';
    }

    if (count === 1) {
      return '1 analyst';
    }

    return `${count} analysts`;
  }

  getRiskBadgeClass(value?: string | null): string {
    if (value === 'critical') {
      return 'bg-red-500/10 text-red-300 [body.light-theme_&]:bg-red-100 [body.light-theme_&]:text-red-800';
    }

    if (value === 'high') {
      return 'bg-orange-500/10 text-orange-300 [body.light-theme_&]:bg-orange-100 [body.light-theme_&]:text-orange-800';
    }

    if (value === 'medium') {
      return 'bg-amber-500/10 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800';
    }

    return 'bg-emerald-500/10 text-emerald-300 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800';
  }

  getMoveButtonLabel(currentStatus: CaseStatus, targetStatus: CaseStatus): string {
    const currentIndex = this.workflow.findIndex(item => item.value === currentStatus);
    const targetIndex = this.workflow.findIndex(item => item.value === targetStatus);

    if (targetIndex < currentIndex) {
      return `Move back to ${this.formatLabel(targetStatus)}`;
    }

    return `Move to ${this.formatLabel(targetStatus)}`;
  }

  isForwardMove(currentStatus: CaseStatus, targetStatus: CaseStatus): boolean {
    const currentIndex = this.workflow.findIndex(item => item.value === currentStatus);
    const targetIndex = this.workflow.findIndex(item => item.value === targetStatus);

    return targetIndex > currentIndex;
  }
}
