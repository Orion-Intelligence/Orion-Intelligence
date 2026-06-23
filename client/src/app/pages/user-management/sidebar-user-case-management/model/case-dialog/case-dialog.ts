import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { Case, CaseAnalyst } from '../../../../../shared/model/case-management/case.model';

@Component({
  selector: 'app-case-dialog',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './case-dialog.html',
})
export class CaseDialog implements OnChanges {
  selectedAnalystId = '';

  @Input() caseItem: Case | null = null;
  @Input() analysts: CaseAnalyst[] = [];
  @Input() isLoading = false;
  @Input() isSaving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caseItem'] && this.caseItem) {
      this.selectedAnalystId = this.caseItem.assignedAnalystIds?.[0] || '';
    }
  }

  confirmAssignAnalyst(): void {
    if (!this.selectedAnalystId) {
      return;
    }

    this.saved.emit(this.selectedAnalystId);
  }
}
