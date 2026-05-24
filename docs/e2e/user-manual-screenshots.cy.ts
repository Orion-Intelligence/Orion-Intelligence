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
      const targetZoom = Math.min(1, Math.max(0.7, (viewportWidth - 24) / widestWidth));
      doc.body.style.zoom = `${targetZoom}`;
      doc.documentElement.style.zoom = `${targetZoom}`;
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
    cy.wait('@threatLens');
    cy.get('[data-testid="threat-lens-loading"]', { timeout: 60000 }).should('not.exist');
    cy.get('[data-testid="threat-lens-map-fallback"], [data-testid="threat-lens-map-renderer"]').should('exist');
    cy.get('[data-testid="threat-lens-top-country"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="threat-lens-feed-item-news"]').should('have.length.greaterThan', 0);
    cy.wait('@threatLensIpScan');
    cy.get('[data-testid="threat-lens-ip-scan-panel"]').should('be.visible');
    cy.get('[data-testid="threat-lens-ip-scan-markers"]').should('contain.text', '3');
    capture('threat-lens-overview');

    cy.get('[data-testid="threat-lens-search-input"]').should('be.visible').click().type('{selectall}{backspace}china');
    cy.get('[data-testid="threat-lens-search-submit"]').click();
    cy.wait('@threatLens');
    cy.get('[data-testid="threat-lens-active-keyword"]').should('contain.text', 'china');
    capture('threat-lens-search');

    cy.get('[data-testid="threat-lens-feed-search-archive"]').should('be.visible').click().type('exploit');
    cy.get('[data-testid="threat-lens-feed-item-archive"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="threat-lens-feed-range-news-7d"]').click();
    capture('threat-lens-feeds');

    cy.get('[data-testid="side-filter-open"]').should('be.visible').click();
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
    capture('threat-lens-filters');
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
