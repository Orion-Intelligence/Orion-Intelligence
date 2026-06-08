import {
  addAndEditArtifactAndTask,
  addAndEditLinkedCase,
  addAndEditRelatedEntity,
  addCase,
  addCommentToCreatedCase,
  addLinkTargetCase,
  archiveClosedCaseAndShowArchived,
  assertCreatedCaseDetails,
  closeCreatedCase,
  editCreatedCase,
  exportCreatedCasePdf,
  openCaseManagement,
  openCreatedCaseFromList,
  shareAndRevokeCreatedCaseLink
} from './controllers/20-case-management.controller';

describe('Case Management - Add View Edit Flow', () => {
  after(() => {
    cy.logout();
  });

  it('adds a case, opens the detail view, and edits it', () => {
    cy.loginAsAdmin();

    openCaseManagement();
    addCase();
    addLinkTargetCase();
    openCreatedCaseFromList();
    assertCreatedCaseDetails();
    editCreatedCase();
    addAndEditRelatedEntity();
    addAndEditArtifactAndTask();
    addAndEditLinkedCase();
    addCommentToCreatedCase();
    exportCreatedCasePdf();
    shareAndRevokeCreatedCaseLink();
    closeCreatedCase();
    archiveClosedCaseAndShowArchived();
  });
});
