import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Case, CaseArtifact } from '../../../../../../shared/model/case-management/case.model';
import { ARTIFACT_TYPE_OPTIONS, SOURCE_TYPE_OPTIONS } from '../../../../../../shared/model/case-management/case-management.defaults';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { caseInlineMotion, caseListItemMotion, caseModeSwapMotion, caseSectionMotion } from '../case-details.animations';
import { CaseDateField, CaseDateTarget, formatCaseLabel, getCaseDateInputValue, getCaseDisplayLabel, getFormattedCaseDateTime, setCaseDateInputValue } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';

@Component({
  selector: 'app-case-artifacts-section',
  imports: [CommonModule, FormsModule, TooltipDirective],
  animations: [caseInlineMotion, caseListItemMotion, caseModeSwapMotion, caseSectionMotion],
  host: { class: 'block' },
  templateUrl: './case-artifacts-section.html'
})
export class CaseArtifactsSectionComponent {
  readonly store = inject(CaseDetailsStore);
  artifactTypeOptions = ARTIFACT_TYPE_OPTIONS;
  sourceTypeOptions = SOURCE_TYPE_OPTIONS;

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get editedCase(): Case | null {
    return this.store.editedCase;
  }

  get isEditing(): boolean {
    return this.store.activeEditSection === 'artifacts';
  }

  get isAddingArtifact(): boolean {
    return this.store.isAddingArtifact;
  }

  get newArtifact(): CaseArtifact | null {
    return this.store.newArtifact;
  }

  get pendingNewArtifactFileName(): string {
    return this.store.getPendingNewArtifactFileName();
  }

  hasArtifactsChanged(): boolean {
    return (this.editedCase?.artifacts?.length || 0) !== (this.caseData?.artifacts?.length || 0);
  }

  getArtifactAccept(artifact: CaseArtifact): string {
    if (artifact.type === 'screenshot') {
      return '.png,image/png';
    }

    if (artifact.type === 'file') {
      return '.pdf,.jpg,.jpeg,.png,.txt,.docx';
    }

    return '';
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    return getCaseDisplayLabel(value, otherValue);
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
