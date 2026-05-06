import { Component, EventEmitter, Output } from '@angular/core';
import { Case } from '../../../../../../../shared/model/case-management/case.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-new-case',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-new-case.html'
})
export class AddNewCase {
  @Output() close = new EventEmitter<void>();
  @Output() caseAdded = new EventEmitter<Case>();
  isOpen = false;

  caseForm: Case = {
    caseId: '',
    caseType: 'Data Leak',
    owner: '',
    createdDate: new Date(),
    modifiedDate: new Date(),
    status: 'open',
    priority: 'low',
    intakeSource: ''
  };

  caseTypeOptions = ['Data Leak', 'Account Takeover', 'Fraud', 'Malware'];
  priorityOptions = ['low', 'medium', 'high', 'critical'];
  statusOptions = ['open', 'in-progress', 'resolved', 'closed'];

  ngOnInit(): void {
    this.generateCaseId();
    this.isOpen = true;
  }

  generateCaseId(): void {
    const stored = localStorage.getItem('nextCaseId');
    let nextId = stored ? parseInt(stored, 10) : 1;
    this.caseForm.caseId = String(nextId).padStart(5, '0');
    localStorage.setItem('nextCaseId', String(nextId + 1));
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

  onSubmit(): void {
    if (!this.caseForm.owner.trim()) {
      alert('Officer name is required');
      return;
    }

    const newCase: Case = {
      ...this.caseForm,
      createdDate: new Date(this.caseForm.createdDate),
      modifiedDate: new Date(this.caseForm.modifiedDate)
    };

    this.caseAdded.emit(newCase);
    this.closePopup();
  }

  closePopup(): void {
    this.isOpen = false;
    setTimeout(() => this.close.emit(), 300);
  }

}