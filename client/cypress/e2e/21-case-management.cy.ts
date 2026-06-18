import {
  CASE_MOVE_STATUS_IDS,
  addCase,
  addLinkTargetCase,
  assertNotification,
  assignAnalystIfAvailable,
  caseId,
  clickHeaderAction,
  linkedCaseId,
  openCaseManagement,
  openCreatedCaseDetails,
  openCreatedCaseFromList,
  selector
} from './controllers/21-case-management.controller';

describe('Case Management - Add View Edit Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('creates cases and opens created case details', () => {
    openCaseManagement();
    addCase();
    assignAnalystIfAvailable();
    addLinkTargetCase();
    openCreatedCaseFromList();

    cy.then(() => {
      cy.get(selector('case-details-case-id-value')).should('contain.text', caseId);
    });
    cy.get(selector('case-details-title-value')).should('contain.text', 'Cypress Case Title');
    cy.get(selector('case-details-description-value')).should('contain.text', 'Cypress investigation context');
    cy.get(selector('case-details-type-value')).should('contain.text', 'Fraud');
    cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Soc Alert');
    cy.get(selector('case-details-status-value')).should('contain.text', 'New');
    cy.get(selector('case-details-severity-value')).should('contain.text', 'high');
    cy.get(selector('case-details-priority-value')).should('contain.text', 'high');
    cy.get(selector('case-primary-entity-value')).should('contain.text', 'Cypress Entity');

    cy.get(selector('case-closure-add'))
      .scrollIntoView()
      .should('be.visible')
      .and('be.disabled');
  });

  it('edits case details and primary entity', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-details-edit')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-details-edit-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-details-title-input')).should('be.visible').clear().type('Cypress Updated Case Title');
    cy.get(selector('case-details-description-input')).should('be.visible').clear().type('Cypress updated investigation context');
    cy.get(selector('case-details-intake-source-select')).scrollIntoView().should('be.visible').select('email_report');
    cy.get(selector('case-details-severity-select')).scrollIntoView().should('be.visible').select('critical');
    cy.get(selector('case-details-priority-select')).scrollIntoView().should('be.visible').select('critical');
    cy.get(selector('case-details-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Case details updated successfully');
    cy.get(selector('case-details-title-value')).should('contain.text', 'Cypress Updated Case Title');
    cy.get(selector('case-details-description-value')).should('contain.text', 'Cypress updated investigation context');
    cy.get(selector('case-details-intake-source-value')).should('contain.text', 'Email Report');
    cy.get(selector('case-details-status-value')).should('contain.text', 'New');
    cy.get(selector('case-details-severity-value')).should('contain.text', 'critical');
    cy.get(selector('case-details-priority-value')).should('contain.text', 'critical');

    cy.get(selector('case-primary-entity-edit')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-primary-entity-edit-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-primary-entity-value-input')).scrollIntoView().should('be.visible').clear().type('Cypress Updated Entity');
    cy.get(selector('case-primary-entity-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Primary entity updated successfully');
    cy.get(selector('case-primary-entity-value')).should('contain.text', 'Cypress Updated Entity');
  });

  it('adds and edits related entity', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-related-entity-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-related-entity-add-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-related-entity-value-input-0')).scrollIntoView().should('be.visible').type('Cypress Related Domain');
    cy.get(selector('case-related-entity-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Related entity added successfully');
    cy.get(selector('case-related-entity-card-0')).scrollIntoView().should('be.visible');
    cy.get(selector('case-related-entity-value-0')).should('contain.text', 'Cypress Related Domain');

    cy.get(selector('case-related-entity-edit-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-related-entity-edit-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-related-entity-value-input-0')).scrollIntoView().should('be.visible').clear().type('Cypress Updated Related Domain');
    cy.get(selector('case-related-entity-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Related entities updated successfully');
    cy.get(selector('case-related-entity-value-0')).should('contain.text', 'Cypress Updated Related Domain');
  });

  it('adds and edits artifacts and task', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-artifact-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-artifact-add-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-artifact-title-input')).should('be.visible').type('Cypress Evidence Artifact');
    cy.get(selector('case-artifact-type-select')).should('be.visible').select('file');
    cy.get(selector('case-artifact-source-select')).should('be.visible').select('manual');
    cy.get(selector('case-artifact-captured-input')).should('be.visible').type('2026-05-25');
    cy.get(selector('case-artifact-description-input')).should('be.visible').type('Artifact added by Cypress');
    cy.get(selector('case-artifact-file-input')).selectFile('cypress/fixtures/resume-sample.pdf', { force: true });
    cy.get(selector('case-artifact-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Artifact added successfully');
    cy.get(selector('case-artifact-card-0')).scrollIntoView().should('be.visible');
    cy.get(selector('case-artifact-title-value-0')).should('contain.text', 'Cypress Evidence Artifact');
    cy.get(selector('case-artifact-file-download-0')).should('be.visible');
    cy.get(selector('case-artifact-file-delete-0')).should('be.visible');

    cy.get(selector('case-artifact-file-verify-0'))
      .should('be.visible')
      .click();

    assertNotification('File integrity verified');

    cy.get(selector('case-artifact-file-integrity-0')).should('contain.text', 'Verified');

    cy.get(selector('case-artifact-edit-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-artifact-edit-drawer')).filter(':visible').first().within(() => {
      cy.get(selector('case-artifact-file-download-0')).should('not.exist');
      cy.get(selector('case-artifact-file-delete-0')).should('not.exist');
    });
    cy.get(selector('case-artifact-title-input')).should('be.visible').clear().type('Cypress Updated Evidence Artifact');
    cy.get(selector('case-artifact-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Artifacts updated successfully');
    cy.get(selector('case-artifact-title-value-0')).should('contain.text', 'Cypress Updated Evidence Artifact');

    cy.get(selector('case-artifact-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-artifact-add-drawer')).filter(':visible').first().should('be.visible');

    cy.get(selector('case-artifact-title-input')).should('be.visible').type('Cypress Linked Report Artifact');
    cy.get(selector('case-artifact-type-select')).should('be.visible').select('report');

    cy.get(selector('case-artifact-report-source-select')).filter(':visible').first()
      .should('be.visible')
      .select('strategic');

    cy.get(selector('case-artifact-report-search-input')).filter(':visible').first()
      .should('be.visible')
      .type('test');

    cy.get(selector('case-artifact-report-empty')).should('not.exist');

    cy.get(selector('case-artifact-report-option-0')).filter(':visible').first()
      .click({ force: true });

    cy.get(selector('case-artifact-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Artifact added successfully');

    cy.get(selector('case-artifact-card-1')).scrollIntoView().should('be.visible');
    cy.get(selector('case-artifact-title-value-1')).should('contain.text', 'Cypress Linked Report Artifact');
    cy.get(selector('case-artifact-card-1')).should('contain.text', 'Linked Report');

    cy.get(selector('case-artifact-file-download-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-artifact-file-delete-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    assertNotification('File deleted successfully');
    cy.get(selector('case-artifact-file-download-0')).should('not.exist');

    cy.get(selector('case-artifact-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-artifact-add-drawer')).filter(':visible').first().should('be.visible');

    cy.get(selector('case-artifact-title-input'))
      .should('be.visible')
      .type('Cypress Raw Alert Artifact');

    cy.get(selector('case-artifact-type-select'))
      .should('be.visible')
      .select('raw_alert');

    cy.get(selector('case-artifact-source-select'))
      .should('be.visible')
      .select('manual');

    cy.get(selector('case-artifact-description-input'))
      .should('be.visible')
      .type('Raw alert artifact added by Cypress');

    cy.get(selector('case-artifact-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Artifact added successfully');

    cy.get(selector('case-artifact-card-2'))
      .scrollIntoView()
      .should('be.visible');

    cy.get(selector('case-artifact-title-value-2'))
      .should('contain.text', 'Cypress Raw Alert Artifact');

    cy.get(selector('case-task-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-task-add-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-task-title-input')).should('be.visible').type('Cypress Review Task');
    cy.get(selector('case-task-status-select')).should('be.visible').select('in_progress');
    cy.get(selector('case-task-priority-select')).should('be.visible').select('high');
    cy.get(selector('case-task-due-input')).should('be.visible').type('2026-05-26');
    cy.get(selector('case-task-description-input')).should('be.visible').type('Task added by Cypress');
    cy.get(selector('case-task-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    cy.get(selector('case-task-add-drawer')).should('not.exist');
    cy.get(selector('case-task-card-0')).scrollIntoView().should('be.visible');
    cy.get(selector('case-task-title-value-0')).should('contain.text', 'Cypress Review Task');

    cy.get(selector('case-task-edit-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-task-edit-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-task-title-input')).should('be.visible').clear().type('Cypress Updated Review Task');
    cy.get(selector('case-task-status-select')).should('be.visible').select('done');
    cy.get(selector('case-task-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    cy.get(selector('case-task-edit-drawer')).should('not.exist');
    cy.get(selector('case-task-title-value-0')).should('contain.text', 'Cypress Updated Review Task');
    cy.get(selector('case-task-card-0')).should('contain.text', 'Done');
  });

  it('adds and edits linked case', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-linked-case-add')).last().scrollIntoView().should('exist').click({ force: true });
    cy.get(selector('case-linked-case-add-drawer')).filter(':visible').first().should('be.visible');
    cy.then(() => {
      cy.get(selector('case-linked-case-select')).should('be.visible').select(linkedCaseId);
    });
    cy.get(selector('case-linked-case-relationship-select')).should('be.visible').select('related');
    cy.get(selector('case-linked-case-reason-input')).should('be.visible').type('Linked by Cypress');
    cy.get(selector('case-linked-case-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Linked case added successfully');
    cy.get(selector('case-linked-case-card-0')).scrollIntoView().should('be.visible');
    cy.then(() => {
      cy.get(selector('case-linked-case-target-value-0')).should('contain.text', linkedCaseId);
    });

    cy.get(selector('case-linked-case-edit-0')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-linked-case-edit-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-linked-case-relationship-select')).should('be.visible').select('same_actor');
    cy.get(selector('case-linked-case-reason-input')).should('be.visible').clear().type('Updated linked case reason');
    cy.get(selector('case-linked-case-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Linked cases updated successfully');
    cy.get(selector('case-linked-case-card-0')).should('contain.text', 'Same Actor');
    cy.get(selector('case-linked-case-card-0')).should('contain.text', 'Updated linked case reason');
  });

  it('adds comment, exports PDF, shares, and revokes link', () => {
    openCreatedCaseDetails();

    cy.get(selector('report-feedback-comment-input')).scrollIntoView().should('be.visible').type('Cypress analyst note');
    cy.get(selector('report-feedback-comment-save')).should('be.visible').click();
    cy.contains(selector('report-feedback-comment-body'), 'Cypress analyst note').should('be.visible');
    cy.get(selector('report-feedback-comment-user-name')).should('exist');

    clickHeaderAction('case-details-export-pdf');
    cy.then(() => {
      cy.readFile(`cypress/downloads/${caseId}-case-report.pdf`, null, { timeout: 30000 })
        .should((contents) => {
          expect(contents.length).to.be.greaterThan(1000);
        });
    });

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
  });

  it('moves case from new to resolved', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-details-case-id-value'))
      .should(($value) => {
        expect($value.text().trim()).not.to.equal('');
      })
      .invoke('text')
      .then((text) => {
        const createdCaseId = text.trim();

        cy.visit('/dashboard/profile/case-management/tracking-board');

        cy.get(selector('case-tracking-board-page'))
          .should('be.visible');

        const moves = [
          'Intake Review',
          'Under Investigation',
          'Move back to Intake Review',
          'Under Investigation',
          'Evidence Collection',
          'Verification',
          'Regulatory Action',
          'Legal Review',
          'Resolved'
        ];

        moves.forEach((statusLabel) => {
          cy.get(selector(`case-board-card-${createdCaseId}`), { timeout: 60000 })
            .should('exist')
            .scrollIntoView();

          cy.get(selector(`case-board-move-${createdCaseId}-${CASE_MOVE_STATUS_IDS[statusLabel]}`))
            .scrollIntoView()
            .should('exist')
            .click({ force: true });

          cy.get(selector('case-move-reason-input'))
            .should('be.visible')
            .clear()
            .type(`Moving case to ${statusLabel}`);

          cy.get(selector('case-move-save'))
            .should('be.visible')
            .click({ force: true });
        });

        cy.visit(`/dashboard/profile/case-management/case-details?caseId=${createdCaseId}`);

        cy.get(selector('case-details-status-value'))
          .should('contain.text', 'Resolved');

        cy.get(selector('case-closure-add'))
          .should('not.be.disabled');
      });
  });

  it('closes case and verifies read-only state', () => {
    openCreatedCaseDetails();

    cy.get(selector('case-closure-add')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-closure-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-closure-reason-select')).should('be.visible').select('true_positive');
    cy.get(selector('case-closure-summary-input')).should('be.visible').type('Cypress closure summary');
    cy.get(selector('case-closure-resolution-input')).should('be.visible').type('Cypress resolution notes');
    cy.get(selector('case-closure-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

    assertNotification('Case closed successfully');
    cy.get(selector('case-closure-reason-value')).should('contain.text', 'True Positive');
    cy.get(selector('case-closure-summary-value')).should('contain.text', 'Cypress closure summary');
    cy.get(selector('case-closure-resolution-value')).should('contain.text', 'Cypress resolution notes');
    cy.get(selector('case-closure-closed-by-value')).should('not.be.empty');
    cy.get(selector('case-closure-closed-at-value')).should('not.be.empty');

    cy.get(selector('case-closure-drawer')).should('not.exist');
    clickHeaderAction('case-closure-edit');
    cy.get(selector('case-closure-drawer')).filter(':visible').first().should('be.visible');
    cy.get(selector('case-closure-summary-input')).should('be.visible').and('have.value', 'Cypress closure summary');
    cy.get(selector('case-closure-resolution-input')).should('be.visible').and('have.value', 'Cypress resolution notes');
    cy.get(selector('case-closure-cancel')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
    cy.get(selector('case-closure-drawer')).should('not.exist');
    cy.get(selector('case-details-edit')).should('not.exist');
    cy.get(selector('case-primary-entity-edit')).should('not.exist');
    cy.get(selector('case-related-entity-add')).should('not.exist');
    cy.get(selector('case-artifact-add')).should('not.exist');
    cy.get(selector('case-task-add')).should('not.exist');
    cy.get(selector('case-linked-case-add')).should('not.exist');
  });

  it('archives closed case and shows archived list', () => {
    openCreatedCaseDetails();

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
  });
});
