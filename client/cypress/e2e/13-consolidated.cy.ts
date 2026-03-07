import {DOMAIN_SCANNER_TEST_DOMAINS} from '../support/constants';
import {
  closeDomainScannerModalIfOpen,
  deleteAllEnabledIocAdvancedFilters,
  ensureDomainScannerModalOpen,
  openFirstReportAndGoBack,
  openHomepageAndSearch,
  searchInDeepSearch,
  searchInIocs,
  switchToIocsTab,
  switchToDeepSearchTab
} from './controllers/13-consolidated.controller';

describe('Consolidated - IOC Advanced Builder Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens consolidated checker and validates hacked/phishing categories', () => {
    openHomepageAndSearch('{enter}');
    switchToDeepSearchTab();
    searchInDeepSearch('data');
    cy.contains('.ui-consolidated-main', 'IP Threat Report', {timeout: 30000}).should('be.visible');
    cy.contains('.ui-consolidated-main div', /phishing/i, {timeout: 30000}).should('be.visible').click({force: true});

    searchInDeepSearch('chinafans');
    cy.contains('.ui-consolidated-main div', /hacked/i, {timeout: 30000}).should('be.visible').click({force: true});
  });

  it('opens all sections and validates threat actor and insight toggles', () => {
    openHomepageAndSearch('{enter}');
    switchToDeepSearchTab();
    searchInDeepSearch('data');
    cy.contains('.ui-result-card', 'Social', {timeout: 30000}).should('be.visible');
    openFirstReportAndGoBack();

    ['social', 'tracking', 'news', 'leak', 'exploit', 'generic'].forEach((section) => {
      cy.get('.ui-consolidated-main', {timeout: 30000}).contains(new RegExp(section, 'i')).should('be.visible');
    });

    cy.contains('.ui-consolidated-main', 'Search in Threat Actor', {timeout: 30000}).should('be.visible').click({force: true});
    cy.contains('.ui-consolidated-main', 'Search in Threat Actor').parents('.ui-consolidated-main').first().within(() => {
      cy.get('input[placeholder="Search..."]', {timeout: 30000}).should('be.visible').clear().type('Website');
      cy.contains('label', 'Email').find('input[type="radio"]').check({force: true});
      cy.contains('label', 'Name').find('input[type="radio"]').check({force: true});
      cy.contains('label', 'All').find('input[type="radio"]').check({force: true});
    });

    ['Emails', 'Domains', 'Country', 'URLs', 'CVE & CWE'].forEach((card) => {
      cy.contains('.ui-consolidated-main', card, {timeout: 30000})
        .should('be.visible')
        .parents('.ui-consolidated-main')
        .first()
        .find('img[alt="toggle icon"]')
        .first()
        .click({force: true});
    });

    ['Social Results', 'Tracking Results', 'News Results', 'Leak Results', 'Exploit Results', 'Generic Results'].forEach((sectionTitle) => {
      cy.contains('.ui-consolidated-main', sectionTitle, {timeout: 30000})
        .should('be.visible')
        .parents('.ui-consolidated-main')
        .first()
        .within(() => {
          cy.get('[data-testid="open-report"]').filter(':visible').first().scrollIntoView().should('be.visible').click({force: true});
        });
      cy.url({timeout: 30000}).should('include', '/dashboard/profile/consolidated');
      cy.go('back');
      switchToDeepSearchTab();
      searchInDeepSearch('data');
    });
  });

  it('opens IOCs, searches credentials, and runs advanced filter operations', () => {
    openHomepageAndSearch('{enter}');
    switchToIocsTab();
    searchInIocs('gmail.com || \nfloflick@gmx.de');
    cy.wait(1000);
    cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000}).click();
    cy.get('[data-testid="ioc-adv-row"]', {timeout: 20000}).first().should('be.visible');
    cy.get('[data-testid="ioc-adv-tag-select"]').first().select('Email');
    cy.get('[data-testid="ioc-adv-value-input"]').first().clear().type('uzzalsen2530@gmail.com');
    cy.get('[data-testid="ioc-adv-execute"]').should('be.visible').click();
    cy.get('[data-testid="ioc-adv-add-filter"]').last().click();
    cy.get('[data-testid="ioc-adv-row"]').last().within(() => {
      cy.get('[data-testid="ioc-adv-tag-select"]').select('Email');
      cy.get('[data-testid="ioc-adv-value-input"]').type('hotmail.com');
      cy.get('[data-testid="ioc-adv-operator-select"]').first().select('OR');
    });
    cy.get('[data-testid="ioc-adv-execute"]').should('be.visible').click();
    deleteAllEnabledIocAdvancedFilters();
  });

  it('triggers all IOC options and validates Stealers/Threats results deeply', () => {
    openHomepageAndSearch('{enter}');
    switchToIocsTab();

    ['All', 'Domain', 'Email', 'Credit Card', 'IP Address', 'All'].forEach((opt) => {
      cy.get('app-credentials-search-bar', {timeout: 30000})
        .contains('div.cursor-pointer', new RegExp(`^\\s*${opt}\\s*$`), {timeout: 30000})
        .should('be.visible')
        .click({force: true});
    });

    cy.get('app-credentials-search-bar').contains('label', /^Filter$/).should('be.visible').click({force: true});
    cy.get('[data-testid="side-filter-close"]', {timeout: 30000}).should('be.visible').click({force: true});

    searchInIocs('alexsssi');
    cy.contains('span', /^Stealers$/).should('be.visible');
    cy.get('.ui-ioc-table-shell').first().within(() => {
      cy.contains('div.truncate', 'alexsssi@scrypton.com', {timeout: 30000}).should('be.visible');
      cy.contains('div[role="row"]', 'alexsssi@scrypton.com', {timeout: 30000})
        .find('button[aria-label="Expand row"]')
        .first()
        .click({force: true});
    });

    searchInIocs('Luxembourg');
    cy.contains('span', /^Threats$/).should('be.visible');
    cy.get('.ui-ioc-table-shell').eq(1).within(() => {
      cy.get('div[role="row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
      cy.get('div[role="row"]').each(($row, index) => {
        if (index < 3) {
          cy.wrap($row).find('button[aria-label="Expand row"]').first().click({force: true});
        }
      });
    });
  });
});

describe('Consolidated - Domain Scanner Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    closeDomainScannerModalIfOpen();
    cy.logout();
  });

  it('opens domain scanner and runs Subdomains, IP Lookup, and Wayback scans', () => {
    openHomepageAndSearch('{enter}');
    switchToIocsTab();
    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-tab-subdomains"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="domain-scanner-live-toggle"]').should('exist').parents('label').first().click();
    cy.get('[data-testid="domain-scanner-input"]').scrollIntoView().should('be.visible').clear().type('abcderfghh');
    cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
    cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');

    DOMAIN_SCANNER_TEST_DOMAINS.forEach((d) => {
      cy.get('[data-testid="domain-scanner-input"]').scrollIntoView().should('be.visible').clear().type(d);
      cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
      cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');
    });

    cy.get('[data-testid="domain-scanner-tab-ip-lookup"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="domain-scanner-input"]').clear().type('1.1.1.1');
    cy.get('[data-testid="domain-scanner-lookup-ip"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
    cy.get('[data-testid="domain-scanner-lookup-ip"]', {timeout: 30000}).should('not.be.disabled');

    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-tab-wayback"]').scrollIntoView().should('be.visible').click();
    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-input"]', {timeout: 30000}).should('be.visible').clear().type('example.com');
    cy.get('[data-testid="domain-scanner-search-wayback"]').scrollIntoView().should('be.visible').click();
    closeDomainScannerModalIfOpen();
  });
});
