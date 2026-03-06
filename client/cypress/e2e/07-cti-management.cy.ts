import {openAndAssertReportModal, visitCtiGraph, visitSocialGraph, waitForToolbarSearchReady, waitForCtiGraphReady} from './controllers/07-cti-management.controller';

const testData = Cypress.env('TEST_DATA') || {};

describe('Orion Intelligence - CTI and Social Graph Management Flows', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');

    cy.get('[data-testid="login-user"]', {timeout: 20000}).clear().type(Cypress.env('ADMIN_USERNAME'));
    cy.get('[data-testid="login-pass"]', {timeout: 20000}).clear().type(Cypress.env('ADMIN_PASSWORD'), {log: false});
    cy.get('[data-testid="login-button"]').click();

    cy.location('pathname', {timeout: 30000}).should('include', '/dashboard');
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

    cy.get('[data-testid="graph-toolbar-root"]', {timeout: 15000}).filter(':visible').first().within(() => {
      cy.get('[data-testid="graph-toolbar-view-list"]').filter(':visible').first().click();
      cy.get('[data-testid="graph-toolbar-view-graph"]').filter(':visible').first().click();
    });
    cy.get('[data-testid="cti-listings-toggle"], [data-testid="graph-toolbar-view-list"]', {timeout: 15000}).filter(':visible').first().click();
    cy.get('[data-testid="cti-listings-toggle"], [data-testid="graph-toolbar-view-graph"]', {timeout: 15000}).filter(':visible').first().click();
    cy.get('body').then(($body) => {
      const listActive = $body.find('[data-testid="graph-toolbar-root"]:visible [data-testid="graph-toolbar-view-list"].text-white:visible').first();
      if (listActive.length) {
        cy.wrap(listActive).click();
      }
    });
    cy.get('[data-testid="graph-toolbar-root"]', {timeout: 15000}).filter(':visible').first().within(() => {
      cy.get('[data-testid="graph-toolbar-physics-toggle"], [data-cy="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]', {timeout: 15000}).filter(':visible').first().click();
      cy.get('[data-testid="graph-toolbar-physics-toggle"], [data-cy="graph-toolbar-physics-toggle"], button[title="Enable Physics Simulation"], button[title="Disable Physics Simulation"]', {timeout: 15000}).filter(':visible').first().click();
    });
  });

  it('covers CTI session add, rename, import, export, and close actions', () => {
    visitCtiGraph();

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').as('createObjectURL').returns('blob:cti-test');
      cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
      cy.stub(win.HTMLAnchorElement.prototype, 'click').as('anchorClick');
    });
    cy.get('[data-testid="cti-tab-session-menu"]', {timeout: 15000}).filter(':visible').first().should('be.visible');
    cy.get('[data-testid="cti-tab-add-menu"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-tab-add-new-session"]').filter(':visible').first().click();
    const newName = `CTI Session ${Date.now()}`;
    cy.get('[data-testid="cti-tab-name"]').filter(':visible').first().dblclick();
    cy.get('[data-testid="cti-tab-rename-input"]').filter(':visible').first().clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');
    cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-export-current-session"]', {timeout: 15000}).filter(':visible').first().click();
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

    cy.get('[data-testid="cti-network-container"] canvas', {timeout: 30000}).first().then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const points = [
        {x: centerX, y: centerY},
        {x: centerX + 120, y: centerY},
        {x: centerX - 120, y: centerY},
        {x: centerX, y: centerY + 120},
        {x: centerX, y: centerY - 120}
      ];
      points.forEach((p) => {
        cy.wrap($canvas).trigger('contextmenu', {
          button: 2,
          clientX: p.x,
          clientY: p.y
        });
      });
    });
    cy.get('[data-testid="cti-context-menu"]', {timeout: 15000}).should('exist');
  });

  it('covers social scan flow between graph and list views', () => {
    visitSocialGraph();

    waitForToolbarSearchReady();
    cy.get('[data-testid="graph-toolbar-search-input"]').clear().type(testData.cti_social_username);
    cy.get('[data-testid="graph-toolbar-search-button"]').click();
    cy.get('[data-testid="graph-toolbar-view-list"]').click();
    cy.get('[data-testid="graph-toolbar-view-graph"]').click();
  });

  it('covers social graph search and clear behavior', () => {
    visitSocialGraph();

    waitForToolbarSearchReady();
    cy.get('[data-testid="graph-toolbar-search-input"]').clear().type(testData.cti_social_username);
    cy.get('[data-testid="graph-toolbar-search-button"]').click();
    cy.get('[data-testid="graph-toolbar-search-input"]').clear().should('have.value', '');
  });

  it('covers social session rename and export actions', () => {
    visitSocialGraph();

    cy.get('[data-testid="social-tab-add-menu"]').filter(':visible').first().click();
    cy.get('[data-testid="social-new-session"]').filter(':visible').first().click();
    const newName = `Social Session ${Date.now()}`;
    cy.get('[data-testid="social-tab-name"]').filter(':visible').first().dblclick();
    cy.get('[data-testid="social-tab-rename-input"]').filter(':visible').first().clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');
    openAndAssertReportModal('Export Social Report');
  });

  it('covers social entity modal validation and submit enablement', () => {
    visitSocialGraph();

    cy.get('[data-testid="add-entity-option-phone"]').click();
    cy.get('[data-testid="add-entity-modal"]').should('be.visible');
    cy.get('[data-testid="add-entity-submit"]').should('be.disabled');
    cy.get('[data-testid="add-entity-api-query-input"]').type('923001234567');
    cy.get('[data-testid="add-entity-submit"]').should('not.be.disabled');
    cy.get('[data-testid="add-entity-mode-manual"]').click();
    cy.get('[data-testid="add-entity-submit"]').should('be.disabled');
    cy.get('[data-testid="add-entity-value-input"]').type('923001234567');
    cy.get('[data-testid="add-entity-submit"]').should('not.be.disabled').click();
    cy.get('[data-testid="add-entity-modal"]').should('not.exist');
  });

  it('covers social graph canvas context menu trigger path', () => {
    visitSocialGraph();

    cy.get('[data-testid="social-network-container"] canvas', {timeout: 30000}).trigger('contextmenu', {
      button: 2,
      clientX: 200,
      clientY: 200
    });
  });

  it('covers lightweight mounts for metadata, summary, and context branches', () => {
    visitSocialGraph();

    cy.get('[data-testid="social-graph-root"]').should('exist');
  });
});
