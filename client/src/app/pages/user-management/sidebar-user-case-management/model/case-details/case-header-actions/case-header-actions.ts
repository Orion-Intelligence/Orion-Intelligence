import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { Case } from '../../../../../../shared/model/case-management/case.model';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { caseInlineMotion } from '../case-details.animations';
import { getCaseDisplayLabel } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';

@Component({
  selector: 'app-case-header-actions',
  imports: [CommonModule, TooltipDirective, TranslatePipe],
  animations: [caseInlineMotion],
  host: { class: 'contents' },
  templateUrl: './case-header-actions.html'
})
export class CaseHeaderActionsComponent {
  readonly store = inject(CaseDetailsStore);

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get isEditing(): boolean {
    return this.store.isEditing;
  }

  get isArchivingCase(): boolean {
    return this.store.isArchivingCase;
  }

  get isPdfExporting(): boolean {
    return this.store.isPdfExporting;
  }

  get isShareCreating(): boolean {
    return this.store.isShareCreating;
  }

  get isShareRevoking(): boolean {
    return this.store.isShareRevoking;
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    return getCaseDisplayLabel(value, otherValue);
  }

  canManageCases(): boolean {
    return this.store.canManageCases();
  }

  canUnarchiveCases(): boolean {
    return this.store.canUnarchiveCases();
  }
}
