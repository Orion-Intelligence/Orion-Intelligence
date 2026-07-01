import {
  openAndAssertReportModal,
  selectCtiFilterType,
  visitCtiGraph,
  waitForToolbarSearchReady,
  waitForCtiGraphReady
} from './controllers/07-cti-management.controller';

describe('Orion Intelligence - CTI Graph Management Flows', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs CTI graph flow with filters, search, and export report actions', () => {
    visitCtiGraph();
    selectCtiFilterType('Cluster');
    cy.get('[data-testid="cti-filter-apply"]').click();
    waitForCtiGraphReady();
    waitForToolbarSearchReady();
    cy.docsScreenshot('cti-graph');
    cy.get('[data-testid="graph-toolbar-search-input"]').clear().type('leak');
    cy.get('[data-testid="graph-toolbar-search-button"]').click();
    cy.get('[data-testid="cti-highlighted-count"]').should('contain.text', 'highlighted');
    openAndAssertReportModal('Export CTI Report');
  });

  it('covers CTI toolbar toggles', () => {
    visitCtiGraph();

    cy.get('[data-testid="graph-toolbar-root"]').filter(':visible').first().within(() => {
      cy.get('[data-testid="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]').filter(':visible').first().click();
      cy.get('[data-testid="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]').filter(':visible').first().click();
    });
  });

  it('covers CTI filter rail collapse, reset, and apply actions', () => {
    visitCtiGraph();

    selectCtiFilterType('Property');
    cy.get('[data-testid="cti-filter-reset"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-filter-type-select"]').should('contain.text', 'Cluster');
    cy.get('[data-testid="graph-sidebar-collapse"]').filter(':visible').first().click();
    cy.get('[data-testid="graph-sidebar-expand"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-filter-apply"]').filter(':visible').first().click();
    waitForCtiGraphReady();
  });

  it('covers CTI report export option selection', () => {
    visitCtiGraph();

    openAndAssertReportModal('Export CTI Report');
    cy.docsScreenshot('cti-export-modal');
    cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().click();
    cy.get('[data-testid="graph-report-export-modal"]').should('not.exist');
    openAndAssertReportModal('Export CTI Report');
    cy.get('[data-testid="graph-report-export-graph-pdf"]').filter(':visible').first().click();
    cy.get('[data-testid="graph-report-export-modal"]').should('not.exist');
  });

  it('attempts CTI graph context menu actions (data-dependent)', () => {
    visitCtiGraph();
    selectCtiFilterType('Cluster');
    cy.get('[data-testid="cti-filter-apply"]').click();
    waitForCtiGraphReady();

    const attemptContextMenuAtOffsets = (offsetX: number, offsetY: number) => {
      cy.get('[data-testid="cti-network-container"] canvas')
        .filter(':visible')
        .first()
        .should('exist')
        .then(($canvas) => {
          const rect = $canvas[0].getBoundingClientRect();

          cy.wrap($canvas).trigger('contextmenu', {
            button: 2,
            clientX: rect.left + rect.width / 2 + offsetX,
            clientY: rect.top + rect.height / 2 + offsetY,
            force: true
          });
        });
    };

    [
      {x: 0, y: 0},
      {x: 120, y: 0},
      {x: -120, y: 0},
      {x: 0, y: 120},
      {x: 0, y: -120}
    ].forEach((point) => {
      attemptContextMenuAtOffsets(point.x, point.y);
    });

    cy.get('[data-testid="cti-context-menu"]').should('exist');
    cy.docsScreenshot('cti-context-menu');
  });

});
