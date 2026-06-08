let caseId = '';
let linkedCaseId = '';

const selector = (testId: string) => `[data-testid="${testId}"]`;

function visible(testId: string) {
  return cy.get(selector(testId)).filter(':visible').first();
}

function clickVisible(testId: string) {
  visible(testId).scrollIntoView().should('be.visible').click({ force: true });
}

function clickHeaderAction(testId: string) {
  cy.scrollTo('top', { ensureScrollable: false });
  cy.get(selector(testId)).last().scrollIntoView().should('exist').click({ force: true });
}

function assertNotification(message: string) {
  cy.get(selector('message-notification-text')).should('contain.text', message);
}

function createCase(title: string, description: string, entityValue: string, assignId: (id: string) => void) {
  let createdCaseId = '';
  clickVisible('add-case-button');
  visible('case-add-drawer').should('be.visible');
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
  cy.get(selector('case-add-status-select')).should('be.visible').select('investigating');
  cy.get(selector('case-add-severity-select')).should('be.visible').select('high');
  cy.get(selector('case-add-priority-select')).should('be.visible').select('high');
  cy.get(selector('case-primary-entity-value-input')).scrollIntoView().should('be.visible').type(entityValue);
  clickVisible('case-add-save');

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

export function assertCreatedCaseDetails() {
  cy.get(selector('case-details-case-id-value')).should('contain.text', caseId);
  cy.get(selector('case-details-title-value')).should('contain.text', 'Cypress Case Title');
  cy.get(selector('case-details-description-value')).should('contain.text', 'Cypress investigation context');
  cy.get(selector('case-details-type-value')).should('contain.text', 'Fraud');
  cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Soc Alert');
  cy.get(selector('case-details-status-value')).should('contain.text', 'Investigating');
  cy.get(selector('case-details-severity-value')).should('contain.text', 'high');
  cy.get(selector('case-details-priority-value')).should('contain.text', 'high');
  cy.get(selector('case-primary-entity-value')).should('contain.text', 'Cypress Entity');
}

export function editCreatedCase() {
  clickVisible('case-details-edit');
  visible('case-details-edit-drawer').should('be.visible');
  cy.get(selector('case-details-title-input')).should('be.visible').clear().type('Cypress Updated Case Title');
  cy.get(selector('case-details-description-input')).should('be.visible').clear().type('Cypress updated investigation context');
  cy.get(selector('case-details-intake-source-select')).scrollIntoView().should('be.visible').select('email_report');
  cy.get(selector('case-details-status-select')).scrollIntoView().should('be.visible').select('review');
  cy.get(selector('case-details-severity-select')).scrollIntoView().should('be.visible').select('critical');
  cy.get(selector('case-details-priority-select')).scrollIntoView().should('be.visible').select('critical');
  clickVisible('case-details-save');

  assertNotification('Case details updated successfully');
  cy.get(selector('case-details-title-value')).should('contain.text', 'Cypress Updated Case Title');
  cy.get(selector('case-details-description-value')).should('contain.text', 'Cypress updated investigation context');
  cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Email Report');
  cy.get(selector('case-details-status-value')).should('contain.text', 'Review');
  cy.get(selector('case-details-severity-value')).should('contain.text', 'critical');
  cy.get(selector('case-details-priority-value')).should('contain.text', 'critical');

  clickVisible('case-primary-entity-edit');
  visible('case-primary-entity-edit-drawer').should('be.visible');
  cy.get(selector('case-primary-entity-value-input')).scrollIntoView().should('be.visible').clear().type('Cypress Updated Entity');
  clickVisible('case-primary-entity-save');

  assertNotification('Primary entity updated successfully');
  cy.get(selector('case-primary-entity-value')).should('contain.text', 'Cypress Updated Entity');
}

export function addAndEditRelatedEntity() {
  clickVisible('case-related-entity-add');
  visible('case-related-entity-add-drawer').should('be.visible');
  cy.get(selector('case-related-entity-value-input-0')).scrollIntoView().should('be.visible').type('Cypress Related Domain');
  clickVisible('case-related-entity-add-save');

  assertNotification('Related entity added successfully');
  cy.get(selector('case-related-entity-card-0')).scrollIntoView().should('be.visible');
  cy.get(selector('case-related-entity-value-0')).should('contain.text', 'Cypress Related Domain');

  clickVisible('case-related-entity-edit-0');
  visible('case-related-entity-edit-drawer').should('be.visible');
  cy.get(selector('case-related-entity-value-input-0')).scrollIntoView().should('be.visible').clear().type('Cypress Updated Related Domain');
  clickVisible('case-related-entity-save');

  assertNotification('Related entities updated successfully');
  cy.get(selector('case-related-entity-value-0')).should('contain.text', 'Cypress Updated Related Domain');
}

export function addAndEditArtifactAndTask() {
  clickVisible('case-artifact-add');
  visible('case-artifact-add-drawer').should('be.visible');
  cy.get(selector('case-artifact-title-input')).should('be.visible').type('Cypress Evidence Artifact');
  cy.get(selector('case-artifact-type-select')).should('be.visible').select('file');
  cy.get(selector('case-artifact-source-select')).should('be.visible').select('manual');
  cy.get(selector('case-artifact-captured-input')).should('be.visible').type('2026-05-25');
  cy.get(selector('case-artifact-description-input')).should('be.visible').type('Artifact added by Cypress');
  cy.get(selector('case-artifact-file-input')).selectFile('cypress/fixtures/resume-sample.pdf', { force: true });
  clickVisible('case-artifact-add-save');

  assertNotification('Artifact added successfully');
  cy.get(selector('case-artifact-card-0')).scrollIntoView().should('be.visible');
  cy.get(selector('case-artifact-title-value-0')).should('contain.text', 'Cypress Evidence Artifact');
  cy.get(selector('case-artifact-file-view-0')).should('be.visible');
  cy.get(selector('case-artifact-file-download-0')).should('be.visible');
  cy.get(selector('case-artifact-file-delete-0')).should('be.visible');

  clickVisible('case-artifact-edit-0');
  visible('case-artifact-edit-drawer').within(() => {
    cy.get(selector('case-artifact-file-view-0')).should('not.exist');
    cy.get(selector('case-artifact-file-download-0')).should('not.exist');
    cy.get(selector('case-artifact-file-delete-0')).should('not.exist');
  });
  cy.get(selector('case-artifact-title-input')).should('be.visible').clear().type('Cypress Updated Evidence Artifact');
  clickVisible('case-artifact-save');

  assertNotification('Artifacts updated successfully');
  cy.get(selector('case-artifact-title-value-0')).should('contain.text', 'Cypress Updated Evidence Artifact');

  cy.window().then((win) => {
    cy.stub(win, 'open').as('artifactWindowOpen');
  });
  clickVisible('case-artifact-file-view-0');
  cy.get('@artifactWindowOpen').should('have.been.called');
  cy.get('@artifactWindowOpen').then((openStub) => {
    (openStub as unknown as { restore: () => void }).restore();
  });
  clickVisible('case-artifact-file-download-0');
  clickVisible('case-artifact-file-delete-0');
  assertNotification('File deleted successfully');
  cy.get(selector('case-artifact-file-view-0')).should('not.exist');

  clickVisible('case-task-add');
  visible('case-task-add-drawer').should('be.visible');
  cy.get(selector('case-task-title-input')).should('be.visible').type('Cypress Review Task');
  cy.get(selector('case-task-status-select')).should('be.visible').select('in_progress');
  cy.get(selector('case-task-priority-select')).should('be.visible').select('high');
  cy.get(selector('case-task-due-input')).should('be.visible').type('2026-05-26');
  cy.get(selector('case-task-description-input')).should('be.visible').type('Task added by Cypress');
  clickVisible('case-task-add-save');

  cy.get(selector('case-task-add-drawer')).should('not.exist');
  cy.get(selector('case-task-card-0')).scrollIntoView().should('be.visible');
  cy.get(selector('case-task-title-value-0')).should('contain.text', 'Cypress Review Task');

  clickVisible('case-task-edit-0');
  visible('case-task-edit-drawer').should('be.visible');
  cy.get(selector('case-task-title-input')).should('be.visible').clear().type('Cypress Updated Review Task');
  cy.get(selector('case-task-status-select')).should('be.visible').select('done');
  clickVisible('case-task-save');

  cy.get(selector('case-task-edit-drawer')).should('not.exist');
  cy.get(selector('case-task-title-value-0')).should('contain.text', 'Cypress Updated Review Task');
  cy.get(selector('case-task-card-0')).should('contain.text', 'Done');
}

export function addAndEditLinkedCase() {
  clickVisible('case-linked-case-add');
  visible('case-linked-case-add-drawer').should('be.visible');
  cy.then(() => {
    cy.get(selector('case-linked-case-select')).should('be.visible').select(linkedCaseId);
  });
  cy.get(selector('case-linked-case-relationship-select')).should('be.visible').select('related');
  cy.get(selector('case-linked-case-reason-input')).should('be.visible').type('Linked by Cypress');
  clickVisible('case-linked-case-add-save');

  assertNotification('Linked case added successfully');
  cy.get(selector('case-linked-case-card-0')).scrollIntoView().should('be.visible');
  cy.get(selector('case-linked-case-target-value-0')).should('contain.text', linkedCaseId);

  clickVisible('case-linked-case-edit-0');
  visible('case-linked-case-edit-drawer').should('be.visible');
  cy.get(selector('case-linked-case-relationship-select')).should('be.visible').select('same_actor');
  cy.get(selector('case-linked-case-reason-input')).should('be.visible').clear().type('Updated linked case reason');
  clickVisible('case-linked-case-save');

  assertNotification('Linked cases updated successfully');
  cy.get(selector('case-linked-case-card-0')).should('contain.text', 'Same Actor');
  cy.get(selector('case-linked-case-card-0')).should('contain.text', 'Updated linked case reason');
}

export function exportCreatedCasePdf() {
  clickHeaderAction('case-details-export-pdf');
  cy.then(() => {
    cy.readFile(`cypress/downloads/${caseId}-case-report.pdf`, null, { timeout: 30000 })
      .should((contents) => {
        expect(contents.length).to.be.greaterThan(1000);
      });
  });
}

export function addCommentToCreatedCase() {
  cy.get(selector('report-feedback-comment-input')).scrollIntoView().should('be.visible').type('Cypress analyst note');
  cy.get(selector('report-feedback-comment-save')).should('be.visible').click();
  cy.contains('p', 'Cypress analyst note').should('be.visible');
  cy.get(selector('report-feedback-comment-user-name')).should('exist');
}

export function shareAndRevokeCreatedCaseLink() {
  cy.window().then((win) => {
    cy.stub(win, 'open').as('caseShareWindowOpen');
  });

  clickHeaderAction('case-details-share');
  cy.get(selector('confirmation-popup')).should('be.visible').and('contain.text', 'anyone with the link');
  cy.get(selector('confirmation-yes-button')).should('be.visible').click();
  cy.get('@caseShareWindowOpen').should('have.been.calledWithMatch', /\/case-share\/.+token=/, '_blank');

  clickHeaderAction('case-details-revoke-shares');
  cy.get(selector('confirmation-popup')).should('be.visible').and('contain.text', 'expire all previously shared links');
  cy.get(selector('confirmation-yes-button')).should('be.visible').click();
  assertNotification('share links revoked');
}

export function closeCreatedCase() {
  clickVisible('case-closure-add');
  visible('case-closure-drawer').should('be.visible');
  cy.get(selector('case-closure-reason-select')).should('be.visible').select('true_positive');
  cy.get(selector('case-closure-summary-input')).should('be.visible').type('Cypress closure summary');
  cy.get(selector('case-closure-resolution-input')).should('be.visible').type('Cypress resolution notes');
  clickVisible('case-closure-save');

  assertNotification('Case closed successfully');
  cy.get(selector('case-closure-reason-value')).should('contain.text', 'True Positive');
  cy.get(selector('case-closure-summary-value')).should('contain.text', 'Cypress closure summary');
  cy.get(selector('case-closure-resolution-value')).should('contain.text', 'Cypress resolution notes');
  cy.get(selector('case-closure-closed-by-value')).should('not.be.empty');
  cy.get(selector('case-closure-closed-at-value')).should('not.be.empty');

  cy.get(selector('case-closure-drawer')).should('not.exist');
  clickHeaderAction('case-closure-edit');
  visible('case-closure-drawer').should('be.visible');
  cy.get(selector('case-closure-summary-input')).should('be.visible').and('have.value', 'Cypress closure summary');
  cy.get(selector('case-closure-resolution-input')).should('be.visible').and('have.value', 'Cypress resolution notes');
  clickVisible('case-closure-cancel');
  cy.get(selector('case-closure-drawer')).should('not.exist');
  cy.get(selector('case-details-edit')).should('not.exist');
  cy.get(selector('case-primary-entity-edit')).should('not.exist');
  cy.get(selector('case-related-entity-add')).should('not.exist');
  cy.get(selector('case-artifact-add')).should('not.exist');
  cy.get(selector('case-task-add')).should('not.exist');
  cy.get(selector('case-linked-case-add')).should('not.exist');
}

export function archiveClosedCaseAndShowArchived() {
  clickHeaderAction('case-details-archive');
  cy.get(selector('case-details-archive-confirmation')).should('exist');
  cy.get(selector('confirmation-popup')).should('contain.text', 'archive this case');
  cy.get(selector('confirmation-yes-button')).should('be.visible').click();

  assertNotification('Case archived successfully');
  cy.get(selector('case-details-archive')).should('not.exist');

  cy.visit('/dashboard/profile/case-management');
  cy.get(selector('case-management-page')).should('be.visible');
  cy.get(selector('toggle-archived-cases-button')).should('be.visible').click();
  cy.get(selector('case-management-page')).should('contain.text', 'Viewing archived cases');
  cy.then(() => {
    cy.get(selector(`case-row-${caseId}`)).should('be.visible');
  });
}
