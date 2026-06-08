import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Case, CaseAnalyst, CaseClosure } from '../../../../../../shared/model/case-management/case.model';
import { CLOSURE_REASON_OPTIONS } from '../../../../../../shared/model/case-management/case-management.defaults';
import { TooltipDirective } from '../../../../../../shared/directive/tooltip-directive.directive';
import { caseInlineMotion, caseModeSwapMotion } from '../case-details.animations';
import { getCaseAnalystLabel, getCaseDisplayLabel, getFormattedCaseDateTime } from '../case-details-formatters';
import { CaseDetailsStore } from '../case-details.store';
import { CaseEditDrawerComponent } from '../case-edit-drawer/case-edit-drawer';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-case-closure-section',
  imports: [CommonModule, FormsModule, TooltipDirective, CaseEditDrawerComponent, TranslatePipe],
  animations: [caseInlineMotion, caseModeSwapMotion],
  host: { class: 'block' },
  templateUrl: './case-closure-section.html'
})
export class CaseClosureSectionComponent {
  readonly store = inject(CaseDetailsStore);
  closureReasonOptions = CLOSURE_REASON_OPTIONS;

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get isEditing(): boolean {
    return this.store.isEditing;
  }

  get isClosingCase(): boolean {
    return this.store.isClosingCase;
  }

  get newClosure(): CaseClosure | null {
    return this.store.newClosure;
  }

  get analysts(): CaseAnalyst[] {
    return this.store.analysts;
  }

  getDisplayLabel(value?: string | null, otherValue?: string | null): string {
    return getCaseDisplayLabel(value, otherValue);
  }

  getAnalystLabel(userId?: string): string {
    return getCaseAnalystLabel(this.analysts, userId);
  }

  getFormattedDateTime(date?: Date | string | null): string {
    return getFormattedCaseDateTime(date);
  }
}
