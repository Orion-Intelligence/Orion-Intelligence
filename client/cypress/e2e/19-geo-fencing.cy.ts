import {
  THREAT_LENS_FEED_TYPES,
  assertThreatLensFeedEmptyOnSearch,
  assertThreatLensFeedItemNotEmpty,
  cycleThreatLensFeedRanges,
  openThreatLensFeedItemIfPresent,
  openThreatLensFilters,
  resetThreatLensCountry,
  resetThreatLensPosition,
  selectThreatLensCategoryLayerIfPresent,
  selectThreatLensTopCountryIfPresent,
  setThreatLensArcRangeIfPresent,
  submitThreatLensKeyword,
  submitThreatLensTopicSearch,
  toggleThreatLensFeedPanel,
  toggleThreatLensSearchPanel,
  visitThreatLens,
  waitForThreatLensReady
} from './controllers/19-geo-fencing.controller';
import { ThreatLensGeoUtils } from '../../src/app/pages/geo-fencing/threat-lens/map-utils/threat-lens-geo.utils';
import { ThreatLensIpMarkerRenderer } from '../../src/app/pages/geo-fencing/threat-lens/map-overlays/threat-lens-ip-marker.renderer';
import type { EsriGraphicsLayer, EsriSceneView, ThreatLensMapGraphic } from '../../src/app/pages/geo-fencing/threat-lens/models/threat-lens-map.types';

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
    cy.docsScreenshot('satellite-map-overview');

    cy.get('[data-testid="geo-fencing-layer-satellite"]').should('be.visible').click({ force: true });
    cy.docsScreenshot('satellite-map-satellite-layer');
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
        cy.docsScreenshot('satellite-map-search-selection');
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
    cy.docsScreenshot('satellite-map-location-facilities');
    cy.get('[data-testid="geo-dashboard-location-open"]').should('be.visible').click();
    cy.get('[data-testid="geocode-modal"]').should('be.visible');
    cy.get('[data-testid="geocode-modal-mode-coordinates"]').should('be.visible').click();
    cy.get('[data-testid="geocode-modal-coordinates-input"]').should('be.visible').clear().type('31.48000, 74.17000');
    cy.get('[data-testid="geocode-modal-coverage-input"]').should('be.visible').clear().type('0.05');
    cy.docsScreenshot('satellite-map-location-modal');
    cy.get('[data-testid="geocode-modal-apply"]').should('be.visible').and('not.be.disabled').click();
    cy.get('[data-testid="geocode-modal"]').should('not.exist');
    cy.get('[data-testid="geo-dashboard-location-target"]', { timeout: 120000 }).should('not.be.disabled');
    cy.get('[data-testid="geo-dashboard-location-clear"]', { timeout: 120000 }).should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-dashboard-location-target"]').should('be.disabled');

    cy.get('[data-testid="geo-dashboard-tracking-aircraft"]').should('be.visible');
    cy.get('[data-testid="geo-dashboard-tracking-ships"]').should('be.visible');
    cy.docsScreenshot('satellite-map-tracking');

    cy.get('[data-testid="geo-fencing-panel-menu-button"]').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-tab-compare"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-title"]').should('contain.text', 'Imagery Analysis');
    cy.docsScreenshot('satellite-map-imagery-analysis');
  });

  it('switches to Threat Lens and verifies visible UI by test id', () => {
    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing');
    cy.get('[data-testid="geo-fencing-page"]', { timeout: 120000 }).should('be.visible');

    cy.get('[data-testid="geo-fencing-tab-threat"]').should('be.visible').and('not.be.disabled').click({ force: true });
    cy.get('[data-testid="geo-fencing-threat-view"]', { timeout: 120000 }).should('be.visible');
    cy.get('[data-testid="threat-lens-page"]', { timeout: 120000 }).should('be.visible');

    cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
    cy.get('[data-testid="threat-lens-map-renderer"]', { timeout: 180000 }).should('exist');
    cy.get('[data-testid="threat-lens-search-panel"]', { timeout: 180000 }).should('be.visible');
    cy.docsScreenshot('threat-lens-overview');

    cy.get('body').then(($body) => {
      const categoryLayers = $body.find('[data-testid="threat-lens-category-layers"]:visible').first();
      if (categoryLayers.length) {
        cy.wrap(categoryLayers).should('be.visible');
        cy.get('[data-testid="threat-lens-category-layer"]').should('have.length.greaterThan', 0);
      }
    });

    cy.get('[data-testid="threat-lens-feed-panel-news"]').should('be.visible');
    cy.docsScreenshot('threat-lens-feeds');
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
        cy.get('[data-testid="threat-lens-search-panel"]', { timeout: 180000 }).should('be.visible');
      }
    });

    cy.get('[data-testid="threat-lens-search-input"]').clear({ force: true }).type('china{enter}', { force: true });
    cy.get('[data-testid="threat-lens-active-keyword"]', { timeout: 60000 }).should('contain.text', 'china');
    cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
    cy.get('[data-testid="threat-lens-search-panel"]', { timeout: 180000 }).should('be.visible');
    cy.docsScreenshot('threat-lens-search');

    cy.get('[data-testid="geo-fencing-panel-menu-button"]').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-menu-filter"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
    cy.docsScreenshot('threat-lens-filters');
  });

  it('drives Threat Lens component logic: feeds, layers, topic search, and selection reset', () => {
    visitThreatLens();
    waitForThreatLensReady();

    cy.window().then((win) => {
      cy.stub(win, 'open').as('threatLensFeedOpen');
    });

    THREAT_LENS_FEED_TYPES.forEach((feedType) => {
      cy.get(`[data-testid="threat-lens-feed-panel-${feedType}"]`).should('be.visible');
      cycleThreatLensFeedRanges(feedType);
      assertThreatLensFeedItemNotEmpty(feedType);
      assertThreatLensFeedEmptyOnSearch(feedType);
    });

    openThreatLensFeedItemIfPresent('news');
    toggleThreatLensFeedPanel('archive');
    toggleThreatLensFeedPanel('archive');

    selectThreatLensCategoryLayerIfPresent();
    setThreatLensArcRangeIfPresent('100');
    waitForThreatLensReady();

    submitThreatLensTopicSearch('ransomware');
    waitForThreatLensReady();

    submitThreatLensKeyword('russia');
    waitForThreatLensReady();

    selectThreatLensTopCountryIfPresent();
    waitForThreatLensReady();

    toggleThreatLensSearchPanel();
    toggleThreatLensSearchPanel();

    openThreatLensFilters();
    cy.get('[data-testid="side-filter-close"]').filter(':visible').first().click({ force: true });

    resetThreatLensCountry();
    waitForThreatLensReady();
    resetThreatLensPosition();
    waitForThreatLensReady();
  });
});

