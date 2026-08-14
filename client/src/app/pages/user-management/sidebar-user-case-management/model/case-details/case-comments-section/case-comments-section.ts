import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ReportFeedbackCommentsComponent } from '../../../../../../shared/partials/report-interactions/report-feedback-comments/report-feedback-comments.component';
import { ReportUserSidebarComponent } from '../../../../../../shared/partials/report-interactions/report-user-sidebar/report-user-sidebar.component';
import { ReportFeedbackModel } from '../../../../../../shared/partials/report-interactions/models/report-feedback.model';
import { Case } from '../../case.model';
import { CaseDetailsStore } from '../case-details.store';

@Component({
  selector: 'app-case-comments-section',
  imports: [CommonModule, ReportFeedbackCommentsComponent, ReportUserSidebarComponent],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './case-comments-section.html'
})
export class CaseCommentsSectionComponent {
  @ViewChild(ReportUserSidebarComponent) private userSidebar?: ReportUserSidebarComponent;

  readonly store = inject(CaseDetailsStore);

  get caseData(): Case {
    return this.store.caseData as Case;
  }

  get isEditing(): boolean {
    return this.store.isEditing;
  }

  get isCommentSaving(): boolean {
    return this.store.isCommentSaving;
  }

  get commentErrorMessage(): string {
    return this.store.commentErrorMessage;
  }

  getCaseCommentsFeedback(): ReportFeedbackModel {
    return this.store.getCaseCommentsFeedback();
  }

  saveCaseComment(body: string): void {
    this.store.saveCaseComment(body);
  }

  openUserSidebar(userId: string): void {
    this.userSidebar?.open(userId);
  }
}
