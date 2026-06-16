import { CaseStatus } from './case.model';

export const CASE_STATUS_WORKFLOW: { value: CaseStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'intake_review', label: 'Intake Review' },
  { value: 'under_investigation', label: 'Under Investigation' },
  { value: 'evidence_collection', label: 'Evidence Collection' },
  { value: 'verification', label: 'Verification' },
  { value: 'regulatory_action', label: 'Regulatory Action' },
  { value: 'legal_review', label: 'Legal Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];