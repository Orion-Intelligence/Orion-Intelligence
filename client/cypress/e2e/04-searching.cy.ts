import {clickOpenReport, clickSidebarSubItem, exerciseJsonViewerOnce, openExploitSubmenu, openFirstReportAndValidateNavigationOrModal, openSidebarGroup, typeDashboardSearch, typeExploitSearch, waitForSearchReady} from './controllers/04-searching.controller';

describe('Orion Intelligence - Search Navigation and Report Access', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs General Intelligence search flow for All, General, and Forums', () => {
    openSidebarGroup('General Intelligence');
    clickSidebarSubItem('General Intelligence', 'All');
    typeDashboardSearch('bitcoin');
    openFirstReportAndValidateNavigationOrModal();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('General Intelligence', 'General');
    typeDashboardSearch('bitcoin');
    openFirstReportAndValidateNavigationOrModal();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('General Intelligence', 'Forums');
    typeDashboardSearch('bitcoin');
    openFirstReportAndValidateNavigationOrModal();
  });

  it('runs Defacement search flow for All, Hacked, Phishing, and Databases', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Defacement');
    clickSidebarSubItem('Defacement', 'All');
    typeDashboardSearch('mthcht');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Defacement', 'Hacked');
    typeDashboardSearch('ASTAR');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Defacement', 'Phishing');
    typeDashboardSearch('mthcht');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Defacement', 'Databases');
    typeDashboardSearch('urldna_bot');
    cy.get('tbody tr.cursor-pointer[id^="item-"]').filter(':visible').first().should('be.visible').scrollIntoView().click();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });

  it('runs Social search flow for All, Twitter, Mastodon, Pastebin, Forum, and Reddit', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Social');
    clickSidebarSubItem('Social', 'All');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);


    cy.scrollDashboardToTop()
    cy.get('[data-cy="top"]', { timeout: 20000 }).should('be.visible');

    clickSidebarSubItem('Social', 'Twitter');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Mastodon');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Pastebin');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Forum');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    clickSidebarSubItem('Social', 'Reddit');
    typeDashboardSearch('a');
    clickOpenReport();
    cy.get('app-json-api-viewer', {timeout: 30000}).should('exist').scrollIntoView().and('be.visible');
    cy.get('body').type('{esc}');
  });

  it('runs Exploit search flow for All, CVE, Tools, and ZeroDay', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Exploit');
    openExploitSubmenu('All');
    typeExploitSearch('exploit');
    clickOpenReport();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    openExploitSubmenu('CVE');
    typeExploitSearch('cve');
    cy.get('[data-testid="open-report"]', {timeout: 30000}).filter(':visible').filter(':has(img[src*="redirect.svg"])').first().scrollIntoView().should('be.visible').click();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    openExploitSubmenu('Tools');
    typeExploitSearch('tool');
    clickOpenReport();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    openExploitSubmenu('ZeroDay');
    typeExploitSearch('exploit');
    clickOpenReport();

    cy.go('back');
    cy.location('pathname', {timeout: 30000}).should('not.match', /\/dashboard\/[^/]+\/[^/]+\/[a-f0-9]{32,}/);

    waitForSearchReady();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000}).first().should('exist');
  });

  it('runs Feed search flow and opens a report', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Feed');
    waitForSearchReady();
    cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000}).first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');
    cy.get('@q').clear();

    waitForSearchReady();
    cy.get('@q').type('police{enter}');
    clickOpenReport();
    exerciseJsonViewerOnce();
  });

  it('runs Stealer logs IOCS search flow and expands a row', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Stealer logs');
    clickSidebarSubItem('Stealer logs', 'IOCS');
    cy.get('input[name="searchQuery"][placeholder="Search..."]', {timeout: 30000}).first().as('q');
    cy.get('@q').should('be.visible').and('not.be.disabled');

    waitForSearchReady();
    cy.get('@q').type('uwe.dippold@web.de{enter}');
    cy.get('button[aria-label="Expand row"]', {timeout: 30000}).should('have.length.greaterThan', 0).first().scrollIntoView().click();
  });

  it('runs Web Scans flow for Basic, Port, Repository, and SEO', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Web Scans');
    clickSidebarSubItem('Web Scans', 'Basic Scan');
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    cy.get('@scanInput').type('bbc.com');
    cy.contains('button', /^Search$/).should('be.visible').and('not.be.disabled').click();

    clickSidebarSubItem('Web Scans', 'Port Scan');
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    cy.get('@scanInput').type('bbc.com');
    cy.contains('button', /^Search$/).should('be.visible').and('not.be.disabled').click();

    clickSidebarSubItem('Web Scans', 'Repository Scan');
    cy.get('input[name="username"][placeholder="Repository"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    cy.get('@scanInput').type('bbc.com');
    cy.contains('button', /^Search$/).should('be.visible').and('not.be.disabled').click();

    clickSidebarSubItem('Web Scans', 'SEO Scan');
    cy.get('input[name="username"][placeholder="Domain"]', {timeout: 30000}).first().as('scanInput');
    cy.get('@scanInput').should('be.visible');
    cy.get('@scanInput').clear();
    waitForSearchReady();
    cy.get('@scanInput').type('bbc.com');
    cy.contains('button', /^Search$/).should('be.visible').and('not.be.disabled').click();
  });

  it('opens Playstore Scanner under Entity API', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Entity API');
    clickSidebarSubItem('Entity API', 'Playstore Scanner');
  });

  it('runs Dump Listing search flow', () => {
    cy.loginAsAdmin();
    openSidebarGroup('Dump');
    clickSidebarSubItem('Dump', 'Listing');
    cy.get('input[name="username"][placeholder="Search leak URL"]', {timeout: 30000}).first().as('leak');
    cy.get('@leak').should('be.visible');
    waitForSearchReady();
    cy.get('@leak').type('leak');
    cy.contains('button', 'Search').should('be.visible').click();
  });
});
