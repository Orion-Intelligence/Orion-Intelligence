import { openSidebarGroup, clickSidebarSubItem, waitForDirectoryRequest } from '../../client/cypress/e2e/controllers/03-flow.controller';
import { typeDashboardSearch, clickOpenReport, exerciseJsonViewerOnce } from '../../client/cypress/e2e/controllers/04-searching.controller';
import { switchToDeepSearchTab, searchDeepFromTop, setAllInsightsExpanded } from '../../client/cypress/e2e/controllers/13-consolidated.controller';
import { fillPrimaryScanInput, fillSecondaryScanInput, clickSearch } from '../../client/cypress/e2e/controllers/14-scans-management.controller';
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
        app-scans-management,
        app-dump-list,
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

  const capture = (name: string, options: Partial<Cypress.ScreenshotOptions> = {}) => {
    applyScreenshotChrome();
    cy.wait(300);
    cy.screenshot(`user-manual/${name}`, {
      capture: 'viewport',
      overwrite: true,
      disableTimersAndAnimations: false,
      ...options,
    });
  };

  const ensureDashboardReady = () => {
    cy.get('[data-testid="dashboard-body"], [data-testid="dashboard-main"], [data-testid="profile-menu"]')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
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

    cy.contains('[data-cy="reset-password"], span.reset-password', 'Reset password?').click();
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
    cy.get('[data-testid="homepage-search-input"]').click().type('orion');
    capture('homepage-searchbar');
    cy.get('[data-testid="homepage-search-input"]').clear();

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
    cy.get('input[name="username"][placeholder="Search leak URL"]').first().should('be.visible').type('leak');
    cy.contains('button', 'Search').should('be.visible').click();
    cy.get('app-dump-list, table tbody tr').should('exist');
    capture('dump-listing');

    cy.visit('/dashboard/api/email-breach');
    ensureDashboardReady();
    fillSecondaryScanInput(testData.scans_email_breach || 'elena.pierce@samplemail.test');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
    capture('entity-api-email-breach');

    cy.visit('/dashboard/scanner/basic-scan');
    ensureDashboardReady();
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();
    cy.get('[data-testid="scan-security-posture"]').should('exist');
    capture('web-scan-report');

    stubNetworkIntelApis();
    cy.visit('/dashboard/netint');
    ensureDashboardReady();
    cy.get('[data-testid="network-intel-tab-host-recon"]').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('example.com{enter}');
    cy.wait('@resolveIp');
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]').should('be.visible');
    capture('network-intel-host-recon');

    cy.get('[data-testid="network-intel-open-geo"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]').should('be.visible');
    capture('network-intel-geo-modal');
    cy.get('[data-testid="network-intel-geo-close"]').click();

    cy.intercept('GET', '**/api/directory*').as('getDirectory');
    cy.visit('/dashboard/directory');
    waitForDirectoryRequest();
    cy.get('app-directory').should('be.visible');
    capture('directory-monitoring');

    cy.visit('/dashboard/profile/account');
    ensureDashboardReady();
    cy.get('[data-testid="account-settings-form"]').should('be.visible');
    capture('account-settings');

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
        capture('tenant-homepage');
      });
    }
  });
});
