let caseId = '';

const selector = (testId: string) => `[data-testid="${testId}"]`;

export function openCaseManagement() {
  cy.visit('/dashboard/profile/case-management');
  cy.get(selector('case-management-page')).should('be.visible');
}

export function addCase() {
  cy.get(selector('add-case-button')).should('be.visible').click();
  cy.get(selector('case-add-drawer')).should('be.visible');
  cy.wait(2000);
  cy.get(selector('case-add-id-input')).invoke('val').then((value) => {
    caseId = String(value || '');
    expect(caseId).to.not.equal('');
  });
  cy.get(selector('case-add-owner-input')).should('be.visible').type('Cypress Officer');
  cy.get(selector('case-add-intake-source-input')).should('be.visible').type('Cypress API Alert');
  cy.get(selector('case-add-type-select')).should('be.visible').select('Fraud');
  cy.get(selector('case-add-priority-select')).should('be.visible').select('high');
  cy.get(selector('case-add-status-select')).should('be.visible').select('open');
  cy.get(selector('case-primary-entity-name-input')).scrollIntoView().should('be.visible').type('Cypress Entity');
  cy.get(selector('case-add-save')).should('be.visible').click();

  cy.get(selector('message-notification-text')).should('contain.text', 'Case added successfully');
  cy.then(() => {
    cy.get(selector(`case-row-${caseId}`)).should('be.visible');
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

export function assertCreatedCaseDetails() {
  cy.get(selector('case-details-case-id-value')).should('contain.text', caseId);
  cy.get(selector('case-details-owner-value')).should('contain.text', 'Cypress Officer');
  cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Cypress API Alert');
  cy.get(selector('case-details-entity-name-value')).should('contain.text', 'Cypress Entity');
}

export function editCreatedCase() {
  cy.get(selector('case-details-edit')).should('be.visible').click();
  cy.get(selector('case-details-owner-input')).should('be.visible').clear().type('Cypress Updated Officer');
  cy.get(selector('case-details-intake-source-input')).should('be.visible').clear().type('Cypress Updated Intake');
  cy.get(selector('case-details-status-select')).should('be.visible').select('in-progress');
  cy.get(selector('case-details-priority-select')).should('be.visible').select('critical');
  cy.get(selector('case-details-entity-name-input')).scrollIntoView().should('be.visible').clear().type('Cypress Updated Entity');
  cy.get(selector('case-details-save')).should('be.visible').click();

  cy.get(selector('message-notification-text')).should('contain.text', 'Case updated successfully');
  cy.get(selector('case-details-owner-value')).should('contain.text', 'Cypress Updated Officer');
  cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Cypress Updated Intake');
  cy.get(selector('case-details-status-value')).should('contain.text', 'in-progress');
  cy.get(selector('case-details-priority-value')).should('contain.text', 'critical');
  cy.get(selector('case-details-entity-name-value')).should('contain.text', 'Cypress Updated Entity');
}
