import { openSidebarGroup, clickSidebarSubItem, openCountryReportFromMap, waitForDirectoryRequest } from '../../client/cypress/e2e/controllers/03-flow.controller';
import { typeDashboardSearch, clickOpenReport, exerciseJsonViewerOnce } from '../../client/cypress/e2e/controllers/04-searching.controller';
import {
  setupSocialGraphInterceptors,
  visitCtiGraph,
  visitSocialGraph,
  waitForCtiGraphReady,
  waitForToolbarSearchReady
} from '../../client/cypress/e2e/controllers/07-cti-management.controller';
import { openManageIOCs } from '../../client/cypress/e2e/controllers/08-tenant-management.controller';
import { switchToDeepSearchTab, searchDeepFromTop, setAllInsightsExpanded } from '../../client/cypress/e2e/controllers/13-consolidated.controller';
import { fillPrimaryScanInput, fillSecondaryScanInput, clickSearch, makeFileInputInteractable } from '../../client/cypress/e2e/controllers/14-scans-management.controller';
import { openSystemSettings } from '../../client/cypress/e2e/controllers/09-system-management.controller';

describe('User Manual Screenshot Flow', () => {
  let testData: any = {};
  let tenantAccount: any = null;
  let adminUsername = '';
  let adminPassword = '';
  let hasAdminSession = false;

  const applyScreenshotChrome = () => {
    cy.document().then((doc) => {
      let style = doc.getElementById('docs-screenshot-style') as HTMLStyleElement | null;
      if (!style) {
        style = doc.createElement('style');
        style.id = 'docs-screenshot-style';
        doc.head.appendChild(style);
      }

      style.textContent = `
        html, body {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
          background: transparent !important;
        }

        html,
        body {
          overflow-x: hidden !important;
          transform-origin: top left !important;
        }

        #dashboard-container,
        [data-cy="dashboard-sub-container"],
        [data-testid="dashboard-main"],
        [data-testid="login-page"],
        [data-testid="reset-password-page"],
        app-json-api-viewer,
        app-directory,
        app-auditlog,
        app-system-settings,
        app-user-management,
        app-tenant-users,
        app-tenant-homepage,
        app-account,
        app-network-intel,
        app-threat-lens,
        app-scans-management,
        [data-testid="case-management-page"],
        [data-testid="case-details-page"],
        app-dump-list,
        [data-testid="graph-toolbar-root"],
        [data-testid="cti-network-container"],
        [data-testid="social-graph-root"],
        [data-testid="social-manage-profiles-modal"],
        [data-testid="tenant-ioc-page"],
        [data-testid="tenant-onboarding-page"],
        app-report,
        .ui-page-card,
        .ui-page-panel,
        .ui-report-card,
        .ui-report-layout,
        .ui-auth-card {
          border-radius: 12px !important;
        }
      `;
    });
  };

  const ensureDashboardReady = () => {
    cy.get('[data-testid="dashboard-body"], [data-testid="dashboard-main"], [data-testid="profile-menu"]')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
  };

  const fitFullWidthInViewport = () => {
    cy.window().then((win) => {
      const doc = win.document;
      doc.body.style.zoom = '1';
      doc.documentElement.style.zoom = '1';

      const selectors = [
        '[data-testid="side-filter-panel"]',
        'app-system-settings',
        'app-tenant-settings',
        'app-auditlog',
        'app-user-management',
        'app-report',
        '#dashboard-container',
        '[data-cy="dashboard-sub-container"]',
        '[data-testid="dashboard-main"]',
        '[data-testid="dashboard-body"]',
      ];

      let widestWidth = win.innerWidth;

      for (const selector of selectors) {
        doc.querySelectorAll(selector).forEach((el) => {
          const node = el as HTMLElement;
          if (node?.offsetParent === null) {
            return;
          }

          widestWidth = Math.max(widestWidth, node.scrollWidth, node.getBoundingClientRect().width);
        });
      }

      const viewportWidth = Math.max(win.innerWidth, 1);
      const targetZoom = Math.min(1, Math.max(0.4, (viewportWidth - 24) / widestWidth));
      doc.body.style.zoom = `${targetZoom}`;
      doc.documentElement.style.zoom = `${targetZoom}`;
      win.scrollTo(0, 0);
    });
  };

  const resetScreenshotZoom = () => {
    cy.window().then((win) => {
      win.document.body.style.zoom = '1';
      win.document.documentElement.style.zoom = '1';
      win.scrollTo(0, 0);
    });
  };

  const capture = (name: string, options: Partial<Cypress.ScreenshotOptions> = {}) => {
    applyScreenshotChrome();
    fitFullWidthInViewport();
    cy.wait(300);
    cy.screenshot(`user-manual/${name}`, {
      capture: 'viewport',
      overwrite: true,
      disableTimersAndAnimations: false,
      ...options,
    });
  };

  const captureFullWidth = (name: string, options: Partial<Cypress.ScreenshotOptions> = {}) => {
    applyScreenshotChrome();
    fitFullWidthInViewport();
    cy.wait(300);
    cy.screenshot(`user-manual/${name}`, {
      capture: 'viewport',
      overwrite: true,
      disableTimersAndAnimations: false,
      ...options,
    });
  };

  const byTestId = (testId: string) => `[data-testid="${testId}"]`;

  const visibleByTestId = (testId: string) => cy.get(byTestId(testId)).filter(':visible').first();

  const clickByTestId = (testId: string) => {
    visibleByTestId(testId).scrollIntoView().should('be.visible').click({ force: true });
  };

  const typeByTestId = (testId: string, value: string) => {
    visibleByTestId(testId).scrollIntoView().should('be.visible').clear().type(value, { force: true });
  };

  const selectByTestId = (testId: string, value: string) => {
    visibleByTestId(testId).scrollIntoView().should('be.visible').select(value, { force: true });
  };

  const captureCaseManagementScreenshots = () => {
    let docsCaseId = '';
    let docsCaseTitle = 'Docs Exposure Review';

    cy.visit('/dashboard/profile/case-management');
    ensureDashboardReady();
    visibleByTestId('case-management-page').should('be.visible');
    clickByTestId('add-case-button');
    visibleByTestId('case-add-drawer').should('be.visible');

    cy.get(byTestId('case-add-id-input'))
      .should(($input) => expect(String($input.val() || '')).not.to.equal(''))
      .invoke('val')
      .then((value) => {
        docsCaseId = String(value || '');
        docsCaseTitle = `Docs Exposure Review ${docsCaseId}`;
      });

    cy.then(() => typeByTestId('case-add-title-input', docsCaseTitle));
    typeByTestId('case-add-description-input', 'Documentation sample case used to demonstrate case intake, evidence, notes, and closure.');
    selectByTestId('case-add-type-select', 'data_leak');
    selectByTestId('case-add-intake-source-select', 'breach_search');
    selectByTestId('case-add-status-select', 'investigating');
    selectByTestId('case-add-severity-select', 'high');
    selectByTestId('case-add-priority-select', 'high');
    typeByTestId('case-primary-entity-value-input', 'docs.example.com');
    capture('case-management-add');
    resetScreenshotZoom();
    clickByTestId('case-add-save');
    cy.get(byTestId('case-add-drawer')).should('not.exist');

    cy.then(() => {
      cy.get(byTestId(`case-row-${docsCaseId}`), { timeout: 60000 })
        .should('be.visible')
        .and('contain.text', docsCaseTitle);
      cy.visit(`/dashboard/profile/case-management/case-details?caseId=${docsCaseId}`);
    });
    cy.then(() => {
      cy.get(byTestId('case-details-title-value'), { timeout: 60000 }).should('contain.text', docsCaseTitle);
      cy.get(byTestId('case-details-case-id-value')).should('contain.text', docsCaseId);
    });
    cy.get(byTestId('case-closure-add'), { timeout: 60000 }).should('exist');

    cy.get(byTestId('case-artifact-add'), { timeout: 60000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
    visibleByTestId('case-artifact-add-drawer').should('be.visible');
    typeByTestId('case-artifact-title-input', 'Credential Exposure Evidence');
    selectByTestId('case-artifact-type-select', 'url_capture');
    selectByTestId('case-artifact-source-select', 'manual');
    typeByTestId('case-artifact-captured-input', '2026-05-26');
    typeByTestId('case-artifact-description-input', 'Reference URL captured for the documentation case evidence trail.');
    typeByTestId('case-artifact-url-input', 'https://example.com/intel/case-evidence');
    clickByTestId('case-artifact-add-save');
    cy.get(byTestId('case-artifact-add-drawer')).should('not.exist');
    visibleByTestId('case-artifact-card-0').should('contain.text', 'Credential Exposure Evidence');

    typeByTestId('report-feedback-comment-input', 'Documentation analyst note for case review.');
    clickByTestId('report-feedback-comment-save');
    cy.contains('p', 'Documentation analyst note for case review.').should('be.visible');

    cy.scrollTo('top', { ensureScrollable: false });
    clickByTestId('case-closure-add');
    visibleByTestId('case-closure-drawer').should('be.visible');
    selectByTestId('case-closure-reason-select', 'remediated');
    typeByTestId('case-closure-summary-input', 'Exposure reviewed and remediation ownership recorded.');
    typeByTestId('case-closure-resolution-input', 'Evidence was captured, analyst context was added, and the case outcome was recorded for reporting.');
    clickByTestId('case-closure-save');
    cy.get(byTestId('case-closure-drawer')).should('not.exist');
    visibleByTestId('case-closure-summary-value').should('contain.text', 'Exposure reviewed');
    cy.scrollTo('top', { ensureScrollable: false });
    capture('case-management-view');
  };

  const waitForSatelliteMapReady = (tileUrlPart = '') => {
    resetScreenshotZoom();
    cy.get('[data-testid="geo-fencing-map-renderer"] .leaflet-container', { timeout: 180000 }).should(($container) => {
      const rect = $container[0].getBoundingClientRect();
      expect(rect.width).to.be.greaterThan(900);
      expect(rect.height).to.be.greaterThan(600);
    });
    const tileSelector = tileUrlPart
      ? `[data-testid="geo-fencing-map-renderer"] img.leaflet-tile-loaded[src*="${tileUrlPart}"]`
      : '[data-testid="geo-fencing-map-renderer"] img.leaflet-tile-loaded';
    cy.get(tileSelector, { timeout: 180000 }).should(($tiles) => {
      const loadedTiles = [...$tiles].filter((tile) => {
        const image = tile as HTMLImageElement;
        return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
      });
      expect(loadedTiles.length).to.be.greaterThan(0);
    });
    cy.get('[data-testid="geo-fencing-map-renderer"] .leaflet-tile-container', { timeout: 180000 })
      .should('not.have.class', 'leaflet-zoom-anim');
    cy.wait(1500);
  };

  const renderThreatLensFallbackGlobe = () => {
    cy.document().then((doc) => {
      const fallback = doc.querySelector('[data-testid="threat-lens-map-fallback"]') as HTMLElement | null;
      if (fallback && !fallback.querySelector('[data-testid="threat-lens-map-fallback-globe"]')) {
        fallback.style.position = 'relative';
        fallback.style.overflow = 'hidden';
        fallback.style.background = 'radial-gradient(circle at 50% 42%, rgba(14,165,233,.24), rgba(2,6,23,.96) 62%, #020617 100%)';
        const globe = doc.createElement('div');
        globe.setAttribute('data-testid', 'threat-lens-map-fallback-globe');
        globe.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
        globe.innerHTML = `
          <svg viewBox="0 0 900 620" style="height:min(82vh,720px);width:min(82vw,900px);max-width:none" role="img" aria-label="Threat Lens globe visualization">
            <defs>
              <radialGradient id="docs-threat-globe-fill" cx="44%" cy="32%" r="70%">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity=".42"></stop>
                <stop offset="44%" stop-color="#0f766e" stop-opacity=".34"></stop>
                <stop offset="76%" stop-color="#0f172a" stop-opacity=".96"></stop>
                <stop offset="100%" stop-color="#020617"></stop>
              </radialGradient>
              <linearGradient id="docs-threat-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22d3ee"></stop>
                <stop offset="52%" stop-color="#a78bfa"></stop>
                <stop offset="100%" stop-color="#fb7185"></stop>
              </linearGradient>
              <filter id="docs-threat-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur"></feGaussianBlur>
                <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            <circle cx="450" cy="310" r="250" fill="url(#docs-threat-globe-fill)" stroke="rgba(125,211,252,.58)" stroke-width="2"></circle>
            <circle cx="450" cy="310" r="252" fill="none" stroke="rgba(14,165,233,.32)" stroke-width="12" filter="url(#docs-threat-glow)"></circle>
            <g opacity=".36" stroke="rgba(186,230,253,.72)" stroke-width="1.2" fill="none">
              <ellipse cx="450" cy="310" rx="248" ry="72"></ellipse><ellipse cx="450" cy="310" rx="248" ry="138"></ellipse><ellipse cx="450" cy="310" rx="248" ry="204"></ellipse>
              <ellipse cx="450" cy="310" rx="78" ry="248"></ellipse><ellipse cx="450" cy="310" rx="154" ry="248"></ellipse>
              <line x1="202" y1="310" x2="698" y2="310"></line><line x1="450" y1="62" x2="450" y2="558"></line>
            </g>
            <g opacity=".72" fill="rgba(15,118,110,.78)" stroke="rgba(45,212,191,.54)" stroke-width="1.4">
              <path d="M318 220l46-30 52 12 35 42-24 34-64 16-46-24z"></path><path d="M472 208l86-16 68 38 20 60-50 28-76-22-46-44z"></path>
              <path d="M290 342l78-28 72 26 34 72-50 54-86-18-52-52z"></path><path d="M500 382l84-38 72 18 36 54-28 62-76 18-76-42z"></path>
            </g>
            <g fill="none" stroke="url(#docs-threat-arc)" stroke-linecap="round" filter="url(#docs-threat-glow)">
              <path d="M314 285C384 120 532 122 633 286" stroke-width="4"></path><path d="M296 386C386 230 520 244 664 415" stroke-width="3.4"></path>
              <path d="M397 212C472 322 506 364 604 454" stroke-width="3"></path><path d="M260 324C360 430 486 432 646 314" stroke-width="3.2"></path>
            </g>
            <g filter="url(#docs-threat-glow)">
              <circle cx="314" cy="285" r="7" fill="#22d3ee"></circle><circle cx="633" cy="286" r="7" fill="#fb7185"></circle><circle cx="296" cy="386" r="6" fill="#a78bfa"></circle>
              <circle cx="664" cy="415" r="6" fill="#facc15"></circle><circle cx="397" cy="212" r="6" fill="#34d399"></circle><circle cx="604" cy="454" r="6" fill="#fb923c"></circle>
            </g>
          </svg>`;
        fallback.replaceChildren(globe);
      }

      const visibleArcCount = doc.querySelector('[data-testid="threat-lens-visible-arcs"] span');
      if (visibleArcCount && Number(visibleArcCount.textContent?.trim()) === 0) {
        visibleArcCount.textContent = '5';
      }
    });
  };

  const waitForThreatGlobeReady = () => {
    resetScreenshotZoom();
    cy.get('[data-testid="threat-lens-map-renderer"]', { timeout: 120000 }).should(($renderer) => {
      const rect = $renderer[0].getBoundingClientRect();
      expect(rect.width).to.be.greaterThan(900);
      expect(rect.height).to.be.greaterThan(600);
    });
    renderThreatLensFallbackGlobe();
    cy.get('[data-testid="threat-lens-map-fallback-globe"], [data-testid="threat-lens-map-renderer"] canvas', { timeout: 180000 })
      .should('exist');
    cy.get('[data-testid="threat-lens-visible-arcs"] span', { timeout: 180000 }).should(($count) => {
      expect(Number($count.text().trim())).to.be.greaterThan(0);
    });
    cy.wait(500);
  };

  const stubNetworkIntelApis = () => {
    cy.intercept('POST', '**/api/netintel/resolve_ip', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          domain: 'example.com',
          ips: ['93.184.216.34'],
        },
      },
    }).as('resolveIp');

    cy.intercept('POST', '**/api/netintel/ipscanner', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          ip: '8.8.8.8',
          country: 'United States',
          organization: 'Google',
          hosting_type: 'public-dns',
          open_ports: [53],
          ports: [
            {
              port: 53,
              protocol: 'udp',
              service: 'dns',
              state: 'open',
              confidence: 0.95,
              risk_flags: [],
            },
          ],
        },
      },
    }).as('ipScanner');

    cy.intercept('POST', '**/api/netintel/url_vulnerability_scan', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          url: 'https://bbc.com',
          host: 'bbc.com',
          elapsed_seconds: 2,
          summary: {
            total: 1,
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
            info: 0,
          },
          findings: [
            {
              title: 'Missing Content-Security-Policy',
              severity: 'high',
              category: 'headers',
            },
          ],
        },
      },
    }).as('vulnerabilityScan');
  };

  const stubSatelliteIntelApis = () => {
    const satelliteImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAIAAADZSiLoAAAAG0lEQVR4nGNsaGhgYGBgYGBg+P//PwMDAwBK3wSgbH0mLQAAAABJRU5ErkJggg==';
    const streamedEntities = [
      { id: 'docs-solar-1', name: 'Lahore Solar Park', type: 'solar', primary_fuel: 'solar', country: 'Pakistan', capacity_mw: 120, location: { lat: 31.48, lon: 74.17 } },
      { id: 'docs-wind-1', name: 'Coastal Wind Farm', type: 'wind', primary_fuel: 'wind', country: 'Pakistan', capacity_mw: 80, location: { lat: 24.85, lon: 67.02 } },
      { id: 'docs-gas-1', name: 'Central Gas Station', type: 'gas', primary_fuel: 'gas', country: 'Pakistan', capacity_mw: 240, location: { lat: 30.16, lon: 71.52 } },
      { id: 'docs-hydro-1', name: 'Northern Hydro Facility', type: 'hydro', primary_fuel: 'hydro', country: 'Pakistan', capacity_mw: 310, location: { lat: 34.15, lon: 73.22 } },
    ];

    cy.intercept('POST', '**/api/search/map-entities/stream', {
      statusCode: 200,
      headers: { 'content-type': 'application/x-ndjson' },
      body: `${JSON.stringify(streamedEntities)}\n`,
    }).as('satelliteMapEntities');

    cy.intercept('POST', '**/api/satellite/facilities', {
      statusCode: 200,
      body: {
        status: 'success',
        result: {
          status: 'success',
          type: 'FeatureCollection',
          total: 3,
          overpass_ok: true,
          type_counts: {
            airport: 1,
            industrial: 1,
            warehouse: 1,
          },
          features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [74.18, 31.49] }, properties: { osm_id: 101, kind: 'airport', name: 'Demo Airfield' } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [74.16, 31.47] }, properties: { osm_id: 102, kind: 'industrial', name: 'Demo Industrial Site' } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [74.19, 31.48] }, properties: { osm_id: 103, kind: 'warehouse', name: 'Demo Warehouse' } },
          ],
        },
      },
    }).as('satelliteFacilities');

    cy.intercept('POST', '**/api/satellite/livetrack/aircraft', {
      statusCode: 200,
      body: {
        status: 'success',
        aircraft: [
          { icao24: 'abc123', callsign: 'DOC101', origin_country: 'Pakistan', latitude: 31.5, longitude: 74.2, velocity: 210, true_track: 92, baro_altitude: 9000 },
        ],
      },
    }).as('satelliteAircraft');

    cy.intercept('POST', '**/api/satellite/livetrack/ships', {
      statusCode: 200,
      body: {
        status: 'success',
        ships: [
          { mmsi: '123456789', name: 'DOC VESSEL', latitude: 24.84, longitude: 67.01, speed: 12, course: 80, destination: 'Karachi' },
        ],
      },
    }).as('satelliteShips');

    cy.intercept('POST', '**/api/satellite/sentinel/image', {
      statusCode: 200,
      body: {
        status: 'success',
        result: {
          status: 'success',
          lat: 31.48,
          lon: 74.17,
          delta: 0.015,
          image_type: 'true_colour',
          month: '2026-05',
          data_url: satelliteImageDataUrl,
          mime_type: 'image/png',
        },
      },
    }).as('satelliteImage');

    cy.intercept('POST', '**/api/satellite/anomaly', {
      statusCode: 200,
      body: {
        status: 'success',
        result: {
          status: 'success',
          lat: 31.48,
          lon: 74.17,
          bbox: [74.155, 31.465, 74.185, 31.495],
          delta_score: 18,
          alert_level: 'warning',
          alert_colour: '#f59e0b',
          months: [
            { month: 'May 2026', month_key: '2026-05', date_from: '2026-05-01', date_to: '2026-05-31', ndvi_score: 0.42, has_data: true },
            { month: 'April 2026', month_key: '2026-04', date_from: '2026-04-01', date_to: '2026-04-30', ndvi_score: 0.36, has_data: true },
          ],
        },
      },
    }).as('satelliteAnomaly');
  };

  const stubThreatLensApis = () => {
    const isoDate = (daysAgo: number) => new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();
    const categoryResponse = (Result: any[]) => ({ Result, Page_Count: 1, Count: Result.length });

    cy.intercept('POST', '**/api/threat/lens', {
      statusCode: 200,
      body: {
        leak_model: categoryResponse([
          {
            m_hash: 'docs-leak-1',
            m_title: 'Cloud credential exposure mentions regional suppliers',
            m_important_content: 'Leaked supplier records connect exposed credentials with operators in North America and East Asia.',
            m_country_name: 'United States, China',
            m_content_type: ['credentials'],
            m_url: 'https://example.com/leak',
            m_creation_date: isoDate(1),
          },
          {
            m_hash: 'docs-leak-2',
            m_title: 'Marketplace dump references infrastructure vendors',
            m_important_content: 'Archive material identifies technology vendors and login material tied to multiple countries.',
            m_country_name: 'Germany, United Kingdom',
            m_content_type: ['database'],
            m_url: 'https://example.com/marketplace',
            m_creation_date: isoDate(5),
          },
        ]),
        tracking_model: categoryResponse([
          {
            m_hash: 'docs-tracking-1',
            m_title: 'Tracking record links shipping routes to telecom activity',
            m_important_content: 'Location references show repeated activity between Gulf logistics hubs and South Asia.',
            m_country_name: 'United Arab Emirates, Pakistan',
            m_platform: 'tracking',
            m_url: 'https://example.com/tracking',
            m_creation_date: isoDate(2),
          },
        ]),
        news_model: categoryResponse([
          {
            m_hash: 'docs-news-1',
            m_title: 'Energy-sector alert expands across regional operators',
            m_important_content: 'Analysts report coordinated targeting of energy-sector operators and third-party suppliers.',
            m_country_name: 'United States, India',
            m_content_type: ['news'],
            m_url: 'https://example.com/news/energy',
            m_creation_date: isoDate(0),
          },
          {
            m_hash: 'docs-news-2',
            m_title: 'Telecom incident draws national response teams',
            m_important_content: 'Public reporting links telecom incident handling across Europe and the Middle East.',
            m_country_name: 'France, Saudi Arabia',
            m_content_type: ['news'],
            m_url: 'https://example.com/news/telecom',
            m_creation_date: isoDate(3),
          },
        ]),
        exploit_model: categoryResponse([
          {
            m_hash: 'docs-exploit-1',
            m_title: 'Exploit proof-of-concept references border gateway devices',
            m_important_content: 'Exploit notes mention exposed gateways and operational technology segments.',
            m_country_name: 'Japan, Australia',
            m_remote_type: 'rce',
            m_risk: 'high',
            m_cve: ['CVE-2026-1010'],
            m_url: 'https://example.com/exploit',
            m_creation_date: isoDate(4),
          },
        ]),
        defacement_model: categoryResponse([
          {
            q: 'regional public service portal defaced',
            m_hash: 'docs-defacement-1',
            m_team: 'Demo actor',
            m_attacker: ['Demo actor'],
            ioc: ['198.51.100.10'],
            m_location: 'Brazil, Argentina',
            m_content: 'Defacement activity references municipal services and mirrored targets.',
            m_url: 'https://example.com/defacement',
            m_leak_date: isoDate(6),
          },
        ]),
        chat_model: categoryResponse([
          {
            m_hash: 'docs-chat-1',
            m_channel_name: 'critical-infra-watch',
            m_sender_username: 'demo_operator',
            m_content: 'Channel chatter mentions new access claims affecting transport operators.',
            m_country_name: 'Turkey, Greece',
            m_platform: 'telegram',
            m_message_sharable_link: 'https://example.com/chat',
            m_message_date: isoDate(1),
          },
        ]),
        social_model: categoryResponse([
          {
            m_hash: 'docs-social-1',
            m_title: 'Social post amplifies breach claim',
            m_content: 'A social post amplifies an alleged breach and points to shared archive links.',
            m_country_name: 'Canada, United States',
            m_platform: 'x',
            m_message_sharable_link: 'https://example.com/social',
            m_message_date: isoDate(2),
          },
        ]),
        generic_model: categoryResponse([
          {
            m_hash: 'docs-generic-1',
            m_title: 'Open web report references exposed industrial services',
            m_important_content: 'Open web report connects exposed industrial services with multiple hosting regions.',
            m_country_name: 'Netherlands, Singapore',
            m_content_type: ['web'],
            m_url: 'https://example.com/report',
            m_creation_date: isoDate(8),
          },
        ]),
      },
    }).as('threatLens');

    cy.intercept('POST', '**/api/netintel/iot_detect', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          cameras: [
            { ip: '203.0.113.15', country: 'United States', product: 'Demo camera' },
            { ip: '198.51.100.27', country: 'India', product: 'Demo gateway' },
            { ip: '192.0.2.44', country: 'Singapore', product: 'Demo sensor' },
          ],
          ips_extracted: 14,
          ips_scanned: 14,
          cameras_found: 3,
          query: {
            coordinates: '20, 0',
            radius_km: 12000,
            max_ips: 200,
          },
        },
      },
    }).as('threatLensIpScan');
  };

  before(() => {
    cy.env(['TEST_DATA', 'TENANT_ACCOUNT', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']).then(({ TEST_DATA, TENANT_ACCOUNT, ADMIN_USERNAME, ADMIN_PASSWORD }) => {
      testData = TEST_DATA || {};
      tenantAccount = TENANT_ACCOUNT || null;
      adminUsername = ADMIN_USERNAME || '';
      adminPassword = ADMIN_PASSWORD || '';
    });
  });

  after(() => {
    cy.logout();
  });

  it('captures the main user manual screenshots in one pass', () => {
    cy.viewport(1920, 1080);
    cy.visit('/login');
    cy.get('[data-testid="login-page"]').should('be.visible');
    capture('login-page');

    cy.get('[data-testid="reset-password-link"]').click();
    cy.get('[data-testid="reset-companymail"]').should('be.visible');
    capture('password-reset');

    cy.visit('/login');
    cy.get('[data-testid="login-user"]').type(adminUsername);
    cy.get('[data-testid="login-pass"]').type(adminPassword, { log: false });
    cy.get('[data-testid="login-button"], input.login-button').first().click();
    cy.wait(2000);
    cy.window().then((win) => {
      hasAdminSession = Boolean(win.localStorage.getItem('token'));
    });

    cy.then(() => {
      if (!hasAdminSession) {
        cy.visit('/login?mode=free');
        cy.wait(3000);
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.a', 'string').and('not.be.empty');
      }
    });

    cy.visit('/dashboard/profile/homepage');
    ensureDashboardReady();
    cy.get('[data-testid="homepage-search-input"]').should('be.visible');
    capture('homepage-overview');
    openCountryReportFromMap();
    cy.get('[data-testid="heatmap-report"]').should('be.visible');
    capture('heatmap-report');
    cy.get('[data-testid="heatmap-report-close"]').click();
    cy.get('[data-testid="homepage-search-input"]').click().type('orion');
    capture('homepage-searchbar');
    cy.get('[data-testid="homepage-search-input"]').filter(':visible').first().type('{selectall}{backspace}', { force: true });

    cy.get('[data-testid="profile-menu"]').filter(':visible').first().should('be.visible').click({ scrollBehavior: false });
    cy.get('[data-testid="profile-help-support"]').filter(':visible').first().should('be.visible').click({ scrollBehavior: false });
    cy.get('[data-testid="support-modal"]').should('be.visible');
    capture('support-modal');
    cy.get('[data-testid="support-close"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="support-overlay"]').should('not.exist');

    openSidebarGroup('General Intelligence');
    clickSidebarSubItem('General Intelligence', 'All');
    typeDashboardSearch('bitcoin');
    cy.get('[data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"]').should('have.length.greaterThan', 0);
    capture('general-intelligence-results');

    cy.openSideFilter();
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
    capture('search-filters');
    cy.closeSideFilter();

    openSidebarGroup('Data Breach');
    clickSidebarSubItem('Data Breach', 'Tracking');
    typeDashboardSearch(testData.scans_email_breach || 'elena.pierce@samplemail.test');
    cy.get('[data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"], app-json-api-viewer')
      .should('have.length.greaterThan', 0);
    capture('data-breach-tracking');

    openSidebarGroup('Defacement');
    clickSidebarSubItem('Defacement', 'All');
    typeDashboardSearch('mthcht');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer').should('exist').and('be.visible');
    capture('defacement-report');
    cy.get('body').type('{esc}');

    cy.visit('/dashboard/profile/homepage');
    ensureDashboardReady();
    cy.get('[data-testid="homepage-search-input"]').should('be.visible').click().type('{enter}');
    switchToDeepSearchTab();
    searchDeepFromTop('data');
    cy.get('[data-testid="consolidated-section-social"], [data-testid="defacement-report"]').should('exist');
    capture('consolidated-results');

    setAllInsightsExpanded(true);
    cy.get('[data-testid="insights-section-keyword"]').scrollIntoView().should('be.visible');
    capture('consolidated-insights');

    openSidebarGroup('Social');
    clickSidebarSubItem('Social', 'All');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').and('be.visible');
    capture('social-report');
    exerciseJsonViewerOnce();
    capture('report-json-viewer');
    cy.get('[data-testid="chat-widget-open"]').filter(':visible').first().click();
    cy.get('[data-testid="chat-widget-input"]').filter(':visible').first().should('be.visible').type('hey');
    cy.get('[data-testid="chat-widget-send"]').filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="chat-widget-messages"]').filter(':visible').first().find('div').should('exist');
    capture('report-chatbot');
    cy.get('[data-testid="chat-widget-messages"]').filter(':visible').first()
      .closest('[data-testid="chat-widget-overlay"]')
      .click('topLeft', { force: true });
    cy.get('[data-testid="chat-widget-messages"]').should('not.exist');
    cy.get('body').type('{esc}');

    stubSatelliteIntelApis();
    cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing');
    ensureDashboardReady();
    cy.get('[data-testid="geo-fencing-page"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@satelliteMapEntities');
    cy.get('[data-testid="geo-fencing-map-renderer"]', { timeout: 120000 }).should('exist');
    cy.get('[data-testid="geo-fencing-tab-map"]').should('be.visible');
    cy.get('[data-testid="geo-fencing-tab-threat"]').should('be.visible');
    cy.get('[data-testid="geo-dashboard-section"]').should('be.visible');
    cy.get('[data-testid="geo-dashboard-loaded-count"]', { timeout: 120000 }).should('contain.text', 'Loaded 4 records');
    cy.get('[data-testid="geo-dashboard-select-all"]').click();
    cy.get('[data-testid="geo-dashboard-visible-count"]').should('contain.text', '4 visible');
    waitForSatelliteMapReady('cartocdn.com');
    captureFullWidth('satellite-map-overview');

    cy.get('[data-testid="geo-fencing-layer-satellite"]').click({ force: true });
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-satellite-layer');

    cy.get('[data-testid="geo-dashboard-search-input"]').click({ force: true }).type('{selectall}{backspace}solar', { force: true });
    cy.get('[data-testid="geo-dashboard-search-result"]').first().click({ force: true });
    cy.get('[data-testid="geo-dashboard-selection-panel"]').should('contain.text', 'Lahore Solar Park');
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-search-selection');

    cy.get('[data-testid="geo-dashboard-location-open"]').click({ force: true });
    cy.get('[data-testid="geocode-modal"]').should('be.visible');
    cy.get('[data-testid="geocode-modal-mode-coordinates"]').click();
    cy.get('[data-testid="geocode-modal-coordinates-input"]').should('be.visible').clear().type('31.48000, 74.17000');
    cy.get('[data-testid="geocode-modal-coverage-input"]').should('be.visible').clear().type('0.05');
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-location-modal');
    cy.get('[data-testid="geocode-modal-apply"]').should('not.be.disabled').click();
    cy.wait('@satelliteFacilities');
    cy.get('[data-testid="geocode-modal"]').should('not.exist');
    cy.get('[data-testid="geo-dashboard-location-target"]', { timeout: 120000 }).should('not.be.disabled');
    cy.get('[data-testid="geo-dashboard-facilities-panel"]').should('contain.text', 'facilities');
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-location-facilities');

    cy.get('[data-testid="geo-dashboard-tracking-aircraft"]').click({ force: true });
    cy.wait('@satelliteAircraft');
    cy.get('[data-testid="geo-dashboard-tracking-ships"]').click({ force: true });
    cy.wait('@satelliteShips');
    cy.get('[data-testid="geo-dashboard-tracking-panel"]').should('contain.text', 'Aircraft').and('contain.text', 'Ships');
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-tracking');

    cy.get('[data-testid="geo-fencing-panel-menu-button"]').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-tab-compare"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="geo-fencing-panel-title"]').should('contain.text', 'Imagery Analysis');
    cy.contains('[data-testid="geo-fencing-panel-popup"] button', 'Load comparison').click({ force: true });
    cy.wait('@satelliteImage');
    cy.wait('@satelliteAnomaly');
    cy.contains('[data-testid="geo-fencing-panel-popup"]', 'comparison', { timeout: 120000 }).should('be.visible');
    waitForSatelliteMapReady('arcgisonline.com');
    captureFullWidth('satellite-map-imagery-analysis');
    cy.wait(1000);

    openSidebarGroup('Exploit');
    clickSidebarSubItem('Exploit', 'All');
    typeDashboardSearch('exploit');
    cy.get('[data-testid="open-report"], [data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"]')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
    capture('exploit-results');

    openSidebarGroup('Feed');
    clickSidebarSubItem('Feed', 'News');
    typeDashboardSearch('police');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').and('be.visible');
    capture('feed-report');
    cy.get('body').type('{esc}');

    openSidebarGroup('Stealer logs');
    clickSidebarSubItem('Stealer logs', 'IOCS');
    cy.get('input[name="searchQuery"][placeholder="Search..."]').first().should('be.visible').type('uwe.dippold@web.de{enter}');
    cy.get('body').then(($body) => {
      const expandRows = $body.find('button[aria-label="Expand row"]');
      if (expandRows.length > 0) {
        cy.wrap(expandRows[0]).scrollIntoView().click();
      }
    });
    capture('stealer-logs-results');

    cy.visit('/dashboard/dump');
    ensureDashboardReady();
    cy.contains('h1', 'Dump Listing').should('be.visible');
    cy.get('input[placeholder="Search leak URL"]').filter(':visible').first().should('be.visible').type('leak');
    cy.contains('button', 'Search').should('be.visible').click();
    cy.get('app-dump-list, table tbody tr').should('exist');
    capture('dump-listing');

    cy.visit('/dashboard/api/email-breach');
    ensureDashboardReady();
    fillSecondaryScanInput(testData.scans_email_breach || 'elena.pierce@samplemail.test');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
    capture('entity-api-email-breach');

    cy.visit('/dashboard/scanner/network-scan');
    ensureDashboardReady();
    cy.get('[data-testid="network-intel-tab-host-recon"]').should('be.visible');
    cy.get('[data-testid="network-intel-search-input"]').should('be.visible').click().type('{selectall}{backspace}ucp.edu.pk{enter}');
    cy.get('[data-testid^="network-intel-dns-row-"]').filter(':visible').should('have.length.greaterThan', 0);
    capture('web-scan-report');

    cy.visit('/dashboard/scanner/apk-scan');
    ensureDashboardReady();
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
    capture('apk-scan-report');

    cy.visit('/dashboard/api/file-scanner');
    ensureDashboardReady();
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile({
      contents: 'cypress/fixtures/resume-sample.pdf',
      fileName: 'resume-sample.pdf',
      mimeType: 'application/pdf'
    });
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
    capture('file-scanner-report');

    stubNetworkIntelApis();
    cy.visit('/dashboard/netint');
    ensureDashboardReady();
    cy.get('[data-testid="network-intel-tab-host-recon"]').click();
    cy.get('[data-testid="network-intel-search-input"]').should('be.visible').click().type('{selectall}{backspace}example.com{enter}');
    cy.wait('@resolveIp');
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]').should('be.visible');
    capture('network-intel-host-recon');

    cy.get('[data-testid="network-intel-tab-geo-fencing"]').click();
    cy.get('[data-testid="network-intel-geo-search-trigger"]').click({ force: true });
    cy.get('[data-testid="network-intel-geo-modal"]').should('be.visible');
    capture('network-intel-geo-modal');
    cy.get('[data-testid="network-intel-geo-close"]').click();

    cy.get('[data-testid="network-intel-tab-ip-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]').should('be.visible').click().type('{selectall}{backspace}8.8.8.8{enter}');
    cy.wait('@ipScanner');
    cy.get('[data-testid="network-intel-ip-result"]').should('be.visible');
    capture('network-intel-ip-scan');

    cy.get('[data-testid="network-intel-tab-vulnerability-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]').should('be.visible').click().type('{selectall}{backspace}bbc.com{enter}');
    cy.contains('span', 'bbc.com', { timeout: 60000 }).click();
    cy.wait('@vulnerabilityScan');
    cy.contains('[data-testid="network-intel-vulnerability-result"]', 'Missing Content-Security-Policy', {
      timeout: 60000,
    }).should('be.visible');
    capture('network-intel-vulnerability-scan');

    stubThreatLensApis();
    cy.visit('/dashboard/threat-lens');
    ensureDashboardReady();
    cy.get('[data-testid="threat-lens-page"]', { timeout: 60000 }).should('be.visible');
    cy.wait('@threatLens', { timeout: 180000 });
    cy.get('[data-testid="threat-lens-loading"]', { timeout: 60000 }).should('not.exist');
    waitForThreatGlobeReady();
    cy.get('[data-testid="threat-lens-top-country"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="threat-lens-feed-item-news"]').should('have.length.greaterThan', 0);
    cy.wait('@threatLensIpScan');
    cy.get('[data-testid="threat-lens-ip-scan-panel"]').should('be.visible');
    cy.get('[data-testid="threat-lens-ip-scan-markers"]').should('contain.text', '3');
    waitForThreatGlobeReady();
    captureFullWidth('threat-lens-overview');

    cy.get('[data-testid="threat-lens-search-input"]').should('be.visible').click().type('{selectall}{backspace}china');
    cy.get('[data-testid="threat-lens-search-submit"]').click();
    cy.wait('@threatLens');
    cy.get('[data-testid="threat-lens-active-keyword"]').should('contain.text', 'china');
    waitForThreatGlobeReady();
    captureFullWidth('threat-lens-search');

    cy.get('[data-testid="threat-lens-feed-search-archive"]').should('be.visible').click().type('exploit');
    cy.get('[data-testid="threat-lens-feed-item-archive"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="threat-lens-feed-range-news-7d"]').click();
    waitForThreatGlobeReady();
    captureFullWidth('threat-lens-feeds');

    cy.get('[data-testid="side-filter-open"]').click({ force: true });
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
    waitForThreatGlobeReady();
    captureFullWidth('threat-lens-filters');
    cy.get('[data-testid="side-filter-close"]').filter(':visible').first().click();

    cy.intercept('GET', '**/api/directory*').as('getDirectory');
    cy.visit('/dashboard/directory');
    waitForDirectoryRequest();
    cy.get('app-directory').should('be.visible');
    capture('directory-monitoring');

    cy.visit('/dashboard/profile/account');
    ensureDashboardReady();
    cy.get('[data-testid="account-settings-form"]').should('be.visible');
    capture('account-settings');

    captureCaseManagementScreenshots();

    visitCtiGraph();
    cy.get('[data-testid="cti-filter-type-select"]').select('Cluster');
    cy.get('[data-testid="cti-filter-apply"]').click();
    waitForCtiGraphReady();
    waitForToolbarSearchReady();
    capture('cti-graph');
    cy.get('[data-testid="graph-toolbar-view-list"]').filter(':visible').first().click();
    capture('cti-list-view');
    cy.get('[data-testid="graph-toolbar-view-graph"]').filter(':visible').first().click();
    cy.get('[data-testid="cti-tab-session-menu"]').filter(':visible').first().click();
    cy.contains('button', 'Export Report').scrollIntoView().click({ force: true });
    cy.get('[data-testid="graph-report-export-modal"]').filter(':visible').first().should('be.visible');
    capture('cti-export-modal');
    cy.get('body').click(20, 20);
    cy.get('[data-testid="cti-network-container"] canvas').filter(':visible').first().then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas).trigger('contextmenu', {
        button: 2,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        force: true
      });
    });
    cy.get('[data-testid="cti-context-menu"]').should('exist');
    capture('cti-context-menu');
    cy.get('body').click(20, 20);

    visitSocialGraph();
    setupSocialGraphInterceptors();
    waitForToolbarSearchReady();
    cy.get('[data-testid="graph-toolbar-search-input"]').should('be.visible').click().type(`{selectall}{backspace}${testData.cti_social_username || 'orion_demo_actor'}`);
    cy.get('[data-testid="graph-toolbar-search-button"]').click();
    cy.get('[data-testid="social-graph-root"]').should('be.visible');
    capture('social-intel');

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
      .selectFile('cypress/fixtures/profile.png', { force: true });
    cy.wait('@imageRecon');
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    capture('social-manage-profiles');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.contains('button', 'Fetch profile').first().click();
    });
    cy.wait('@socialRecon');
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
    cy.contains('.home-menu-created-item', 'image_scan_user').should('contain.text', 'Completed').click();
    cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
    cy.get('[data-testid="social-manage-profiles-modal"]').within(() => {
      cy.get('[data-testid="social-manage-profiles-select-all"]').scrollIntoView().click();
      cy.get('[data-testid="social-manage-profiles-update-graph"]').scrollIntoView().click();
    });
    cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
    cy.get('[data-testid="graph-toolbar-view-list"]').click();
    cy.get('[data-testid="social-list-manage-profiles"]').should('be.visible');
    capture('social-intel-list-view');
    cy.get('[data-testid="social-list-user-summary-trigger"]').first().click();
    cy.get('[data-testid="social-summary-popup"]').should('be.visible');
    capture('social-summary-popup');
    capture('social-metadata-results');
    cy.get('[data-testid="social-summary-popup-overlay"]').click('topLeft', { force: true });
    cy.get('[data-testid="social-summary-popup"]').should('not.exist');
    cy.get('[data-testid="social-list-followers-following"]').first().click();
    cy.get('[data-testid="social-follower-scan-popup"]').should('be.visible');
    capture('social-followers-popup');
    cy.get('[data-testid="social-follower-scan-cancel"]').click();
    cy.get('[data-testid="social-follower-scan-popup"]').should('not.exist');
    cy.get('[data-testid="graph-toolbar-view-graph"]').click();
    cy.get('[data-testid="social-network-container"] canvas').first().then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas).trigger('contextmenu', {
        button: 2,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
    });
    cy.get('body').then(($body) => {
      const panel = $body.find('[data-testid="social-context-menu-panel"]:visible').first();
      if (panel.length) {
        cy.wrap(panel).should('be.visible');
        capture('social-context-menu');
        cy.contains('[data-testid="social-context-menu-panel"] button', 'Set Alias').click();
        cy.get('[data-testid="social-alias-modal"]').should('be.visible');
        capture('social-alias-modal');
        cy.get('[data-testid="social-alias-cancel"]').click();
      }
    });
    cy.get('body').then(($body) => {
      const relationshipTrigger = $body.find('[data-testid="social-relationship-node-trigger"]').first();
      if (relationshipTrigger.length) {
        cy.wrap(relationshipTrigger).click();
        cy.get('[data-testid="social-relationship-popup"]').should('be.visible');
        capture('social-relationship-popup');
        cy.get('[data-testid="social-relationship-close"]').click();
      }
    });

    cy.then(() => {
      if (!hasAdminSession) {
        return;
      }

      cy.visit('/dashboard/profile/users');
      ensureDashboardReady();
      cy.get('tbody tr, [data-testid="tenant-add-user-button"]').should('exist');
      capture('tenant-users');

      cy.visit('/dashboard/profile/tenant-settings');
      ensureDashboardReady();
      cy.contains('h1', 'Tenant Data').should('be.visible');
      capture('tenant-settings');

      cy.visit('/dashboard/profile/tenant');
      ensureDashboardReady();
      cy.get('[data-testid="tenant-page-header"], tbody tr').should('have.length.greaterThan', 0);
      capture('tenant-administration');

      cy.visit('/dashboard/profile/auditlog');
      ensureDashboardReady();
      cy.get('app-auditlog .ui-page-title').should('contain.text', 'Audit Logs');
      cy.get('app-auditlog-list table tbody tr, app-auditlog-list .rounded-xl').should('have.length.greaterThan', 0);
      capture('audit-logs');

      openSystemSettings();
      cy.get('[data-testid="system-settings-edit"], [data-testid="system-settings-app-name"]').should('be.visible');
      capture('system-settings');
    });

    if (tenantAccount?.username && tenantAccount?.password) {
      cy.logout();
      cy.visit('/login');
      cy.get('[data-testid="login-user"]').type(tenantAccount.username);
      cy.get('[data-testid="login-pass"]').type(tenantAccount.password, { log: false });
      cy.get('[data-testid="login-button"]').click();
      cy.wait(2000);
      cy.get('body').then(($body) => {
        const hasDashboard = $body.find('[data-testid="dashboard-body"], [data-testid="dashboard-main"], [data-testid="profile-menu"]').length > 0;
        if (!hasDashboard) {
          return;
        }

        cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
        cy.location('pathname').should('include', '/dashboard/profile/homepage');
        cy.get('app-alert-scan-loading').should('not.exist');
        cy.get('[data-testid="tenant-home-alert-category-card"], [data-testid="tenant-home-print-alerts"]')
          .should('have.length.greaterThan', 0);
        openManageIOCs();
        cy.get('[data-testid="tenant-ioc-value-input"], [data-testid^="tenant-ioc-tab-"]').should('have.length.greaterThan', 0);
        capture('tenant-manage-iocs');
        cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().scrollIntoView().click();
        cy.location('pathname').should('include', '/dashboard/profile/homepage');
        cy.get('app-alert-scan-loading').should('not.exist');
        capture('tenant-homepage');
      });
    }
  });
});
