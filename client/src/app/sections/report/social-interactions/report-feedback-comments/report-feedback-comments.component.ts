import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportFeedbackModel } from '../../templates/report_general/models/report-feedback.model';

@Component({
  selector: 'app-report-feedback-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-feedback-comments.component.html',
})
export class ReportFeedbackCommentsComponent implements OnChanges {
  draft = '';

  @Input() docId = '';
  @Input() feedback: ReportFeedbackModel = new ReportFeedbackModel();
  @Input() isSaving = false;
  @Input() errorMessage = '';

  @Output() saveComment = new EventEmitter<string>();
  @Output() userSelected = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['docId']) {
      this.draft = '';
    }
  }

  submitComment(): void {
    const text = this.draft.trim();
    if (!this.docId || !text) {
      return;
    }
    this.saveComment.emit(text);
    this.draft = '';
  }

  openUser(userId: string): void {
    if (!userId) {
      return;
    }
    this.userSelected.emit(userId);
  }
}
