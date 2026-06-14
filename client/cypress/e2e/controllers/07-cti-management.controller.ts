export function openAndAssertReportModal(title: string) {
  cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().click();
  cy.contains('button', 'Export Report').then(($button) => {
    ($button[0] as HTMLButtonElement).click();
  });
  cy.contains(title).should('be.visible');
  cy.get('[data-testid="graph-report-export-modal"]').filter(':visible').first().should('be.visible');
  cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().should('exist');
  cy.get('[data-testid="graph-report-export-graph-pdf"]').filter(':visible').first().should('exist');
}

export function invokeVisibleTabBarMethod(methodName: 'createNewTab' | 'exportCurrentSession') {
  cy.get('app-tab-bar')
    .filter(':visible')
    .first()
    .then(($host) => {
      cy.window().then((win: any) => {
        const component = win.ng?.getComponent?.($host[0]);
        component?.[methodName]?.();
      });
    });
}

export function waitForToolbarSearchReady() {
  cy.get('[data-testid="graph-toolbar-search-input"]').should('be.visible').and('not.be.disabled');
}

export function waitForCtiGraphReady() {
  cy.get('[data-testid="cti-network-container"]').should('be.visible');
  cy.get('[data-testid="cti-network-container"] canvas').should('exist');
}

export function visitCtiGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/ctigraph');
  cy.location('pathname').should('include', '/dashboard/ctigraph');
  cy.get('[data-testid="graph-toolbar-root"]').should('be.visible');
}
