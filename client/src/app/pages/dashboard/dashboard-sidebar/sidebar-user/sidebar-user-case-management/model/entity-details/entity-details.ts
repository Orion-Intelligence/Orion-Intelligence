import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelatedEntity } from '../../../../../../../shared/model/case-management/case.model';

@Component({
  selector: 'app-entity-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-details.html'
})
export class EntityDetailsComponent {
  socialMediaPlatforms = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'YouTube'];
  identifierTypes = ['IP Address', 'Domain', 'Wallet Address', 'Employee ID', 'Hash'];

  @Input() entity!: RelatedEntity;
  @Input() isMainEntity = false;
  @Input() entityIndex = 0;

  @Output() remove = new EventEmitter<void>();

  addSocialMedia(): void {
    this.entity.socialMediaProfiles.push({ platform: '', username: '' });
  }

  removeSocialMedia(index: number): void {
    this.entity.socialMediaProfiles.splice(index, 1);
  }

  addWebUrl(): void {
    this.entity.webUrls.push('');
  }

  removeWebUrl(index: number): void {
    this.entity.webUrls.splice(index, 1);
  }

  addEmail(): void {
    this.entity.emails.push('');
  }

  removeEmail(index: number): void {
    this.entity.emails.splice(index, 1);
  }

  addPhoneNumber(): void {
    this.entity.phoneNumbers.push('');
  }

  removePhoneNumber(index: number): void {
    this.entity.phoneNumbers.splice(index, 1);
  }

  addIdentifier(): void {
    this.entity.additionalIdentifiers.push({ type: '', value: '' });
  }

  removeIdentifier(index: number): void {
    this.entity.additionalIdentifiers.splice(index, 1);
  }

  onRemove(): void {
    this.remove.emit();
  }
}