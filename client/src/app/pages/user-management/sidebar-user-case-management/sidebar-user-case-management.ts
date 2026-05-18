import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Case } from '../../../shared/model/case-management/case.model';
import { AddNewCase } from './model/add-new-case/add-new-case';
import { CaseManagement } from './case-management-service/case-management';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { LicenseService } from '../../../services/licenses/licenses.service';

@Component({
  selector: 'app-sidebar-user-case-management',
  imports: [CommonModule, FormsModule, AddNewCase, ConfirmationPopupComponent],
  templateUrl: './sidebar-user-case-management.html'
})
export class SidebarUserCaseManagement implements OnInit {
  cases: Case[] = [];
  isLoading = false;
  showAddCasePopup = false;
  isDeleteConfirmationOpen = false;
  selectedDeleteCaseId = '';

  constructor(private router: Router, private caseService: CaseManagement, private licenseService: LicenseService) { }

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.isLoading = true;
    this.caseService.getCases().subscribe({
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
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getFormattedTime(date?: Date | string | null): string {
    if (!date) {
      return '';
    }
    return new Date(date).toLocaleTimeString('en-US', {
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
}
