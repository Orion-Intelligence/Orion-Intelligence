export function openAndAssertReportModal(title: string) {
  cy.get('[data-testid="cti-export-report"]').filter(':visible').first().click();
  cy.contains(title).should('be.visible');
  cy.get('[data-testid="graph-report-export-modal"]').filter(':visible').first().should('be.visible');
  cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().should('exist');
  cy.get('[data-testid="graph-report-export-graph-pdf"]').filter(':visible').first().should('exist');
}

export function selectCtiFilterType(label: string) {
  const key = label.toLowerCase() === 'cluster' ? 'all' : label.toLowerCase();
  cy.get(`[data-testid="cti-graph-search-chip-${key}"]`).filter(':visible').first().click();
}

export function waitForToolbarSearchReady() {
  cy.get('[data-testid="cti-graph-search-input"]').should('be.visible').and('not.be.disabled');
}

export function waitForCtiGraphReady() {
  cy.get('[data-testid="cti-network-container"]').should('be.visible');
  cy.get('[data-testid="cti-network-container"] canvas').should('exist');
}

export function visitCtiGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/ctigraph');
  cy.location('pathname').should('include', '/dashboard/ctigraph');
  cy.get('[data-testid="cti-graph-root"]').should('be.visible');
}
