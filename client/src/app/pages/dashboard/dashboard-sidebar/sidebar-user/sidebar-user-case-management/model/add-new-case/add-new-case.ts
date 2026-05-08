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
  primaryEntity: RelatedEntity = { name: '', socialMediaProfiles: [{ platform: '', username: '' }], webUrls: [''], emails: [''], phoneNumbers: [''], additionalIdentifiers: [{ type: '', value: '' }] };
  caseForm: Case = { caseId: '', caseType: 'Data Leak', owner: '', createdDate: new Date(), modifiedDate: new Date(), status: 'open', priority: 'low', intakeSource: '', entityName: '', socialMediaProfiles: [{ platform: '', username: '' }], webUrls: [''], emails: [''], phoneNumbers: [''], additionalIdentifiers: [{ type: '', value: '' }], relatedEntities: [{ name: '', socialMediaProfiles: [{ platform: '', username: '' }], webUrls: [''], emails: [''], phoneNumbers: [''], additionalIdentifiers: [{ type: '', value: '' }] }] };
  caseTypeOptions = ['Data Leak', 'Account Takeover', 'Fraud', 'Malware'];
  priorityOptions = ['low', 'medium', 'high', 'critical'];
  statusOptions = ['open', 'in-progress', 'resolved', 'closed'];
  duplicateLinkingOptions = ['Follow-up', 'Related Investigation', 'Consolidated Case', 'Escalation', 'Other']
  isLinkingCase = false;
  linkedCaseNumber = '';
  linkingReason = '';
  caseNumberError = '';
  caseNumberLoading = false;

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

  syncPrimaryEntityToCase(): void {
    this.caseForm.entityName = this.primaryEntity.name;
    this.caseForm.socialMediaProfiles = this.primaryEntity.socialMediaProfiles;
    this.caseForm.webUrls = this.primaryEntity.webUrls;
    this.caseForm.emails = this.primaryEntity.emails;
    this.caseForm.phoneNumbers = this.primaryEntity.phoneNumbers;
    this.caseForm.additionalIdentifiers = this.primaryEntity.additionalIdentifiers;
  }

  checkCaseExists(): void {
    if (!this.linkedCaseNumber.trim()) {
      this.caseNumberError = '';
      return;
    }

    this.caseNumberLoading = true;
    this.caseNumberError = '';

    setTimeout(() => {
      // Temporary mock validation
      const mockCases = ['00001', '00002', '00003'];
      if (mockCases.includes(this.linkedCaseNumber)) {
        this.caseNumberError = '';
      }
      else {
        this.caseNumberError = `No case found with ID: ${this.linkedCaseNumber}. Please verify the case number and try again.`;
      }
      this.caseNumberLoading = false;
    }, 500);
  }

  onSubmit(): void {
    // Sync primary entity to caseForm
    this.syncPrimaryEntityToCase();

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

    // Validate emails format
    const invalidEmails = this.caseForm.emails.filter(email => {
      if (!email.trim()) {
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(email);
    });
    if (invalidEmails.length > 0) {
      alert('Invalid email format detected in primary entity');
      return;
    }

    // Validate phone numbers format
    const invalidPhones = this.caseForm.phoneNumbers.filter(phone => {
      if (!phone.trim()) {
        return false;
      }
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      return !phoneRegex.test(phone.replace(/\s/g, ''));
    });
    if (invalidPhones.length > 0) {
      alert('Invalid phone number format detected in primary entity');
      return;
    }

    // Validate URLs format
    const invalidUrls = this.caseForm.webUrls.filter(url => {
      if (!url.trim()) {
        return false;
      }
      try {
        new URL(url);
        return false;
      }
      catch {
        return true;
      }
    });
    if (invalidUrls.length > 0) {
      alert('Invalid URL format detected in primary entity');
      return;
    }

    // Validate social media profiles
    const invalidSocial = this.caseForm.socialMediaProfiles.filter(p => {
      return (p.platform && !p.username) || (!p.platform && p.username);
    });
    if (invalidSocial.length > 0) {
      alert('Social media profiles must have both platform and username');
      return;
    }

    // Validate additional identifiers
    const invalidIdentifiers = this.caseForm.additionalIdentifiers.filter(id => {
      return (id.type && !id.value) || (!id.type && id.value);
    });
    if (invalidIdentifiers.length > 0) {
      alert('Additional identifiers must have both type and value');
      return;
    }

    // Validate related entities
    for (let entity of this.caseForm.relatedEntities) {
      if (entity.name.trim()) {
        // Validate related entity emails
        const relatedInvalidEmails = entity.emails.filter(email => {
          if (!email.trim()) {
            return false;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return !emailRegex.test(email);
        });
        if (relatedInvalidEmails.length > 0) {
          alert(`Invalid email format in related entity: ${entity.name}`);
          return;
        }

        // Validate related entity phone numbers
        const relatedInvalidPhones = entity.phoneNumbers.filter(phone => {
          if (!phone.trim()) {
            return false;
          }
          const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
          return !phoneRegex.test(phone.replace(/\s/g, ''));
        });
        if (relatedInvalidPhones.length > 0) {
          alert(`Invalid phone format in related entity: ${entity.name}`);
          return;
        }

        // Validate related entity URLs
        const relatedInvalidUrls = entity.webUrls.filter(url => {
          if (!url.trim()) {
            return false;
          }
          try {
            new URL(url);
            return false;
          }
          catch {
            return true;
          }
        });
        if (relatedInvalidUrls.length > 0) {
          alert(`Invalid URL format in related entity: ${entity.name}`);
          return;
        }

        // Validate related entity social media
        const relatedInvalidSocial = entity.socialMediaProfiles.filter(p => {
          return (p.platform && !p.username) || (!p.platform && p.username);
        });
        if (relatedInvalidSocial.length > 0) {
          alert(`Social media validation failed in related entity: ${entity.name}`);
          return;
        }

        // Validate related entity identifiers
        const relatedInvalidIdentifiers = entity.additionalIdentifiers.filter(id => {
          return (id.type && !id.value) || (!id.type && id.value);
        });
        if (relatedInvalidIdentifiers.length > 0) {
          alert(`Identifier validation failed in related entity: ${entity.name}`);
          return;
        }
      }
    }

    // Validate duplicate/linking case
    if (this.isLinkingCase) {
      if (!this.linkedCaseNumber.trim()) {
        alert('Please enter a case number to link');
        return;
      }

      if (this.caseNumberError) {
        alert(this.caseNumberError);
        return;
      }

      if (!this.linkingReason.trim()) {
        alert('Please provide a reason for linking this case');
        return;
      }

      if (this.linkedCaseNumber === this.caseForm.caseId) {
        alert('Cannot link a case to itself');
        return;
      }
    }

    // Sync primary entity to caseForm
    this.syncPrimaryEntityToCase();

    // Sync linking information
    if (this.isLinkingCase) {
      this.caseForm.linkedCaseId = this.linkedCaseNumber;
      this.caseForm.linkedReason = this.linkingReason;
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