import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Case, CaseAnalyst, CaseTask } from '../../../../../../shared/model/case-management/case.model';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../../../../../shared/model/case-management/case-management.defaults';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { caseListItemMotion, caseModeSwapMotion, caseSectionMotion } from '../case-details.animations';
import { CaseDateField, CaseDateTarget, formatCaseLabel, getAssignedCaseAnalysts, getCaseAnalystLabel, getCaseDateInputValue, getFormattedCaseDateTime, setCaseDateInputValue } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';
import { CaseEditDrawerComponent } from '../case-edit-drawer/case-edit-drawer';

@Component({
  selector: 'app-case-tasks-section',
  imports: [CommonModule, FormsModule, TooltipDirective, CaseEditDrawerComponent],
  animations: [caseListItemMotion, caseModeSwapMotion, caseSectionMotion],
  host: { class: 'block' },
  templateUrl: './case-tasks-section.html'
})
export class CaseTasksSectionComponent {
  readonly store = inject(CaseDetailsStore);
  taskStatusOptions = TASK_STATUS_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  editingTaskIndex: number | null = null;

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get editedCase(): Case | null {
    return this.store.editedCase;
  }

  get isEditing(): boolean {
    return this.store.activeEditSection === 'tasks';
  }

  get isAddingTask(): boolean {
    return this.store.isAddingTask;
  }

  get newTask(): CaseTask | null {
    return this.store.newTask;
  }

  get analysts(): CaseAnalyst[] {
    return this.store.analysts;
  }

  get selectedEditableTask(): CaseTask | null {
    if (this.editingTaskIndex === null) {
      return null;
    }

    return this.editedCase?.tasks?.[this.editingTaskIndex] || null;
  }

  openEditTask(index: number): void {
    this.editingTaskIndex = index;
    this.store.enableEditing('tasks');
  }

  cancelTaskEditing(): void {
    this.editingTaskIndex = null;
    this.store.cancelEditing();
  }

  hasTasksChanged(): boolean {
    return (this.editedCase?.tasks?.length || 0) !== (this.caseData?.tasks?.length || 0);
  }

  getCaseAnalysts(caseItem: Case | null = this.caseData): CaseAnalyst[] {
    return getAssignedCaseAnalysts(this.analysts, caseItem);
  }

  getAnalystLabel(userId?: string): string {
    return getCaseAnalystLabel(this.analysts, userId);
  }

  getFormattedDateTime(date?: Date | string | null): string {
    return getFormattedCaseDateTime(date);
  }

  getDateInputValue(date?: Date | string | null): string {
    return getCaseDateInputValue(date);
  }

  setDateInputValue(target: CaseDateTarget, field: CaseDateField, value: string): void {
    setCaseDateInputValue(target, field, value);
  }

  formatLabel(value?: string | null): string {
    return formatCaseLabel(value);
  }
}
