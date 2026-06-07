export function openSystemSettings() {
  cy.get('[data-testid="sidebar-subitem-profile-system-settings"]').filter(':visible').first().scrollIntoView().click();
  cy.url().should('include', 'system-settings');
}

export function fillSystemMailConfiguration(server: string, port: string) {
  cy.get('[data-testid="system-settings-account-mail"]')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type('cypress-mailer@example.test');
  cy.get('[data-testid="system-settings-account-mail-password"]')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type('1#VSC&cuad)d', {log: false});
  cy.get('[data-testid="system-settings-account-smtp-server"]')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(server);
  cy.get('[data-testid="system-settings-account-smtp-port"]')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(port);
}

export function ensureSystemSettingsEditing() {
  cy.get('body').then(($body) => {
    if (!$body.find('[data-testid="system-settings-save"]:visible').length) {
      cy.scrollDashboardToTop();
      cy.get('[data-testid="system-settings-edit"]').first().click({force: true});
    }
  });
}
