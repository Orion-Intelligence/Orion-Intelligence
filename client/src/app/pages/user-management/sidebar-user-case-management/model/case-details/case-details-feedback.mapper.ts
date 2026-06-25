import { ReportFeedbackModel } from '../../../../../sections/report/templates/report_general/models/report-feedback.model';
import { Case } from '../../../../../shared/model/case-management/case.model';

export function buildCaseCommentsFeedback(caseData: Case | null, getAnalystLabel: (userId?: string) => string): ReportFeedbackModel {
  const comments = (caseData?.comments || []).map(comment => ({
    user_id: comment.createdBy || '',
    username: getAnalystLabel(comment.createdBy),
    comment: comment.body,
    created_at: String(comment.createdAt || ''),
    updated_at: String(comment.updatedAt || comment.createdAt || '')
  }));
  return new ReportFeedbackModel({
    doc_id: caseData?.caseId || '',
    comments
  });
}
