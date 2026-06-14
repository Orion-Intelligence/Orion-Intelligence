import {
  openAndAssertReportModal,
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
    cy.get('[data-testid="cti-filter-type-select"]').select('Cluster');
    cy.get('[data-testid="cti-filter-apply"]').click();
    waitForCtiGraphReady();
    waitForToolbarSearchReady();
    cy.get('[data-testid="graph-toolbar-search-input"]').clear().type('leak');
    cy.get('[data-testid="graph-toolbar-search-button"]').click();
    cy.get('[data-testid="cti-highlighted-count"]').should('contain.text', 'highlighted');
    openAndAssertReportModal('Export CTI Report');
  });

  it('covers CTI toolbar toggles and listings panel behavior', () => {
    visitCtiGraph();

    cy.get('[data-testid="graph-toolbar-root"]').filter(':visible').first().within(() => {
      cy.get('[data-testid="graph-toolbar-view-list"]').filter(':visible').first().click();
      cy.get('[data-testid="graph-toolbar-view-graph"]').filter(':visible').first().click();
    });
    cy.get('[data-testid="cti-listings-toggle"], [data-testid="graph-toolbar-view-list"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-listings-toggle"], [data-testid="graph-toolbar-view-graph"]').filter(':visible').first().click();
    cy.get('body').then(($body) => {
      const listActive = $body.find('[data-testid="graph-toolbar-root"]:visible [data-testid="graph-toolbar-view-list"].text-white:visible').first();
      if (listActive.length) {
        cy.wrap(listActive).click();
      }
    });
    cy.get('[data-testid="graph-toolbar-root"]').filter(':visible').first().within(() => {
      cy.get('[data-testid="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]').filter(':visible').first().click();
      cy.get('[data-testid="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]').filter(':visible').first().click();
    });
  });

  it('covers CTI session add, rename, import, export, and close actions', () => {
    visitCtiGraph();

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').as('createObjectURL').returns('blob:cti-test');
      cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
      cy.stub(win.HTMLAnchorElement.prototype, 'click').as('anchorClick');
    });
    cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().should('be.visible');
    cy.get('[data-testid="cti-tab-add-menu"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-tab-add-new-session"]').filter(':visible').first().click();
    const newName = `CTI Session ${Date.now()}`;
    cy.get('[data-testid="cti-tab-name"]').filter(':visible').last().scrollIntoView().dblclick();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cti-tab-rename-input"]:visible').length === 0) {
        cy.get('[data-testid="cti-tab-name"]').filter(':visible').last().scrollIntoView().dblclick();
      }
    });
    cy.get('[data-testid="cti-tab-rename-input"]').filter(':visible').last().clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');
    cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().click();
    cy.contains('button', 'Export Current Session').then(($button) => {
      ($button[0] as HTMLButtonElement).click();
    });
    cy.get('@createObjectURL').should('have.been.called');
    cy.get('@anchorClick').should('have.been.called');
    cy.get('@revokeObjectURL').should('have.been.called');
    const importPayload = {
      name: `Imported Session ${Date.now()}`,
      state: {
        selectedType: 'cluster',
        singleInput: 'all',
        propertyType: 'all',
        propertyValue: '',
        maxEdge: 25,
        maxDepth: 1,
        nodeSearchText: '',
        physicsEnabled: true,
        isGraphView: true,
        isListingsCollapsed: true,
        expandEnabled: false
      }
    };
    cy.get('[data-testid="cti-tab-file-input"]').first().invoke('removeClass', 'hidden').invoke('css', 'display', 'block').invoke('css', 'visibility', 'visible').selectFile({
      contents: Cypress.Buffer.from(JSON.stringify(importPayload)),
      fileName: 'cti-import-session.json',
      mimeType: 'application/json'
    });
    cy.contains(importPayload.name).should('exist');
    cy.get('[data-testid="cti-tab-close"]').filter(':visible').first().click();
  });

  it('covers CTI report export option selection', () => {
    visitCtiGraph();

    openAndAssertReportModal('Export CTI Report');
    cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().click();
    cy.get('[data-testid="graph-report-export-modal"]').should('not.exist');
    openAndAssertReportModal('Export CTI Report');
    cy.get('[data-testid="graph-report-export-graph-pdf"]').filter(':visible').first().click();
    cy.get('[data-testid="graph-report-export-modal"]').should('not.exist');
  });

  it('attempts CTI graph context menu actions (data-dependent)', () => {
    visitCtiGraph();
    cy.get('[data-testid="cti-filter-type-select"]').select('Cluster');
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
  });

});
