import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { Case, RelatedEntity } from '../../../../../../../shared/model/case-management/case.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EntityDetailsComponent } from '../entity-details/entity-details';

@Component({
  selector: 'app-add-new-case',
  imports: [CommonModule, FormsModule, EntityDetailsComponent],
  templateUrl: './add-new-case.html',
  animations: [
    trigger('slideIn', [
      state('closed', style({ transform: 'translateX(100%)' })),
      state('open', style({ transform: 'translateX(0)' })),
      transition('closed => open', animate('300ms ease-out')),
      transition('open => closed', animate('250ms ease-in'))
    ])
  ]
})
export class AddNewCase {
  isOpen = false;
  caseForm: Case = { caseId: '', caseType: 'Data Leak', owner: '', createdDate: new Date(), modifiedDate: new Date(), status: 'open', priority: 'low', intakeSource: '', entityName: '', socialMediaProfiles: [{ platform: '', username: '' }], webUrls: [''], emails: [''], phoneNumbers: [''], additionalIdentifiers: [{ type: '', value: '' }], relatedEntities: [ { name: '', socialMediaProfiles: [{ platform: '', username: '' }], webUrls: [''], emails: [''], phoneNumbers: [''], additionalIdentifiers: [{ type: '', value: '' }] } ] };
  caseTypeOptions = ['Data Leak', 'Account Takeover', 'Fraud', 'Malware'];
  priorityOptions = ['low', 'medium', 'high', 'critical'];
  statusOptions = ['open', 'in-progress', 'resolved', 'closed'];

  @Output() close = new EventEmitter<void>();
  @Output() caseAdded = new EventEmitter<Case>();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.generateCaseId();
    setTimeout(() => {
      this.isOpen = true;
      this.cdr.detectChanges();
    }, 10);
  }

  generateCaseId(): void {
    const stored = localStorage.getItem('nextCaseId');
    const nextId = stored ? parseInt(stored, 10) : 1;
    this.caseForm.caseId = String(nextId).padStart(5, '0');
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

  closePopup(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.close.emit();
    }, 300);
  }

  addRelatedEntity(): void {
    const newEntity: RelatedEntity = {
      name: '',
      socialMediaProfiles: [{ platform: '', username: '' }],
      webUrls: [''],
      emails: [''],
      phoneNumbers: [''],
      additionalIdentifiers: [{ type: '', value: '' }]
    };
    this.caseForm.relatedEntities.push(newEntity);
  }

  removeRelatedEntity(index: number): void {
    this.caseForm.relatedEntities.splice(index, 1);
  }

  onSubmit(): void {
    // Validate primary case fields
    if (!this.caseForm.owner.trim()) {
      alert('Officer name is required');
      return;
    }

    if (!this.caseForm.intakeSource.trim()) {
      alert('Intake source is required');
      return;
    }

    if (!this.caseForm.caseType.trim()) {
      alert('Case type is required');
      return;
    }

    if (!this.caseForm.priority.trim()) {
      alert('Priority is required');
      return;
    }

    if (!this.caseForm.status.trim()) {
      alert('Status is required');
      return;
    }

    if (!this.caseForm.entityName.trim()) {
      alert('Entity name is required');
      return;
    }

    // Clean up empty arrays
    this.caseForm.socialMediaProfiles = this.caseForm.socialMediaProfiles.filter(p => p.platform && p.username);
    this.caseForm.webUrls = this.caseForm.webUrls.filter(url => url.trim());
    this.caseForm.emails = this.caseForm.emails.filter(email => email.trim());
    this.caseForm.phoneNumbers = this.caseForm.phoneNumbers.filter(phone => phone.trim());
    this.caseForm.additionalIdentifiers = this.caseForm.additionalIdentifiers.filter(id => id.type && id.value);
    this.caseForm.relatedEntities = this.caseForm.relatedEntities.filter(entity => entity.name.trim());

    const stored = localStorage.getItem('nextCaseId');
    const nextId = stored ? parseInt(stored, 10) : 1;
    localStorage.setItem('nextCaseId', String(nextId + 1));

    const newCase: Case = {
      ...this.caseForm,
      createdDate: new Date(this.caseForm.createdDate),
      modifiedDate: new Date(this.caseForm.modifiedDate)
    };

    this.caseAdded.emit(newCase);
    this.closePopup();
  }
}