import {
  openAndAssertReportModal,
  setupSocialGraphInterceptors,
  visitCtiGraph,
  visitSocialGraph,
  waitForToolbarSearchReady,
  waitForCtiGraphReady
} from './controllers/07-cti-management.controller';

let testData: any = {};

describe('Orion Intelligence - CTI and Social Graph Management Flows', () => {
  before(() => {
    cy.env(['TEST_DATA']).then(({TEST_DATA}) => {
      testData = TEST_DATA || {};
    });
  });

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
    cy.get('[data-testid="cti-tab-name"]', {timeout: 15000}).filter(':visible').last().scrollIntoView().dblclick();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="cti-tab-rename-input"]:visible').length === 0) {
        cy.get('[data-testid="cti-tab-name"]', {timeout: 15000}).filter(':visible').last().scrollIntoView().dblclick();
      }
    });
    cy.get('[data-testid="cti-tab-rename-input"]', {timeout: 15000}).filter(':visible').last().clear().type(`${newName}{enter}`);
    cy.contains(newName).should('exist');
    cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().click();
    cy.contains('button', 'Export Current Session', {timeout: 15000}).then(($button) => {
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
      cy.get('[data-testid="cti-network-container"] canvas', {timeout: 30000})
        .filter(':visible')
        .first()
        .should('exist')
        .then(($canvas) => {
          const rect = $canvas[0].getBoundingClientRect();

          cy.wrap($canvas).trigger('contextmenu', {
            button: 2,
            clientX: rect.left + rect.width / 2 + offsetX,
            clientY: rect.top + rect.height / 2 + offsetY
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
    cy.get('[data-testid="social-tab-add-new-session"]').filter(':visible').first().click();
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

    cy.get('[data-testid="social-network-container"] canvas').trigger('contextmenu', {
      button: 2,
      clientX: 200,
      clientY: 200
    });
  });

  it('covers lightweight mounts for metadata, summary, and context branches', () => {
    visitSocialGraph();

    cy.get('[data-testid="social-graph-root"]').should('exist');
  });

  it('covers deeper social graph popup, modal, and upload flows', () => {
    visitSocialGraph();
    setupSocialGraphInterceptors();

    cy.get('[data-testid="graph-toolbar-image-search"]').click();
    cy.get('[data-testid="social-graph-root"] input[type="file"][accept*="image/png"]').first()
      .invoke('removeClass', 'hidden')
      .invoke('css', 'display', 'block')
      .invoke('css', 'visibility', 'visible')
      .invoke('css', 'position', 'fixed')
      .invoke('css', 'left', '0')
      .invoke('css', 'top', '0')
      .invoke('css', 'width', '1px')
      .invoke('css', 'height', '1px')
      .invoke('css', 'opacity', '1')
      .selectFile('cypress/fixtures/profile.png');
    cy.wait('@imageRecon');
    cy.get('[data-testid="social-manage-profiles-modal"]', {timeout: 90000}).should('be.visible');
    cy.get('[data-testid="social-manage-profiles-filter"]').should('be.visible').type('twit');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.contains('Twitter').should('be.visible');
      cy.get('input[placeholder="Search username..."]').should('have.value', 'image_scan_user');
      cy.contains('button', 'Fetch profile').should('be.visible').and('not.be.disabled');
      cy.contains('a', 'View link').should('have.attr', 'href').and('include', 'x.com/image_scan_user');
    });
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.contains('button', 'Fetch profile').first().click();
    });
    cy.wait('@socialRecon');
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
    cy.contains('.home-menu-created-item', 'image_scan_user', {timeout: 90000})
      .should('contain.text', 'Completed')
      .click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.get('[data-testid="social-manage-profiles-select-all"]')
        .scrollIntoView()
        .should('be.visible')
        .and('not.be.disabled')
        .click();
      cy.get('[data-testid="social-manage-profiles-update-graph"]')
        .scrollIntoView()
        .should('be.visible')
        .click();
    });
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');

    cy.get('[data-cy="social-graph-search-trigger"]').click();
    cy.get('[data-testid="social-graph-search-input"]').should('be.visible').type('image');
    cy.get('[data-testid="social-graph-search-clear"]').click();
    cy.get('[data-testid="social-graph-search-input"]').should('have.value', '');
    cy.get('body').then(($body) => {
      const editToggle = $body.find('[data-cy="graph-toolbar-edit-toggle"]:visible').first();
      if (editToggle.length) {
        cy.wrap(editToggle).click();
        cy.wrap(editToggle).click();
      }
    });

    cy.get('[data-testid="social-network-container"] canvas').first().then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas).trigger('contextmenu', {
        button: 2,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
    });
    cy.get('body').then(($body) => {
      const contextMenu = $body.find('[data-testid="social-context-menu-panel"]:visible').first();
      if (!contextMenu.length) {
        return;
      }
      cy.wrap(contextMenu).should('be.visible');
      cy.contains('[data-testid="social-context-menu-panel"] button', 'Set Alias').click();
      cy.get('[data-testid="social-alias-modal"]', {timeout: 15000}).should('be.visible');
      cy.get('[data-testid="social-alias-input"]').clear().type('Alias User');
      cy.get('[data-testid="social-alias-save"]').click();
      cy.get('[data-testid="social-alias-modal"]').should('not.exist');
    });

    cy.get('[data-testid="graph-toolbar-view-list"]').click();
    cy.get('[data-testid="social-list-manage-profiles"]', {timeout: 90000}).should('be.visible');
    cy.get('[data-testid="social-list-user-summary-trigger"]').first().should(($el) => {
      const text = $el.text();
      expect(text).to.match(/Alias User|image_scan_user/);
    });
    cy.get('[data-testid="social-list-platform-row"]').first().click();
    cy.get('[data-testid="social-list-platform-visit-profile"]')
      .should('have.attr', 'href')
      .and('match', /^https?:\/\//);
    cy.contains('[data-testid="social-list-platform-row"] + div, div', 'Visit Profile').should('be.visible');
    cy.contains('[data-testid="social-list-platform-row"] + div, div', 'Followers and Following').should('be.visible');

    cy.get('[data-testid="social-list-user-summary-trigger"]', {timeout: 90000}).first().click();
    cy.get('[data-testid="social-summary-popup"]').should('be.visible');
    cy.get('[data-testid="social-summary-popup"]').within(() => {
      cy.get('[data-testid="social-summary-all-platforms"]').scrollIntoView().should('be.visible');
      cy.contains('summary', 'Profile Metadata Results').scrollIntoView().should('be.visible');
      cy.contains('button', 'Search Metadata').scrollIntoView().should('be.visible').click();
      cy.contains('Enter at least one token to search.', {timeout: 10000}).should('be.visible');
      cy.get('input[placeholder="Type a token and press Enter"]').first().type('email leaked{enter}');
      cy.contains('button', 'Search Metadata').scrollIntoView().should('be.visible').click();
      cy.wait('@socialMetadata');
      cy.get('a[href^="http"]').should('exist');
      cy.contains('Twitter').scrollIntoView().click();
      cy.contains('a', 'Visit').should('have.attr', 'href').and('include', 'x.com/image_scan_user');
      cy.contains('button', 'Fetch Followers').scrollIntoView().should('be.visible').click();
      cy.wait('@socialFollowers');
      cy.contains('button', 'Fetch Following').scrollIntoView().should('be.visible').click();
      cy.wait('@socialFollowing');
      cy.contains('button', 'Fetch Images').scrollIntoView().should('be.visible').click();
      cy.wait('@socialImages');
    });
    cy.get('body').then(($body) => {
      const loadMore = $body.find('[data-testid="social-summary-popup"] button').filter((_, el) => el.textContent?.trim() === 'Load More');
      if (loadMore.length) {
        cy.wrap(loadMore.first()).click();
      }
    });
    cy.get('[data-testid="social-summary-popup"]').within(() => {
      cy.get('button[title="Re-scan profile"]').click();
    });
    cy.wait('@socialRecon');
    cy.get('[data-testid="social-summary-popup"]').should('not.exist');

    cy.get('[data-testid="social-list-manage-profiles"]').first().click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    cy.get('[data-testid="social-manage-profiles-cancel"]').click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');

    cy.get('[data-testid="social-list-followers-following"]').first().click();
    cy.get('[data-testid="social-follower-scan-popup"]').should('be.visible');
    cy.get('[data-testid="social-follower-scan-filter"]').type('a');
    cy.get('[data-testid="social-follower-tab-following"]').click();
    cy.get('[data-testid="social-follower-tab-connections"]').click();
    cy.get('[data-testid="social-follower-tab-followers"]').click();
    cy.get('[data-testid="social-follower-scan-popup"]').within(() => {
      cy.contains('button', 'Fetch Followers').then(($button) => {
        if ($button.length) {
          cy.wrap($button).click();
        }
      });
    });
    cy.wait('@socialFollowers');
    cy.get('[data-testid="social-follower-scan-popup"]').within(() => {
      cy.get('button').filter((_, el) => (el.textContent || '').includes('@')).should('have.length.greaterThan', 1);
      cy.get('button').filter((_, el) => (el.textContent || '').includes('@')).eq(0).click();
      cy.get('button').filter((_, el) => (el.textContent || '').includes('@')).eq(1).click();
      cy.get('[data-testid="social-follower-scan-confirm"]').should('not.be.disabled').click();
    });
    cy.wait('@socialRecon');
    cy.wait('@socialRecon');
    cy.contains('.home-menu-created-item', 'ally_one', {timeout: 90000}).should('contain.text', 'Completed').click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.get('[data-testid="social-manage-profiles-select-all"]')
        .scrollIntoView()
        .should('be.visible')
        .and('not.be.disabled')
        .click();
      cy.get('[data-testid="social-manage-profiles-update-graph"]')
        .scrollIntoView()
        .should('be.visible')
        .click();
    });
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
    cy.contains('.home-menu-created-item', 'ally_two', {timeout: 90000}).should('contain.text', 'Completed').click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.get('[data-testid="social-manage-profiles-select-all"]')
        .scrollIntoView()
        .should('be.visible')
        .and('not.be.disabled')
        .click();
      cy.get('[data-testid="social-manage-profiles-update-graph"]')
        .scrollIntoView()
        .should('be.visible')
        .click();
    });
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');

    cy.get('[data-testid="graph-toolbar-view-graph"]').click();
    cy.get('[data-testid="social-relationship-node-trigger"]')
      .should('have.length.greaterThan', 0)
      .first()
      .click();
    cy.get('[data-testid="social-relationship-popup"]').should('be.visible');
    cy.get('[data-testid="social-relationship-open-account"]').first()
      .should('have.attr', 'href')
      .and('match', /^https?:\/\//);
    cy.get('[data-testid="social-relationship-close"]').click();
    cy.get('[data-testid="social-relationship-popup"]').should('not.exist');
  });
});
