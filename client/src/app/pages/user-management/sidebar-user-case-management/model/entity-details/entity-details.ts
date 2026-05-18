import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdditionalIdentifier, CaseEntity, CaseEntityAttribute, CaseTag, SocialMediaProfile } from '../../../../../shared/model/case-management/case.model';
import { CASE_TAG_OPTIONS, ENTITY_ATTRIBUTE_TYPE_OPTIONS, ENTITY_RELATIONSHIP_OPTIONS, ENTITY_ROLE_OPTIONS, ENTITY_TYPE_OPTIONS, IDENTIFIER_TYPE_OPTIONS, SOCIAL_PLATFORM_OPTIONS, SOURCE_TYPE_OPTIONS } from '../../../../../shared/model/case-management/case-management.defaults';

@Component({
  selector: 'app-entity-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-details.html'
})
export class EntityDetailsComponent {
  entityTypes = ENTITY_TYPE_OPTIONS;
  entityRoles = ENTITY_ROLE_OPTIONS;
  entityRelationships = ENTITY_RELATIONSHIP_OPTIONS;
  sourceTypes = SOURCE_TYPE_OPTIONS;
  socialMediaPlatforms = SOCIAL_PLATFORM_OPTIONS;
  identifierTypes = IDENTIFIER_TYPE_OPTIONS;
  tagOptions = CASE_TAG_OPTIONS;
  attributeTypes = ENTITY_ATTRIBUTE_TYPE_OPTIONS;

  @Input() entity!: CaseEntity;
  @Input() isMainEntity = false;
  @Input() entityIndex = 0;
  @Input() entityValueError = '';
  @Input() showTitle = true;
  @Input() showTopDivider = true;
  @Input() showRoleRelationshipFields = true;

  @Output() remove = new EventEmitter<void>();

  get controlPrefix(): string {
    return `${this.isMainEntity ? 'primary' : 'related'}-${this.entityIndex}`;
  }

  getIdentifierError(identifier: AdditionalIdentifier): string | null {
    if (identifier.type && !identifier.value) {
      return 'Value required';
    }
    if (!identifier.type && identifier.value) {
      return 'Type required';
    }
    if (identifier.type === 'email' && identifier.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.value)) {
      return 'Invalid email format';
    }
    if (identifier.type === 'url' && identifier.value) {
      try {
        new URL(identifier.value);
      }
      catch {
        return 'Invalid URL format';
      }
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
    if (profile.profileUrl) {
      try {
        new URL(profile.profileUrl);
      }
      catch {
        return 'Invalid URL format';
      }
    }
    return null;
  }

  getAttributeError(attribute: CaseEntityAttribute): string | null {
    if (attribute.type && !attribute.value) {
      return 'Value required';
    }
    if (!attribute.type && attribute.value) {
      return 'Type required';
    }
    return null;
  }

  toggleTag(tag: CaseTag): void {
    if (this.entity.tags.includes(tag)) {
      this.entity.tags = this.entity.tags.filter(item => item !== tag);
      return;
    }
    this.entity.tags = [...this.entity.tags, tag];
  }

  isTagSelected(tag: CaseTag): boolean {
    return this.entity.tags.includes(tag);
  }

  addSocialMedia(): void {
    this.entity.socialProfiles.push({ platform: '', username: '', profileUrl: '', displayName: '' });
  }

  removeSocialMedia(index: number): void {
    this.entity.socialProfiles.splice(index, 1);
  }

  addIdentifier(): void {
    this.entity.identifiers.push({ type: '', value: '', issuer: '', verified: false });
  }

  removeIdentifier(index: number): void {
    this.entity.identifiers.splice(index, 1);
  }

  addAttribute(): void {
    this.entity.attributes.push({ type: '', value: '' });
  }

  removeAttribute(index: number): void {
    this.entity.attributes.splice(index, 1);
  }

  onRemove(): void {
    this.remove.emit();
  }
}
