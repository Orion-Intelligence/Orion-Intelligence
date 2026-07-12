import {clickOpenDefacementReport, clickOpenExploitReport, clickOpenReport, exerciseJsonViewerOnce, openFirstReportAndValidateNavigationOrModal, openSidebarGroup, typeDashboardSearchSlow, typeInputSlow, waitForSearchReady} from './controllers/04-searching.controller';
import {clickSidebarSubItem} from './controllers/03-flow.controller';

describe('Orion Intelligence - Search Navigation and Report Access', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  beforeEach(() => cy.intercept('GET', '**/assets/data/entities_data/entity_filter_suggestions.json', { statusCode: 200, body: {} }));

  after(() => {
    cy.logout();
  });

  it('runs General Intelligence search flow for All, General, and Forums', () => {
    openSidebarGroup('General Intelligence');
    typeDashboardSearchSlow('bitcoin');
    cy.get('[data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"]').should('have.length.greaterThan', 0);
    cy.docsScreenshot('general-intelligence-results');
    cy.openSideFilter();
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
    cy.docsScreenshot('search-filters');
    cy.closeSideFilter();
    openFirstReportAndValidateNavigationOrModal();
    cy.docsScreenshot('report-json-viewer');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/strategic/general');
    typeDashboardSearchSlow('bitcoin');
    openFirstReportAndValidateNavigationOrModal();

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/strategic/forums');
    typeDashboardSearchSlow('bitcoin');
    openFirstReportAndValidateNavigationOrModal();
  });

  it('runs Defacement search flow for All, Hacked, Phishing, and Databases', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Defacement');
    typeDashboardSearchSlow('mthcht');
    clickOpenDefacementReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.docsScreenshot('defacement-report');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/defacement/hacked');
    typeDashboardSearchSlow('ASTAR');
    clickOpenDefacementReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/defacement/phishing');
    typeDashboardSearchSlow('mthcht');
    clickOpenDefacementReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/defacement/databases');
    typeDashboardSearchSlow('urldna_bot');
    clickOpenDefacementReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });

  it('runs Data Breach tracking search flow', () => {
    cy.loginAsAdmin();
    cy.visit('/dashboard/breach/tracking?page=1');
    waitForSearchReady();
    typeDashboardSearchSlow('elena.pierce@samplemail.test');
    cy.get('[data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"], app-json-api-viewer')
      .should('have.length.greaterThan', 0);
    cy.docsScreenshot('data-breach-tracking');
  });

  it('runs Social search flow for All, Twitter, Mastodon, Pastebin, Forum, and Reddit', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Social');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.docsScreenshot('social-report');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);


    cy.scrollDashboardToTop()

    cy.visit('/dashboard/social/twitter');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/social/mastodon');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/social/pastebin');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/social/forum');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/social/reddit');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });

  it('runs Exploit search flow for All, CVE, Tools, and ZeroDay', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Exploit');
    typeDashboardSearchSlow('exploit');
    clickOpenExploitReport();
    cy.docsScreenshot('exploit-results');

    cy.get('[data-testid="dashboard-header-back"]').click();
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/exploit/cve');
    typeDashboardSearchSlow('cve');
    clickOpenExploitReport();


    cy.get('[data-testid="dashboard-header-back"]').click();
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/exploit/tools');
    typeDashboardSearchSlow('tool');
    clickOpenExploitReport();

    cy.get('[data-testid="dashboard-header-back"]').click();
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    cy.visit('/dashboard/exploit/zeroday');
    typeDashboardSearchSlow('exploit');
    clickOpenExploitReport();

    cy.get('[data-testid="dashboard-header-back"]').click();
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    waitForSearchReady();
    cy.get('input[data-testid="dashboard-general-input"][name="q"]').first().should('exist');
  });

  it('runs Actors & Malware search flow', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Actors & Malware');
    waitForSearchReady();
    typeDashboardSearchSlow('malware');
    cy.get('[data-testid="apt-intel-result-card"], [data-testid="result-card"], tbody tr.cursor-pointer[id^="item-"]', { timeout: 60000 })
      .should('have.length.greaterThan', 0);
    cy.docsScreenshot('actors-malware-results');
  });

  it('runs Feed search flow and opens a report', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Feed');
    waitForSearchReady();
    cy.get('input[data-testid="dashboard-general-input"][name="q"]').first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');
    cy.get('@q').clear();

    waitForSearchReady();
    typeInputSlow('@q', 'police');
    clickOpenReport();
    exerciseJsonViewerOnce();
    cy.docsScreenshot('feed-report');
  });

  it('runs Stealer logs IOCS search flow and expands a row', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Stealer logs');
    cy.get('input[name="searchQuery"][placeholder="Search..."]').first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');

    waitForSearchReady();
    typeInputSlow('@q', 'uwe.dippold@web.de');
    cy.get('button[aria-label="Expand row"]').should('have.length.greaterThan', 0).first().scrollIntoView().click();
    cy.docsScreenshot('stealer-logs-results');
  });

  it('runs Stealer logs IOCS search with date filters', () => {
    cy.loginAsAdmin();

    cy.visit('/dashboard/stealerlogs/iocs?daterange=2025-01-01,2025-12-31');
    cy.location('search').then((search) => {
      expect(decodeURIComponent(search)).to.include('daterange=2025-01-01,2025-12-31');
    });
    waitForSearchReady();

    cy.get('[data-testid="ioc-basic-tag-m_email"]').filter(':visible').first().scrollIntoView().click();
    cy.get('input[name="searchQuery"][placeholder="Search..."]').first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');
    typeInputSlow('@q', 'uwe.dippold@web.de');

    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');
    cy.get('[data-testid="ioc-stealer-table"]').scrollIntoView().should('be.visible');

    cy.visit('/dashboard/stealerlogs/iocs?daterange=2026-01-01,2026-01-31');
    cy.location('search').then((search) => {
      expect(decodeURIComponent(search)).to.include('daterange=2026-01-01,2026-01-31');
    });
    waitForSearchReady();

    cy.get('[data-testid="ioc-basic-tag-m_email"]').filter(':visible').first().scrollIntoView().click();
    cy.get('input[name="searchQuery"][placeholder="Search..."]').first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');
    typeInputSlow('@q', 'ydt.sja@gail.ccmm');

    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');
    cy.get('[data-testid="ioc-stealer-table"]').scrollIntoView().should('be.visible');
  });

  it('runs Event Management search flow and reads the first record', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Profile');
    cy.get('[data-testid="sidebar-subitem-profile-monitoring"]').scrollIntoView().should('be.visible').click({ force: true });
    cy.get('[data-testid="monitoring-tab-event-management"]').should('be.visible').click();
    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');

    typeInputSlow('[data-testid="ioc-basic-search-input"]', '10.10.0.9');

    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');

    cy.get('[data-testid="siem-log-row"]', { timeout: 60000 }).filter(':visible').should('have.length.at.least', 1).first().as('firstSiemRow');

    cy.get('@firstSiemRow').should('contain.text', '10.10.0.9');

    cy.get('[data-testid="siem-log-row-toggle"]').filter(':visible').first().scrollIntoView().click();

    cy.contains('Dummy SIEM log record', { timeout: 60000 }).should('be.visible');
    cy.contains('10.10.0.9', { timeout: 60000 }).should('be.visible');
    cy.docsScreenshot('event-management-expanded-row');
  });

  it('runs Web Scans flow for Basic, Port, Repository, and SEO', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Web Scans');
    cy.get('[data-testid="network-intel-tab-host-recon"]').should('be.visible');
    cy.get('[data-testid="network-intel-search-input"][placeholder="Search domain..."]').first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    typeInputSlow('@scanInput', 'bbc.com');
    cy.docsScreenshot('web-scan-report');

    cy.get('button.ui-cred-toolbar-btn', { timeout: 60000 }).should('be.disabled');
    cy.get('[data-testid="network-intel-tab-ip-scan"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"][placeholder="Search IP..."]').first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    typeInputSlow('@scanInput', '8.8.8.8');

    cy.get('[data-testid="network-intel-tab-repository-scan"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"][placeholder="Search repository URL..."]').first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    typeInputSlow('@scanInput', 'https://github.com/juice-shop/juice-shop');

    cy.get('[data-testid="network-intel-tab-seo-scan"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"][placeholder="Search domain..."]').first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    typeInputSlow('@scanInput', 'bbc.com');
  });

  it('opens Playstore Scanner under Entity Lookup', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Entity Lookup');
    clickSidebarSubItem('Entity Lookup', 'Playstore Scanner');
  });

});
