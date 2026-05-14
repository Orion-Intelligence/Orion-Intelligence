import {
  addCase,
  assertCreatedCaseDetails,
  editCreatedCase,
  openCaseManagement,
  openCreatedCaseFromList
} from './controllers/20-case-management.controller';

describe('Case Management - Add View Edit Flow', () => {
  after(() => {
    cy.logout();
  });

  it('adds a case, opens the detail view, and edits it', () => {
    cy.loginAsAdmin();

    openCaseManagement();
    addCase();
    openCreatedCaseFromList();
    assertCreatedCaseDetails();
    editCreatedCase();
  });
});
