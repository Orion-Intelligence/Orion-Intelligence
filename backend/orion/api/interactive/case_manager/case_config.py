from orion.services.mongo_manager.shared_model.db_case_model import CaseStatus


CASE_STATUS_FLOW = [
    CaseStatus.NEW,
    CaseStatus.INTAKE_REVIEW,
    CaseStatus.UNDER_INVESTIGATION,
    CaseStatus.EVIDENCE_COLLECTION,
    CaseStatus.VERIFICATION,
    CaseStatus.REGULATORY_ACTION,
    CaseStatus.LEGAL_REVIEW,
    CaseStatus.RESOLVED,
    CaseStatus.CLOSED,
]