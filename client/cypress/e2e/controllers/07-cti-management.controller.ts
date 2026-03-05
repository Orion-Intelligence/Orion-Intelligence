export function openAndAssertReportModal(title: string) {
  cy.get('[data-cy="cti-tab-session-menu"], [data-cy="graph-tab-session-menu"]', {timeout: 15000}).first().click();
  cy.contains('button', 'Export Report').click();
  cy.contains(title, {timeout: 10000}).should('be.visible');
  cy.contains('1. JSON (Raw Graph Data)').should('exist');
  cy.contains('2. PDF Graph Report').should('exist');
  cy.contains('3. PDF Document Report').should('exist');
}

export function visitCtiGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/ctigraph');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/ctigraph');
  cy.get('[data-cy="graph-toolbar-root"]', {timeout: 30000}).should('be.visible');
}

export function visitSocialGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/social-mapper');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/social-mapper');
  cy.get('app-social-graph', {timeout: 30000}).should('be.visible');
}
