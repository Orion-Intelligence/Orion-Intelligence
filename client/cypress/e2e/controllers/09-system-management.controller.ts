export function openSystemSettings() {
  cy.contains('app-dashboard-sidebar-items div', 'System Settings').should('be.visible').click();
  cy.url().should('include', 'system-settings');
}
