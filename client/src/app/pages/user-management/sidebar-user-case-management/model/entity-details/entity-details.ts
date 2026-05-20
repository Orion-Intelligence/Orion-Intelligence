import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdditionalIdentifier, CaseEntity, CaseTag, SocialMediaProfile } from '../../../../../shared/model/case-management/case.model';
import { CASE_TAG_OPTIONS, ENTITY_RELATIONSHIP_OPTIONS, ENTITY_ROLE_OPTIONS, ENTITY_TYPE_OPTIONS, IDENTIFIER_TYPE_OPTIONS, SOCIAL_PLATFORM_OPTIONS, SOURCE_TYPE_OPTIONS } from '../../../../../shared/model/case-management/case-management.defaults';
import { TooltipDirective } from '../../../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-entity-details',
  imports: [CommonModule, FormsModule, TooltipDirective],
  templateUrl: './entity-details.html'
})
export class EntityDetailsComponent implements OnChanges {
  private initialSocialProfileCount = 0;
  private initialIdentifierCount = 0;

  entityTypes = ENTITY_TYPE_OPTIONS;
  entityRoles = ENTITY_ROLE_OPTIONS;
  entityRelationships = ENTITY_RELATIONSHIP_OPTIONS;
  sourceTypes = SOURCE_TYPE_OPTIONS;
  socialMediaPlatforms = SOCIAL_PLATFORM_OPTIONS;
  identifierTypes = IDENTIFIER_TYPE_OPTIONS;
  tagOptions = CASE_TAG_OPTIONS;

  @Input() entity!: CaseEntity;
  @Input() isMainEntity = false;
  @Input() entityIndex = 0;
  @Input() entityValueError = '';
  @Input() showTitle = true;
  @Input() showTopDivider = true;
  @Input() showRoleRelationshipFields = true;

  @Output() remove = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entity'] && this.entity) {
      this.initialSocialProfileCount = this.entity.socialProfiles?.length || 0;
      this.initialIdentifierCount = this.entity.identifiers?.length || 0;
    }
  }

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

  onSave(): void {
    this.save.emit();
  }

  hasSocialProfilesChanged(): boolean {
    return (this.entity.socialProfiles?.length || 0) !== this.initialSocialProfileCount;
  }

  hasIdentifiersChanged(): boolean {
    return (this.entity.identifiers?.length || 0) !== this.initialIdentifierCount;
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

  onRemove(): void {
    this.remove.emit();
  }
}
