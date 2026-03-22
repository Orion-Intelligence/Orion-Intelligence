export function openSystemSettings() {
  cy.get('[data-testid="sidebar-subitem-profile-system-settings"]').filter(':visible').first().scrollIntoView().click();
  cy.url().should('include', 'system-settings');
}
