export const CASE_MOVE_STATUS_IDS: Record<string, string> = {
  'Intake Review': 'intake_review',
  'Under Investigation': 'under_investigation',
  'Move back to Intake Review': 'intake_review',
  'Evidence Collection': 'evidence_collection',
  'Verification': 'verification',
  'Regulatory Action': 'regulatory_action',
  'Legal Review': 'legal_review',
  'Resolved': 'resolved'
};

export let caseId = '';
export let linkedCaseId = '';

export const selector = (testId: string) => `[data-testid="${testId}"]`;

export function clickHeaderAction(testId: string) {
  cy.scrollTo('top', { ensureScrollable: false });
  cy.get(selector(testId)).last().scrollIntoView().should('exist').click({ force: true });
}

export function assertNotification(message: string) {
  cy.contains(message, { timeout: 60000 }).should('exist');
}

export function createCase(title: string, description: string, entityValue: string, assignId: (id: string) => void) {
  let createdCaseId = '';
  cy.get(selector('add-case-button')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
  cy.get(selector('case-add-drawer')).filter(':visible').first().should('be.visible');
  cy.get(selector('case-add-id-input'))
    .should(($input) => expect(String($input.val() || '')).not.to.equal(''))
    .invoke('val')
    .then((value) => {
      createdCaseId = String(value || '');
      assignId(createdCaseId);
    });
  cy.get(selector('case-add-title-input')).should('be.visible').type(title);
  cy.get(selector('case-add-description-input')).should('be.visible').type(description);
  cy.get(selector('case-add-type-select')).should('be.visible').select('fraud');
  cy.get(selector('case-add-intake-source-select')).should('be.visible').select('soc_alert');
  cy.get(selector('case-add-severity-select')).should('be.visible').select('high');
  cy.get(selector('case-add-priority-select')).should('be.visible').select('high');
  cy.get(selector('case-primary-entity-value-input')).scrollIntoView().should('be.visible').type(entityValue);
  cy.get(selector('case-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

  assertNotification('Case added successfully');
  cy.then(() => {
    cy.get(selector(`case-row-${createdCaseId}`)).should('be.visible');
  });
}

export function openCaseManagement() {
  cy.visit('/dashboard/profile/case-management');
  cy.get(selector('case-management-page')).should('be.visible');
}

export function addCase() {
  createCase('Cypress Case Title', 'Cypress investigation context', 'Cypress Entity', (createdCaseId) => {
    caseId = createdCaseId;
  });
}

export function addLinkTargetCase() {
  createCase('Cypress Link Target Case', 'Cypress linked case context', 'Cypress Link Target Entity', (createdCaseId) => {
    linkedCaseId = createdCaseId;
  });
}

export function openCreatedCaseFromList() {
  cy.window().then((win) => {
    cy.stub(win, 'open').as('caseDetailsWindowOpen');
  });

  cy.then(() => {
    cy.get(selector(`case-view-${caseId}`)).should('be.visible').click();
    cy.get('@caseDetailsWindowOpen').should('have.been.calledWithMatch', new RegExp(`case-management/case-details\\?caseId=${caseId}`), '_blank');

    cy.visit(`/dashboard/profile/case-management/case-details?caseId=${caseId}`);
  });
  cy.get(selector('case-details-page')).should('be.visible');
}

export function openCreatedCaseDetails() {
  cy.then(() => {
    cy.visit(`/dashboard/profile/case-management/case-details?caseId=${caseId}`);
  });
  cy.get(selector('case-details-page')).should('be.visible');
}
