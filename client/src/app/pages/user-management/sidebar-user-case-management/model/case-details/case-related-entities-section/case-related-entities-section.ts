import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Case, CaseEntity } from '../../../../../../shared/model/case-management/case.model';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { EntityDetailsComponent } from '../../entity-details/entity-details';
import { caseListItemMotion, caseModeSwapMotion, caseSectionMotion } from '../case-details.animations';
import { formatCaseConfidence, formatCaseLabel, getCaseDisplayLabel, getFormattedCaseDateTime, getLinkableCaseEntities, getLinkedCaseEntityDisplayLabel, getRelatedCaseEntities } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';

@Component({
  selector: 'app-case-related-entities-section',
  imports: [CommonModule, EntityDetailsComponent, TooltipDirective],
  animations: [caseListItemMotion, caseModeSwapMotion, caseSectionMotion],
  host: { class: 'block' },
  templateUrl: './case-related-entities-section.html'
})
export class CaseRelatedEntitiesSectionComponent {
  private expandedRelatedEntityIds = new Set<string>();

  readonly store = inject(CaseDetailsStore);

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get editedCase(): Case | null {
    return this.store.editedCase;
  }

  get isEditing(): boolean {
    return this.store.activeEditSection === 'relatedEntities';
  }

  get isAddingRelatedEntity(): boolean {
    return this.store.isAddingRelatedEntity;
  }

  get newRelatedEntity(): CaseEntity | null {
    return this.store.newRelatedEntity;
  }

  getRelatedEntities(caseItem: Case | null = this.caseData): CaseEntity[] {
    return getRelatedCaseEntities(caseItem);
  }

  getLinkableEntities(currentEntityId?: string, caseItem: Case | null = this.editedCase || this.caseData): CaseEntity[] {
    return getLinkableCaseEntities(caseItem, currentEntityId);
  }

  getLinkedEntityDisplayLabel(entityId?: string, caseItem: Case | null = this.caseData || this.editedCase): string {
    return getLinkedCaseEntityDisplayLabel(caseItem, entityId);
  }

  toggleRelatedEntity(entityId: string): void {
    if (this.expandedRelatedEntityIds.has(entityId)) {
      this.expandedRelatedEntityIds.delete(entityId);
      return;
    }
    this.expandedRelatedEntityIds.add(entityId);
  }

  isRelatedEntityExpanded(entityId: string): boolean {
    return this.expandedRelatedEntityIds.has(entityId);
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    return getCaseDisplayLabel(value, otherValue);
  }

  formatLabel(value?: string | null): string {
    return formatCaseLabel(value);
  }

  formatConfidence(value?: string | null): string {
    return formatCaseConfidence(value);
  }

  getFormattedDateTime(date?: Date | string | null): string {
    return getFormattedCaseDateTime(date);
  }
}
