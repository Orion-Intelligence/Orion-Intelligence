import {DOMAIN_SCANNER_TEST_DOMAINS} from '../support/constants';
import {deleteAllEnabledIocAdvancedFilters} from './controllers/13-consolidated.controller';

let testData: any = {};
const DOMAIN_SCANNER_MODAL_TIMEOUT = 90000;
const DOMAIN_SCANNER_SELECTOR = '[data-testid="domain-scanner-modal"]';

const ensureDomainScannerModalOpen = () => {
  cy.get('body', {timeout: 30000}).then(($body) => {
    if ($body.find(`${DOMAIN_SCANNER_SELECTOR}:visible`).length > 0) {
      return;
    }
    cy.get('[data-testid="consolidated-open-domain-scanner"]', {timeout: 30000})
      .scrollIntoView()
      .should('be.visible')
      .click();
  });
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('be.visible');
};

describe('Consolidated - IOC Advanced Builder Flow', () => {
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

  it('opens Homepage and runs consolidated search', () => {
    cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().should('be.visible').click();
    cy.get('[data-testid="homepage-search-input"]', {timeout: 30000}).should('be.visible').click().type('{enter}');
  });

  it('opens IOCs, searches credentials, and runs advanced filter operations', () => {
    cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().should('be.visible').click();
    cy.get('[data-testid="homepage-search-input"]', {timeout: 30000}).should('be.visible').click().type('{enter}');
    cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="ioc-basic-search-input"]', {timeout: 30000}).should('be.visible').clear().type(`gmail.com || ${testData.consolidated_ioc_email}{enter}`);
    cy.wait(1000);
    cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000}).click();
    cy.get('[data-testid="ioc-adv-row"]', {timeout: 20000}).first().should('be.visible');
    cy.get('[data-testid="ioc-adv-tag-select"]').first().select('Email');
    cy.get('[data-testid="ioc-adv-value-input"]').first().clear().type(testData.consolidated_advanced_email);
    cy.get('[data-testid="ioc-adv-execute"]').should('be.visible').click();
    cy.get('[data-testid="ioc-adv-add-filter"]').last().click();
    cy.get('[data-testid="ioc-adv-row"]').last().within(() => {
      cy.get('[data-testid="ioc-adv-tag-select"]').select('Email');
      cy.get('[data-testid="ioc-adv-value-input"]').type(testData.consolidated_domain_query);
    cy.get('[data-testid="ioc-adv-operator-select"]').first().select('OR');
    });
    cy.get('[data-testid="ioc-adv-execute"]').should('be.visible').click();
    deleteAllEnabledIocAdvancedFilters();
  });
});

describe('Consolidated - Domain Scanner Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens domain scanner and runs Subdomains, IP Lookup, and Wayback scans', () => {
    cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').click();
    cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().should('be.visible').click();
    cy.get('[data-testid="homepage-search-input"]', {timeout: 30000}).scrollIntoView().should('be.visible').type('{enter}');
    cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="consolidated-open-domain-scanner"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-tab-subdomains"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="domain-scanner-live-toggle"]').should('exist').parents('label').first().click();

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
    cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('be.visible').click('topLeft');
  });
});
