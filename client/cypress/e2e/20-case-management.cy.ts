import {
  addAndEditArtifactAndTask,
  addAndEditLinkedCase,
  addAndEditRelatedEntity,
  addCase,
  addCommentToCreatedCase,
  addLinkTargetCase,
  archiveClosedCaseAndShowArchived,
  assertCaseClosureDisabledBeforeResolved,
  assertCreatedCaseDetails,
  closeCreatedCase,
  editCreatedCase,
  exportCreatedCasePdf,
  moveCaseFromNewToResolved,
  openCaseManagement,
  openCreatedCaseFromList,
  shareAndRevokeCreatedCaseLink
} from './controllers/20-case-management.controller';

describe('Case Management - Add View Edit Flow', () => {
  after(() => {
    cy.logout();
  });

  it('creates, edits, tracks, resolves, closes, and archives a case', () => {
    cy.loginAsAdmin();

    openCaseManagement();
    addCase();
    addLinkTargetCase();
    openCreatedCaseFromList();
    assertCreatedCaseDetails();
    assertCaseClosureDisabledBeforeResolved();
    editCreatedCase();
    addAndEditRelatedEntity();
    addAndEditArtifactAndTask();
    addAndEditLinkedCase();
    addCommentToCreatedCase();
    exportCreatedCasePdf();
    shareAndRevokeCreatedCaseLink();
    moveCaseFromNewToResolved();
    closeCreatedCase();
    archiveClosedCaseAndShowArchived();
  });
});