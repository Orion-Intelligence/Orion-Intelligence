import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelatedEntity, SocialMediaProfile, AdditionalIdentifier } from '../../../../../../../shared/model/case-management/case.model';

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

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    }
    catch {
      return false;
    }
  }

  isSocialMediaValid(profile: SocialMediaProfile): boolean {
    if (profile.platform && !profile.username) {
      return false;
    }
    if (!profile.platform && profile.username) {
      return false;
    }
    return true;
  }

  isIdentifierValid(identifier: AdditionalIdentifier): boolean {
    if (identifier.type && !identifier.value) {
      return false;
    }
    if (!identifier.type && identifier.value) {
      return false;
    }
    return true;
  }

  getEmailError(email: string): string | null {
    if (!email.trim()) {
      return null;
    }
    if (!this.validateEmail(email)) {
      return 'Invalid email format';
    }
    return null;
  }

  getPhoneError(phone: string): string | null {
    if (!phone.trim()) {
      return null;
    }
    if (!this.validatePhoneNumber(phone)) {
      return 'Invalid phone format';
    }
    return null;
  }

  getUrlError(url: string): string | null {
    if (!url.trim()) {
      return null;
    }
    if (!this.validateUrl(url)) {
      return 'Invalid URL format';
    }
    return null;
  }

  getSocialMediaError(profile: SocialMediaProfile): string | null {
    if (profile.platform && !profile.username) {
      return 'Username required';
    }
    if (!profile.platform && profile.username) {
      return 'Platform required';
    }
    return null;
  }

  getIdentifierError(identifier: AdditionalIdentifier): string | null {
    if (identifier.type && !identifier.value) {
      return 'Value required';
    }
    if (!identifier.type && identifier.value) {
      return 'Type required';
    }
    return null;
  }

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