import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { EntityDetailsComponent } from '../../entity-details/entity-details';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { Case, CaseEntity } from '../../case.model';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { caseModeSwapMotion, caseSectionMotion } from '../case-details.animations';
import { formatCaseConfidence, formatCaseLabel, getCaseDisplayLabel, getFormattedCaseDateTime, getPrimaryCaseEntity } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';
import { CaseEditDrawerComponent } from '../case-edit-drawer/case-edit-drawer';

@Component({
  selector: 'app-case-primary-entity-section',
  imports: [CommonModule, EntityDetailsComponent, TooltipDirective, CaseEditDrawerComponent, TranslatePipe],
  animations: [caseModeSwapMotion, caseSectionMotion],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './case-primary-entity-section.html'
})
export class CasePrimaryEntitySectionComponent {
  readonly store = inject(CaseDetailsStore);

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get activeEditSection() {
    return this.store.activeEditSection;
  }

  get editablePrimaryEntity(): CaseEntity | null {
    return this.store.editablePrimaryEntity;
  }

  getPrimaryEntity(caseItem: Case | null = this.caseData): CaseEntity | null {
    return getPrimaryCaseEntity(caseItem);
  }

  canManageCases(): boolean {
    return this.store.canManageCases();
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    return getCaseDisplayLabel(value, otherValue);
  }

  getFormattedDateTime(date?: Date | string | null): string {
    return getFormattedCaseDateTime(date);
  }

  formatLabel(value?: string | null): string {
    return formatCaseLabel(value);
  }

  formatConfidence(value?: string | null): string {
    return formatCaseConfidence(value);
  }
}
