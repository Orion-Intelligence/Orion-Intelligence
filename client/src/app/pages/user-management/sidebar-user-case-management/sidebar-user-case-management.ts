import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Case, CaseAnalyst } from '../../../shared/model/case-management/case.model';
import { AddNewCase } from './model/add-new-case/add-new-case';
import { CaseManagement } from './case-management-service/case-management';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CaseDialog } from './model/case-dialog/case-dialog';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sidebar-user-case-management',
  imports: [CommonModule, FormsModule, AddNewCase, ConfirmationPopupComponent, TranslatePipe, CaseDialog],
  templateUrl: './sidebar-user-case-management.html'
})
export class SidebarUserCaseManagement implements OnInit {
  cases: Case[] = [];
  isLoading = false;
  showAddCasePopup = false;
  isDeleteConfirmationOpen = false;
  selectedDeleteCaseId = '';
  showArchivedCases = false;
  isAssignAnalystDialogOpen = false;
  selectedAssignCase: Case | null = null;
  analysts: CaseAnalyst[] = [];
  isAnalystsLoading = false;
  isAssignAnalystSaving = false;

  constructor(private router: Router, private caseService: CaseManagement, private licenseService: LicenseService, private messageNotificationService: MessageNotificationService) { }

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.isLoading = true;
    this.caseService.getCases(this.showArchivedCases).subscribe({
      next: (cases) => {
        this.cases = cases;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  addCase(): void {
    this.showAddCasePopup = true;
  }

  closeAddCasePopup(): void {
    this.showAddCasePopup = false;
  }

  onCaseAdded(newCase: Case): void {
    this.cases.push(newCase);
    this.closeAddCasePopup();
  }

  viewCase(caseId: string): void {
    const url = this.router.createUrlTree(['/dashboard/profile/case-management/case-details'], {
      queryParams: { caseId: caseId }
    }).toString();
    window.open(url, '_blank');
  }

  canDeleteCases(): boolean {
    return this.licenseService.isMaintainer();
  }

  openDeleteConfirmation(caseId: string): void {
    if (!this.canDeleteCases()) {
      return;
    }
    this.selectedDeleteCaseId = caseId;
    this.isDeleteConfirmationOpen = true;
  }

  deleteCase(confirmed: boolean): void {
    this.isDeleteConfirmationOpen = false;
    if (!confirmed || !this.selectedDeleteCaseId || !this.canDeleteCases()) {
      this.selectedDeleteCaseId = '';
      return;
    }
    this.caseService.deleteCase(this.selectedDeleteCaseId).subscribe({
      next: () => {
        this.cases = this.cases.filter(item => item.caseId !== this.selectedDeleteCaseId);
        this.selectedDeleteCaseId = '';
      }
    });
  }

  getFormattedDate(date?: Date | string | null): string {
    if (!date) {
      return '-';
    }

    const utcDate = typeof date === 'string' && !date.endsWith('Z') && !date.includes('+')
      ? date + 'Z'
      : date;

    return new Date(utcDate).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getFormattedTime(date?: Date | string | null): string {
    if (!date) {
      return '';
    }

    const utcDate = typeof date === 'string' && !date.endsWith('Z') && !date.includes('+')
      ? date + 'Z'
      : date;

    return new Date(utcDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  toggleArchivedCases(): void {
    this.showArchivedCases = !this.showArchivedCases;
    this.loadCases();
  }

  openTrackingBoard(): void {
    const url = this.router.createUrlTree([
      '/dashboard/profile/case-management/tracking-board'
    ]).toString();

    window.open(url, '_blank');
  }

  loadAnalysts(): void {
    this.isAnalystsLoading = true;

    this.caseService.getAnalysts()
      .pipe(finalize(() => this.isAnalystsLoading = false))
      .subscribe({
        next: (analysts) => {
          this.analysts = analysts || [];
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to load analysts');
          this.closeAssignAnalystDialog();
        }
      });
  }

  openAssignAnalystDialog(caseItem: Case): void {
    this.selectedAssignCase = caseItem;
    this.isAssignAnalystDialogOpen = true;
    this.loadAnalysts();
  }

  closeAssignAnalystDialog(): void {
    this.isAssignAnalystDialogOpen = false;
    this.selectedAssignCase = null;
    this.analysts = [];
  }

  onAnalystAssigned(selectedAnalystId: string): void {
    if (!this.selectedAssignCase) {
      return;
    }

    this.isAssignAnalystSaving = true;

    this.caseService.assignCaseAnalyst(this.selectedAssignCase.caseId, {
      analystId: selectedAnalystId
    })
      .pipe(finalize(() => this.isAssignAnalystSaving = false))
      .subscribe({
        next: (updatedCase) => {
          this.messageNotificationService.show('Case analyst assigned successfully', 'success');
          this.cases = this.cases.map(item =>
            item.caseId === updatedCase.caseId ? updatedCase : item);
          this.closeAssignAnalystDialog();
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to assign analyst');
        }
      });
  }
}
