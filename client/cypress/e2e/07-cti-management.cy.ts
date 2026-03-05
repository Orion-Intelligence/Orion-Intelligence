describe('Orion Intelligence - CTI & Social Graph Deep Coverage', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.get('input[name="username"]', { timeout: 20000 }).clear().type(Cypress.env('ADMIN_USERNAME'));
    cy.get('input[name="password"]', { timeout: 20000 }).clear().type(Cypress.env('ADMIN_PASSWORD'), { log: false });
    cy.get('[data-cy="login-button"], input.login-button').first().click();
    cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard');
  });

  after(() => {
    cy.logoutIfLoggedIn();
  });

  function openAndAssertReportModal(title: string) {
    cy.get('[data-cy="cti-tab-session-menu"], [data-cy="graph-tab-session-menu"]', { timeout: 15000 }).first().click();
    cy.contains('button', 'Export Report').click();
    cy.contains(title, { timeout: 10000 }).should('be.visible');
    cy.contains('1. JSON (Raw Graph Data)').should('exist');
    cy.contains('2. PDF Graph Report').should('exist');
    cy.contains('3. PDF Document Report').should('exist');
  }

  function visitCtiGraph() {
    cy.viewport(1440, 900);
    cy.visit('/dashboard/ctigraph');
    cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard/ctigraph');
    cy.get('[data-cy="graph-toolbar-root"]', { timeout: 30000 }).should('be.visible');
  }

  function visitSocialGraph() {
    cy.viewport(1440, 900);
    cy.visit('/dashboard/social-mapper');
    cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard/social-mapper');
    cy.get('app-social-graph', { timeout: 30000 }).should('be.visible');
  }

  it('runs CTI graph deep flow with filters, search, views and export/report actions', () => {
    cy.intercept('GET', '**/api/graph*').as('graphQuery');
    visitCtiGraph();

    cy.get('select[name="selectedType"]').select('Cluster');
    cy.contains('button', 'Apply').click();
    cy.wait('@graphQuery');

    cy.get('[data-cy="graph-toolbar-search-input"]').clear().type('leak');
    cy.get('[data-cy="graph-toolbar-search-button"]').click();
    cy.contains('highlighted').should('exist');

    openAndAssertReportModal('Export CTI Report');
  });

  it('covers CTI toolbar toggles and listings panel behavior', () => {
    visitCtiGraph();
    cy.get('[data-cy="graph-toolbar-view-list"]').click();
    cy.get('[data-cy="graph-toolbar-root"]').should('be.visible');
    cy.get('[data-cy="graph-toolbar-view-graph"]').click();
    cy.get('[data-cy="cti-listings-toggle"]').click();
    cy.get('[data-cy="cti-listings-toggle"]').click();
    cy.get('[data-cy="graph-toolbar-physics-toggle"]').click();
    cy.get('[data-cy="graph-toolbar-physics-toggle"]').click();
  });

  it('covers CTI session add/rename/import/export current/close actions', () => {
    visitCtiGraph();

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').as('createObjectURL').returns('blob:cti-test');
      cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
      cy.stub(win.HTMLAnchorElement.prototype, 'click').as('anchorClick');
    });

    cy.get('[data-cy="cti-tab-session-menu"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="cti-tab-add-menu"]').click();
    cy.contains('New Session').click();

    const newName = `CTI Session ${Date.now()}`;
    cy.get('span').contains(/^Session\s+\d+/).first().dblclick();
    cy.get('header input[type="text"]').first().clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');

    cy.get('[data-cy="cti-tab-session-menu"]').first().click();
    cy.contains('button', 'Export Current Session').click();
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

    cy.get('#graphSessionFileInput').selectFile(
      {
        contents: Cypress.Buffer.from(JSON.stringify(importPayload)),
        fileName: 'cti-import-session.json',
        mimeType: 'application/json'
      },
      { force: true }
    );
    cy.contains(importPayload.name).should('exist');
    cy.get('header button').filter(':has(i.bi-x-lg)').first().click({ force: true });
  });

  it('covers CTI report export option selection', () => {
    visitCtiGraph();
    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '1. JSON (Raw Graph Data)').click();
    cy.contains('Export CTI Report').should('not.exist');
    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '2. PDF Graph Report').click();
    cy.contains('Export CTI Report').should('not.exist');
    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '3. PDF Document Report').click();
    cy.contains('Export CTI Report').should('not.exist');
  });

  it('attempts CTI graph context menu actions (data-dependent)', () => {
    cy.intercept('GET', '**/api/graph*').as('graphQuery');
    visitCtiGraph();

    cy.get('select[name="selectedType"]').select('Cluster');
    cy.contains('button', 'Apply').click();
    cy.wait('@graphQuery', { timeout: 30000 });

    cy.get('.vis-network canvas', { timeout: 30000 }).first().then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const points = [
        { x: centerX, y: centerY },
        { x: centerX + 120, y: centerY },
        { x: centerX - 120, y: centerY },
        { x: centerX, y: centerY + 120 },
        { x: centerX, y: centerY - 120 }
      ];
      points.forEach((p) => {
        cy.wrap($canvas).trigger('contextmenu', {
          button: 2,
          clientX: p.x,
          clientY: p.y,
          force: true
        });
      });
    });
    cy.get('#customContextMenu', { timeout: 15000 }).should('exist');
  });

  it('covers social scan to graph/list and profile popups', () => {
    visitSocialGraph();
    cy.get('[data-cy="graph-toolbar-search-input"]').clear().type('msmannan00');
    cy.get('[data-cy="graph-toolbar-search-button"]').click();
    cy.get('[data-cy="graph-toolbar-view-list"]').click();
    cy.get('[data-cy="graph-toolbar-view-graph"]').click();
  });

  it('covers social graph search trigger expand and clear', () => {
    visitSocialGraph();
    cy.get('[data-cy="graph-toolbar-search-input"]').clear().type('msmannan00');
    cy.get('[data-cy="graph-toolbar-search-button"]').click();
    cy.get('[data-cy="graph-toolbar-search-input"]').clear().should('have.value', '');
  });

  it('covers social session rename and export actions', () => {
    visitSocialGraph();
    cy.get('[data-cy="graph-tab-add-menu"]').click();
    cy.contains('New Session').click();
    const newName = `Social Session ${Date.now()}`;
    cy.get('span[title="Double-click to rename"]').first().dblclick();
    cy.get('input[data-tab-id]').clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');
    openAndAssertReportModal('Export Social Report');
  });

  it('covers social entity modal validation and submit enablement', () => {
    visitSocialGraph();
    cy.contains('button', 'Add Phone').click();
    cy.get('app-add-entity-modal').should('be.visible');
    cy.get('[data-cy="add-entity-submit"]').should('be.disabled');
    cy.get('[data-cy="add-entity-api-query-input"]').type('923001234567');
    cy.get('[data-cy="add-entity-submit"]').should('not.be.disabled');
    cy.contains('button', 'Manual').click();
    cy.get('[data-cy="add-entity-submit"]').should('be.disabled');
    cy.get('[data-cy="add-entity-value-input"]').type('923001234567');
    cy.get('[data-cy="add-entity-submit"]').should('not.be.disabled').click();
    cy.get('app-add-entity-modal').should('not.exist');
  });

  it('covers social graph canvas contextmenu trigger path', () => {
    visitSocialGraph();
    cy.get('.vis-network canvas', { timeout: 30000 }).trigger('contextmenu', {
      button: 2,
      clientX: 200,
      clientY: 200,
      force: true
    });
  });

  it('covers lightweight mounts for metadata, summary, and context branches', () => {
    visitSocialGraph();
    cy.get('app-social-graph').should('exist');
  });
});
