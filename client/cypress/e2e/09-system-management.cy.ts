import {openSystemSettings} from './controllers/09-system-management.controller';

describe('System Settings - Admin Update Flow', () => {
  after(() => {
    cy.logout();
  });

  it('updates app name from system settings and signs out', () => {
    cy.loginAsAdmin();

    openSystemSettings();

    cy.get('[data-testid="system-settings-edit"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="system-settings-app-name"]', {timeout: 30000}).should('be.visible').clear().type('Dark Intelligence');
    cy.get('[data-testid="system-settings-save"]', {timeout: 30000}).should('be.visible').click();

    cy.logout();
  });
});
