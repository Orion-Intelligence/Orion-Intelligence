import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityDetailsComponent } from '../entity-details/entity-details';
import { Case } from '../../../../../../../shared/model/case-management/case.model';

@Component({
  selector: 'app-case-details',
  imports: [CommonModule, FormsModule, EntityDetailsComponent],
  templateUrl: './case-details.html',
})
export class CaseDetails implements OnInit {
  caseData: Case | null = null;
  isLoading = true;
  isEditing = false;
  editedCase: Case | null = null;
  linkedCase: Case | null = null;
  isLoadingLinkedCase = false;
  caseTypeOptions = ['Data Leak', 'Account Takeover', 'Fraud', 'Malware'];
  priorityOptions = ['low', 'medium', 'high', 'critical'];
  statusOptions = ['open', 'in-progress', 'resolved', 'closed'];

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.loadCaseDetails();
  }

  loadCaseDetails(): void {
    this.isLoading = true;
    const caseId = this.route.snapshot.queryParamMap.get('caseId');

    if (!caseId) {
      this.isLoading = false;
      alert('No case ID provided');
      this.router.navigate(['/dashboard/profile/case-management']);
      return;
    }

    // Mock data - replace with API call later
    const stored = localStorage.getItem('cases');
    const allCases: Case[] = stored ? JSON.parse(stored) : [];
    const foundCase = allCases.find(c => c.caseId === caseId);

    if (foundCase) {
      this.caseData = foundCase;
      if (foundCase.linkedCaseId) {
        this.loadLinkedCase(foundCase.linkedCaseId);
      }
    }
    else {
      alert('Case not found');
      this.router.navigate(['/dashboard/profile/case-management']);
    }

    this.isLoading = false;
  }

  loadLinkedCase(linkedCaseId: string): void {
    this.isLoadingLinkedCase = true;
    const stored = localStorage.getItem('cases');
    const allCases: Case[] = stored ? JSON.parse(stored) : [];
    const found = allCases.find(c => c.caseId === linkedCaseId);

    if (found) {
      this.linkedCase = found;
    }

    this.isLoadingLinkedCase = false;
  }

  enableEditing(): void {
    if (this.caseData) {
      this.editedCase = JSON.parse(JSON.stringify(this.caseData));
      this.isEditing = true;
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editedCase = null;
  }

  saveChanges(): void {
    if (!this.editedCase) {
      return;
    }

    // Validate
    if (!this.editedCase.owner.trim()) {
      alert('Officer name is required');
      return;
    }

    if (!this.editedCase.intakeSource.trim()) {
      alert('Intake source is required');
      return;
    }

    // Update localStorage
    const stored = localStorage.getItem('cases');
    const allCases: Case[] = stored ? JSON.parse(stored) : [];
    const index = allCases.findIndex(c => c.caseId === this.editedCase!.caseId);

    if (index !== -1) {
      this.editedCase.modifiedDate = new Date();
      allCases[index] = this.editedCase;
      localStorage.setItem('cases', JSON.stringify(allCases));
      this.caseData = this.editedCase;
      this.isEditing = false;
      alert('Case updated successfully');
    }
  }

  getFormattedDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getStatusBadgeClass(status: string): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (status === 'open') {
      return isLightTheme ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/10 text-blue-300';
    }
    if (status === 'in-progress') {
      return isLightTheme ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500/10 text-yellow-300';
    }
    if (status === 'resolved') {
      return isLightTheme ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/10 text-emerald-300';
    }
    return isLightTheme ? 'bg-slate-100 text-slate-700' : 'bg-slate-500/10 text-slate-300';
  }

  getPriorityBadgeClass(priority: string): string {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (priority === 'critical') {
      return isLightTheme ? 'bg-red-100 text-red-800' : 'bg-red-500/10 text-red-300';
    }
    if (priority === 'high') {
      return isLightTheme ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/10 text-orange-300';
    }
    if (priority === 'medium') {
      return isLightTheme ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500/10 text-yellow-300';
    }
    return isLightTheme ? 'bg-green-100 text-green-800' : 'bg-green-500/10 text-green-300';
  }

  goToLinkedCase(): void {
    if (this.linkedCase) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { caseId: this.linkedCase.caseId },
        queryParamsHandling: 'merge'
      });
      window.location.reload();
    }
  }

  goBackToCases(): void {
    this.router.navigate(['/dashboard/profile/case-management']);
  }
}