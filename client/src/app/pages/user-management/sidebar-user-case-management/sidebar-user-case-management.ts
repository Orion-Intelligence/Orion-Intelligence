import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Case } from '../../../shared/model/case-management/case.model';
import { AddNewCase } from './model/add-new-case/add-new-case';
import { CaseManagement } from './case-management-service/case-management';

@Component({
  selector: 'app-sidebar-user-case-management',
  imports: [CommonModule, FormsModule, AddNewCase],
  templateUrl: './sidebar-user-case-management.html'
})
export class SidebarUserCaseManagement implements OnInit {
  cases: Case[] = [];
  isLoading = false;
  showAddCasePopup = false;

  constructor(private router: Router, private caseService: CaseManagement) { }

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
}