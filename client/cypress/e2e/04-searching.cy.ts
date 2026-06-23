import {clickOpenDefacementReport, clickOpenExploitReport, clickOpenReport, clickSidebarSubItem, exerciseJsonViewerOnce, openFirstReportAndValidateNavigationOrModal, openSidebarGroup, typeDashboardSearchSlow, typeInputSlow, waitForSearchReady} from './controllers/04-searching.controller';

describe('Orion Intelligence - Search Navigation and Report Access', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs General Intelligence search flow for All, General, and Forums', () => {
    openSidebarGroup('General Intelligence');
    typeDashboardSearchSlow('bitcoin');
    openFirstReportAndValidateNavigationOrModal();

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

  it('runs Social search flow for All, Twitter, Mastodon, Pastebin, Forum, and Reddit', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Social');
    clickSidebarSubItem('Social', 'All');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);


    cy.scrollDashboardToTop()

    clickSidebarSubItem('Social', 'Twitter');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Mastodon');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Pastebin');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Forum');
    typeDashboardSearchSlow('a');
    clickOpenReport();
    cy.get('app-json-api-viewer').should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname').should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Reddit');
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
  });

  it('runs Stealer logs IOCS search flow and expands a row', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Stealer logs');
    cy.get('input[name="searchQuery"][placeholder="Search..."]').first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');

    waitForSearchReady();
    typeInputSlow('@q', 'uwe.dippold@web.de');
    cy.get('button[aria-label="Expand row"]').should('have.length.greaterThan', 0).first().scrollIntoView().click();
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
    clickSidebarSubItem('Profile', 'Event Management');
    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');

    typeInputSlow('[data-testid="ioc-basic-search-input"]', '10.10.0.9');

    cy.get('app-loading-form', { timeout: 60000 }).should('not.exist');

    cy.get('[data-testid="siem-log-row"]', { timeout: 60000 }).filter(':visible').should('have.length.at.least', 1).first().as('firstSiemRow');

    cy.get('@firstSiemRow').should('contain.text', '10.10.0.9');

    cy.get('[data-testid="siem-log-row-toggle"]').filter(':visible').first().scrollIntoView().click();

    cy.contains('Dummy SIEM log record', { timeout: 60000 }).should('be.visible');
    cy.contains('10.10.0.9', { timeout: 60000 }).should('be.visible');
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
    typeInputSlow('@scanInput', 'bbc.com');

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
