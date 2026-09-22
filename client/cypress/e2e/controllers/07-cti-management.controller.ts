export function openAndAssertReportModal(title: string) {
  void cy.get('[data-testid="cti-export-report"]').filter(':visible').first().click();
  void cy.contains(title).should('be.visible');
  void cy.get('[data-testid="graph-report-export-modal"]').filter(':visible').first().should('be.visible');
  void cy.get('[data-testid="graph-report-export-report"]').filter(':visible').first().should('exist');
  void cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().should('exist');
  void cy.get('[data-testid="graph-report-export-csv"]').filter(':visible').first().should('exist');
}

export function selectCtiFilterType(label: string) {
  const key = label.toLowerCase() === 'cluster' ? 'all' : label.toLowerCase();
  void cy.get(`[data-testid="cti-graph-search-chip-${key}"]`).filter(':visible').first().click();
}

export function waitForToolbarSearchReady() {
  void cy.get('[data-testid="cti-graph-search-input"]').should('be.visible').and('not.be.disabled');
}

export function waitForCtiGraphReady() {
  void cy.get('[data-testid="cti-network-container"]').should('be.visible');
  void cy.get('[data-testid="cti-network-container"] canvas').should('exist');
}

function setConfiguredViewport() {
  void cy.viewport(
    Number(Cypress.config('viewportWidth')) || 1920,
    Number(Cypress.config('viewportHeight')) || 1080
  );
}

export function visitCtiGraph() {
  setConfiguredViewport();
  void cy.visit('/dashboard/ctigraph');
  void cy.location('pathname').should('include', '/dashboard/ctigraph');
  void cy.get('[data-testid="cti-graph-root"]').should('be.visible');
}

export const CTI_CLUSTER_CHIP_KEYS = ['leak', 'news', 'tracking'];

export const CTI_CONTEXT_ACTION_TESTIDS = [
  'cti-context-copy-label',
  'cti-context-open-cti',
  'cti-context-open-document',
  'cti-context-expand',
  'cti-context-collapse'
];

export const CTI_CANVAS_PROBE_OFFSETS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 120, y: 0 },
  { x: -120, y: 0 },
  { x: 0, y: 120 },
  { x: 0, y: -120 },
  { x: 90, y: 90 },
  { x: -90, y: -90 }
];

export function clickCtiSearchChip(optionKey: string) {
  void cy.get(`[data-testid="cti-graph-search-chip-${optionKey}"]`).filter(':visible').first().click();
}

export function typeCtiSearch(term: string) {
  void cy.get('[data-testid="cti-graph-search-input"]').filter(':visible').first().clear().type(`${term}{enter}`);
}

export function applyCtiGraphSize(limit: number, depth: number) {
  void cy.get('graph-sidebar [data-sidebar-expanded] input[type="number"]').filter(':visible').first().clear().type(String(limit));
  void cy.get('graph-sidebar [data-sidebar-expanded] input[type="number"]').filter(':visible').eq(1).clear().type(String(depth));
  void cy.get('graph-sidebar [data-sidebar-expanded] button').filter(':visible').first().click();
}

export function triggerCtiCanvasEvent(eventName: string, offsetX: number, offsetY: number) {
  void cy.get('[data-testid="cti-network-container"] canvas')
    .filter(':visible')
    .first()
    .should('exist')
    .then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas).trigger(eventName, {
        button: eventName === 'contextmenu' ? 2 : 0,
        clientX: rect.left + rect.width / 2 + offsetX,
        clientY: rect.top + rect.height / 2 + offsetY,
        force: true
      });
    });
}

export function probeCtiCanvas(eventName: string) {
  CTI_CANVAS_PROBE_OFFSETS.forEach((point) => {
    triggerCtiCanvasEvent(eventName, point.x, point.y);
  });
}

export function clickCtiContextActionIfPresent(testId: string) {
  probeCtiCanvas('contextmenu');
  void cy.get('body').then(($body) => {
    const action = $body.find(`[data-testid="${testId}"]:visible`);
    if (action.length > 0) {
      cy.wrap(action.first()).click();
    }
  });
}

export function selectCtiDropdownOption(testId: string, label: string) {
  void cy.get(`[data-testid="${testId}"]`).filter(':visible').first().click();
  void cy.get('.ui-dropdown-menu input').filter(':visible').first().clear().type(label);
  void cy.contains('[role="option"]', label).filter(':visible').first().click();
}

export function selectFirstCtiDropdownOption(testId: string) {
  void cy.get(`[data-testid="${testId}"]`).filter(':visible').first().click();
  void cy.get('[role="option"]').filter(':visible').first().click();
}
