describe('Geo Fencing - Satellite Intel and Threat Lens', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens the latest satellite dashboard with stable controls', () => {
    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing');
    cy.get('[data-testid="geo-fencing-page"]', { timeout: 120000 }).should('be.visible');

    cy.get('[data-testid="geo-fencing-map-renderer"]', { timeout: 120000 }).should('exist');
    cy.get('[data-testid="geo-fencing-tab-map"]').should('be.visible');
    cy.get('[data-testid="geo-fencing-tab-threat"]').should('be.visible');

    cy.get('[data-testid="geo-fencing-layer-satellite"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-fencing-layer-street"]').should('be.visible').click({ force: true });

    cy.get('[data-testid="geo-fencing-panel-menu-button"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-menu"]').should('be.visible');
    cy.get('[data-testid="geo-fencing-panel-tab-dashboard"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-popup"]').should('be.visible');

    cy.get('[data-testid="geo-dashboard-section"]', { timeout: 120000 }).should('be.visible');
    cy.get('[data-testid="geo-dashboard-loaded-count"]', { timeout: 120000 }).should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^Loaded\s+\d+\s+records$/i);
    });
    cy.get('[data-testid="geo-dashboard-visible-count"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^\d+\s+visible$/i);
    });

    cy.get('[data-testid="geo-dashboard-search-input"]')
      .should('be.visible')
      .clear()
      .type('solar');

    cy.get('body').then(($body) => {
      const searchResult = $body.find('[data-testid="geo-dashboard-search-result"]:visible').first();
      if (searchResult.length) {
        cy.wrap(searchResult).click();
        cy.get('[data-testid="geo-dashboard-selection-panel"]').should('not.contain.text', 'Click a map point');
      }
    });

    cy.get('body').then(($body) => {
      const clearSearch = $body.find('[data-testid="geo-dashboard-search-clear"]:visible').first();
      if (clearSearch.length) {
        cy.wrap(clearSearch).click();
      }
    });

    cy.get('[data-testid="geo-dashboard-clear-all"]').should('be.visible').click();
    cy.get('[data-testid="geo-dashboard-visible-count"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^0\s+visible$/i);
    });
    cy.get('[data-testid="geo-dashboard-filter-solar"]').should('be.visible').click();
    cy.get('[data-testid="geo-dashboard-filter-wind"]').should('be.visible').click();
    cy.get('[data-testid="geo-dashboard-visible-count"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^\d+\s+visible$/i);
    });
    cy.get('[data-testid="geo-dashboard-clear-all"]').should('be.visible').click();
    cy.get('[data-testid="geo-dashboard-visible-count"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^0\s+visible$/i);
    });
    cy.get('[data-testid="geo-dashboard-select-all"]').click();
    cy.get('[data-testid="geo-dashboard-visible-count"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^\d+\s+visible$/i);
    });

    cy.get('[data-testid="geo-dashboard-facilities-panel"]').should('be.visible');
    cy.get('[data-testid="geo-dashboard-location-open"]').should('be.visible').click();
    cy.get('[data-testid="geocode-modal"]').should('be.visible');
    cy.get('[data-testid="geocode-modal-mode-coordinates"]').should('be.visible').click();
    cy.get('[data-testid="geocode-modal-coordinates-input"]').should('be.visible').clear().type('31.48000, 74.17000');
    cy.get('[data-testid="geocode-modal-coverage-input"]').should('be.visible').clear().type('0.05');
    cy.get('[data-testid="geocode-modal-apply"]').should('be.visible').and('not.be.disabled').click();
    cy.get('[data-testid="geocode-modal"]').should('not.exist');
    cy.get('[data-testid="geo-dashboard-location-target"]', { timeout: 120000 }).should('not.be.disabled');
    cy.get('[data-testid="geo-dashboard-location-clear"]', { timeout: 120000 }).should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-dashboard-location-target"]').should('be.disabled');

    cy.get('[data-testid="geo-dashboard-tracking-aircraft"]').should('be.visible');
    cy.get('[data-testid="geo-dashboard-tracking-ships"]').should('be.visible');
  });

  it('switches to Threat Lens and verifies visible UI by test id', () => {
    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing');
    cy.get('[data-testid="geo-fencing-page"]', { timeout: 120000 }).should('be.visible');

    cy.get('[data-testid="geo-fencing-tab-threat"]').should('be.visible').and('not.be.disabled').click({ force: true });
    cy.get('[data-testid="geo-fencing-threat-view"]', { timeout: 120000 }).should('be.visible');
    cy.get('[data-testid="threat-lens-page"]', { timeout: 120000 }).should('be.visible');

    cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
    cy.get('[data-testid="threat-lens-topic-search-panel"]').should('be.visible');
    cy.get('[data-testid="threat-lens-topic-search-input"]').should('be.visible');
    cy.get('[data-testid="threat-lens-search-panel"]').should('be.visible');
    cy.get('[data-testid="threat-lens-status"]', { timeout: 180000 }).should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/(loaded|failed|no country metadata|no multi-country)/i);
    });
    cy.get('[data-testid="threat-lens-visible-arcs"]').should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/^Arcs currently visible:\s*\d+$/i);
    });
    cy.get('[data-testid="threat-lens-ip-scan-panel"]', { timeout: 180000 }).should('be.visible');
    cy.get('[data-testid="threat-lens-ip-scan-scope"]').should('contain.text', 'Global view');
    cy.get('[data-testid="threat-lens-ip-scan-state"]').should(($element) => {
      expect($element.text().trim()).to.match(/^(Scanning|\d+%|Ready|Complete|Error)$/i);
    });
    cy.get('[data-testid="threat-lens-ip-scan-markers"]').should(($element) => {
      expect($element.text().trim()).to.match(/^\d+$/);
    });
    cy.get('[data-testid="threat-lens-ip-scan-range"]').should('contain.text', 'km radius');
    cy.get('[data-testid="threat-lens-ip-scan-status"]').should(($element) => {
      expect($element.text().trim()).to.not.equal('');
    });

    cy.get('body').then(($body) => {
      const categoryLayers = $body.find('[data-testid="threat-lens-category-layers"]:visible').first();
      if (categoryLayers.length) {
        cy.wrap(categoryLayers).should('be.visible');
        cy.get('[data-testid="threat-lens-category-layer"]').should('have.length.greaterThan', 0);
      }
    });

    cy.get('[data-testid="threat-lens-feed-panel-news"]').should('be.visible');
    cy.get('[data-testid="threat-lens-feed-range-news-7d"]').click();
    cy.get('[data-testid="threat-lens-feed-range-news-all"]').click();
    cy.get('body').then(($body) => {
      const newsItem = $body.find('[data-testid="threat-lens-feed-item-news"]:visible').first();
      if (newsItem.length) {
        cy.wrap(newsItem).should(($item) => {
          expect($item.text().replace(/\s+/g, ' ').trim()).to.not.equal('');
        });
      }
    });
    cy.get('[data-testid="threat-lens-feed-search-news"]').clear({ force: true }).type('zzzz-no-news-match', { force: true });
    cy.get('[data-testid="threat-lens-feed-empty-news"]').should('be.visible');
    cy.get('[data-testid="threat-lens-feed-search-news"]').clear({ force: true });

    cy.get('[data-testid="threat-lens-feed-panel-archive"]').should('be.visible');
    cy.get('[data-testid="threat-lens-feed-range-archive-7d"]').click();
    cy.get('[data-testid="threat-lens-feed-range-archive-all"]').click();
    cy.get('body').then(($body) => {
      const archiveItem = $body.find('[data-testid="threat-lens-feed-item-archive"]:visible').first();
      if (archiveItem.length) {
        cy.wrap(archiveItem).should(($item) => {
          expect($item.text().replace(/\s+/g, ' ').trim()).to.not.equal('');
        });
      }
    });
    cy.get('[data-testid="threat-lens-feed-search-archive"]').clear({ force: true }).type('zzzz-no-archive-match', { force: true });
    cy.get('[data-testid="threat-lens-feed-empty-archive"]').should('be.visible');
    cy.get('[data-testid="threat-lens-feed-search-archive"]').clear({ force: true });

    cy.get('body').then(($body) => {
      const topCountry = $body.find('[data-testid="threat-lens-top-country"]:visible').first();
      if (topCountry.length) {
        cy.wrap(topCountry).click();
        cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
        cy.get('[data-testid="threat-lens-ip-scan-panel"]', { timeout: 180000 }).should('be.visible');
        cy.get('[data-testid="threat-lens-ip-scan-scope"]').should(($element) => {
          expect($element.text().trim()).to.not.equal('');
        });
        cy.get('[data-testid="threat-lens-ip-scan-status"]').should(($element) => {
          expect($element.text().trim()).to.match(/scan|marker|ip|failed|returned/i);
        });
      }
    });

    cy.get('[data-testid="threat-lens-search-input"]').clear({ force: true }).type('china{enter}', { force: true });
    cy.get('[data-testid="threat-lens-active-keyword"]', { timeout: 60000 }).should('contain.text', 'china');
    cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
    cy.get('[data-testid="threat-lens-status"]', { timeout: 180000 }).should(($element) => {
      expect($element.text().replace(/\s+/g, ' ').trim()).to.match(/(loaded|failed|no country metadata|no multi-country)/i);
    });

    cy.get('[data-testid="geo-fencing-panel-menu-button"]').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-menu-filter"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
  });
});
