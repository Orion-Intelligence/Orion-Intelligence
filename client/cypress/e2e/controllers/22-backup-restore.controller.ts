export function openBackupRestore() {
  cy.get('[data-testid="sidebar-subitem-profile-backup-restore"]').filter(':visible').first().scrollIntoView().click();
  cy.url().should('include', 'backup-restore');
}

export function setScheduledBackupToggle(checked: boolean) {
  cy.get('[data-testid="scheduled-backup-toggle"]')
    .scrollIntoView()
    .then(($checkbox) => {
      if ($checkbox.is(':checked') !== checked) {
        cy.wrap($checkbox).click({force: true});
      }
    });
}

export function getBackupRows() {
  return cy.get('[data-testid="backup-row"]').filter(':visible');
}

export function getBackupFilenames(): Cypress.Chainable<string[]> {
  return getBackupRows().find('span[title]').then(($spans) => (
    Cypress.$.makeArray($spans).map((el) => el.getAttribute('title') || '')
  ));
}

export function createInstantBackup() {
  cy.intercept('POST', '**/api/admin/backups/instant').as('createInstantBackup');
  cy.get('[data-testid="instant-backup-button"]').should('be.visible').and('not.be.disabled').click();
  cy.get('[data-testid="confirmation-popup"]').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').click();
  cy.wait('@createInstantBackup', {timeout: 60000}).its('response.statusCode').should('be.oneOf', [200, 201]);
}

function deleteFirstBackupIfPresent(): Cypress.Chainable<void> {
  return cy.get('body').then(($body) => {
    const $row = $body.find('[data-testid="backup-row"]:visible').first();
    if (!$row.length) {
      return cy.wrap<void>(undefined, {log: false});
    }

    cy.intercept('DELETE', '**/api/admin/backups/*').as('deleteBackup');
    cy.wrap($row).find('button').contains('Delete').click({force: true});
    cy.get('[data-testid="confirmation-yes-button"]').click();
    cy.wait('@deleteBackup', {timeout: 60000}).its('response.statusCode').should('be.oneOf', [200, 201]);
    return deleteFirstBackupIfPresent();
  });
}

export function clearAllBackups() {
  deleteFirstBackupIfPresent();
}

export function restoreBackupViaTestApi() {
  cy.intercept('POST', '**/api/admin/backups/*/restore', (req) => {
    req.continue();
  }).as('restoreBackup');

  getBackupRows().eq(0).within(() => {
    cy.contains('button', 'Restore').click();
  });
  cy.contains('[data-testid="confirmation-popup"]', 'maintenance mode').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').click();
  cy.wait('@restoreBackup', {timeout: 60000}).its('response.statusCode').should('be.oneOf', [200, 201]);
}