describe('Threat Lens IP candidate parsing', () => {
  it('maps geolocation candidates into renderable IP records', () => {
    const records = ThreatLensGeoUtils.extractThreatLensIpScanRecords({
      candidate_ip_locations: [{
        ip: '203.0.113.10',
        latitude: 20,
        longitude: 0,
        network: '203.0.113.0/24',
        accuracy_radius: 25,
        distance_km: 8.5,
      }],
    });

    expect(records).to.deep.equal([{
      ip: '203.0.113.10',
      lat: 20,
      lon: 0,
      network: '203.0.113.0/24',
      accuracyRadius: 25,
      distanceKm: 8.5,
    }]);
  });

  it('renders the scan circle and a detail-enabled IP marker', () => {
    const graphics: ThreatLensMapGraphic[] = [];
    const graphicsLayer = {
      removeAll: () => graphics.splice(0),
      add: (graphic: ThreatLensMapGraphic) => graphics.push(graphic),
      addMany: (items: ThreatLensMapGraphic[]) => graphics.push(...items),
      remove: (graphic: ThreatLensMapGraphic) => {
        const index = graphics.indexOf(graphic);
        if (index >= 0) {
          graphics.splice(index, 1);
        }
      },
      graphics: { toArray: () => graphics.slice() },
    } as unknown as EsriGraphicsLayer;
    const view = { zoom: 6, scale: 1_000_000 } as EsriSceneView;
    const renderer = new ThreatLensIpMarkerRenderer(view, graphicsLayer);

    expect(renderer.render([{
      ip: '203.0.113.10',
      lat: 20,
      lon: 0,
      network: '203.0.113.0/24',
      accuracyRadius: 25,
      distanceKm: 8.5,
    }], { lat: 20, lon: 0 }, 12000)).to.equal(true);

    const radius = graphics.find((graphic) => graphic.attributes?.role === 'ip-scan-radius');
    const marker = graphics.find((graphic) => graphic.attributes?.role === 'ip-scan-marker');
    expect(radius?.geometry?.rings?.[0]).to.have.length.greaterThan(0);
    expect(marker?.attributes).to.include({
      ip: '203.0.113.10',
      network: '203.0.113.0/24',
      accuracyRadius: 25,
      distanceKm: 8.5,
    });
    expect(renderer.isMarkerGraphic(marker)).to.equal(true);
  });
});

