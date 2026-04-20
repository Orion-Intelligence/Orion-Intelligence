import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportFeedbackModel } from '../../templates/report_general/models/report-feedback.model';

type FeedbackKey = 'recommended_count' | 'trust_count' | 'untrust_count';
type FeedbackAction = 'recommended' | 'trust' | 'untrust';

@Component({
  selector: 'app-report-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-feedback.component.html',
})
export class ReportFeedbackComponent {
  @Input() docId = '';
  @Input() feedback: ReportFeedbackModel = new ReportFeedbackModel();
  @Input() savingKey: FeedbackKey | '' = '';

  @Output() feedbackAction = new EventEmitter<FeedbackAction>();

  increment(action: FeedbackAction, _key: FeedbackKey): void {
    if (!this.docId || this.savingKey) {
      return;
    }
    this.feedbackAction.emit(action);
  }

  isSelected(action: FeedbackAction): boolean {
    if (action === 'recommended') {
      return !!this.feedback.current_user_reaction?.recommended;
    }
    return this.feedback.current_user_reaction?.trust_state === action;
  }
}
