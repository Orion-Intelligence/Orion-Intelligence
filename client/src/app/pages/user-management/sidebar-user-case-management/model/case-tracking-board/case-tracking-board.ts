import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Case, CaseStatus } from '../../../../../shared/model/case-management/case.model';
import { CaseManagement } from '../../case-management-service/case-management';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';

@Component({
  selector: 'app-case-tracking-board',
  imports: [CommonModule, FormsModule],
  templateUrl: './case-tracking-board.html'
})
export class CaseTrackingBoard implements OnInit {
  cases: Case[] = [];
  isLoading = false;
  selectedCase: Case | null = null;
  targetStatus: CaseStatus | null = null;
  statusReason = '';
  isReasonModalOpen = false;
  isSavingMove = false;
  readonly workflow: { value: CaseStatus; label: string }[] = [{ value: 'new', label: 'New' }, { value: 'intake_review', label: 'Intake Review' }, { value: 'under_investigation', label: 'Under Investigation' }, { value: 'evidence_collection', label: 'Evidence Collection' }, { value: 'verification', label: 'Verification' }, { value: 'regulatory_action', label: 'Regulatory Action' }, { value: 'legal_review', label: 'Legal Review' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }];

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

  getNextStatus(status: CaseStatus): CaseStatus | null {
    const index = this.workflow.findIndex(item => item.value === status);
    const nextStatus = this.workflow[index + 1]?.value || null;

    if (nextStatus === 'closed') {
      return null;
    }

    return nextStatus;
  }

  requestMove(caseItem: Case, nextStatus: CaseStatus): void {
    const allowedNextStatus = this.getNextStatus(caseItem.status);

    if (allowedNextStatus !== nextStatus) {
      this.messageNotificationService.show('Case can only move one step forward');
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
      nextStatus: this.targetStatus,
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
}