describe('Threat Lens IP scan polling', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('polls the tracked scan job instead of reposting the scan request', () => {
    let createCalls = 0;
    let pollCalls = 0;

    cy.intercept('POST', '**/api/threat/lens', {
      statusCode: 200,
      body: {},
    }).as('threatLensData');

    cy.intercept('POST', '**/api/netintel/iot_detect', (request) => {
      createCalls += 1;
      expect(request.body).to.deep.equal({
        coordinates: '20, 0',
        radius_km: 12000,
        max_ips: 500,
      });
      request.reply({
        status: 'pending',
        progress: 5,
        step: 'queued',
        scan_id: 'threat-lens-ip-scan',
        scan_title: 'Threat Lens IP Scan',
        scan_target: '20, 0',
        scan_status: 'running',
        scan_seen: false,
      });
    }).as('ipScanStarted');

    cy.intercept('POST', '**/api/scan-jobs/threat-lens-ip-scan/poll', (request) => {
      pollCalls += 1;
      request.reply({
        response: {
          status: 'done',
          progress: 100,
          step: 'done',
          result: {
            status: 'done',
            candidate_ip_locations: [{ ip: '203.0.113.10', latitude: 20, longitude: 0 }],
          },
        },
      });
    }).as('ipScanPolled');

    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing&view=threat');
    cy.get('[data-testid="threat-lens-page"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@threatLensData');
    cy.wait('@ipScanStarted');
    cy.wait('@ipScanPolled');

    cy.contains('IP scan loading...').should('not.exist');
    cy.then(() => {
      expect(createCalls).to.equal(1);
      expect(pollCalls).to.be.greaterThan(0);
    });
  });

  it('reuses a completed automatic scan without opening the duplicate prompt', () => {
    cy.intercept('POST', '**/api/threat/lens', {
      statusCode: 200,
      body: {},
    });

    cy.intercept('POST', '**/api/netintel/iot_detect', {
      statusCode: 200,
      body: {
        requires_confirmation: true,
        message: 'A completed scan already exists.',
        source: 'previous_completed',
        previous_scan: {
          scan_id: 'previous-threat-lens-ip-scan',
          title: 'Threat Lens IP Scan',
          target: '20, 0',
          status: 'done',
        },
      },
    }).as('duplicateIpScan');

    cy.intercept('GET', '**/api/scan-jobs/previous-threat-lens-ip-scan', {
      statusCode: 200,
      body: {
        scan_id: 'previous-threat-lens-ip-scan',
        title: 'Threat Lens IP Scan',
        target: '20, 0',
        api_reference: '/api/netintel/iot_detect',
        status: 'done',
        payload: { coordinates: '20, 0', radius_km: 12000, max_ips: 500 },
        response: {
          status: 'done',
          progress: 100,
          step: 'done',
          result: {
            status: 'done',
            candidate_ip_locations: [{ ip: '203.0.113.11', latitude: 20, longitude: 0 }],
          },
        },
      },
    }).as('previousIpScan');

    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing&view=threat');
    cy.get('[data-testid="threat-lens-page"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@duplicateIpScan');
    cy.wait('@previousIpScan');

    cy.contains('IP scan loading...').should('not.exist');
    cy.contains('Run New Scan').should('not.exist');
  });
});
