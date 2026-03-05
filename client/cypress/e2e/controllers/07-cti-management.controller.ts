export function openAndAssertReportModal(title: string) {
  cy.get('[data-testid="cti-tab-session-menu"], [data-testid="social-tab-session-menu"]', {timeout: 15000}).first().click();
  cy.get('[data-testid="cti-export-report"], [data-testid="social-export-report"]', {timeout: 15000}).first().click();
  cy.contains(title, {timeout: 10000}).should('be.visible');
  cy.get('[data-testid="graph-report-export-modal"]', {timeout: 10000}).should('be.visible');
  cy.get('[data-testid="graph-report-export-json"]').should('exist');
  cy.get('[data-testid="graph-report-export-graph-pdf"]').should('exist');
  cy.get('[data-testid="graph-report-export-doc-pdf"]').should('exist');
}

export function waitForToolbarSearchReady() {
  cy.get('[data-testid="graph-toolbar-search-input"]', {timeout: 30000}).should('be.visible').and('not.be.disabled');
}

export function waitForCtiGraphReady() {
  cy.get('[data-testid="cti-network-container"]', {timeout: 30000}).should('be.visible');
  cy.get('[data-testid="cti-network-container"] canvas', {timeout: 30000}).should('exist');
}

export function visitCtiGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/ctigraph');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/ctigraph');
  cy.get('[data-testid="graph-toolbar-root"]', {timeout: 30000}).should('be.visible');
}

export function visitSocialGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/social-mapper');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/social-mapper');
  cy.get('[data-testid="social-graph-root"]', {timeout: 30000}).should('be.visible');
}
