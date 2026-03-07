export function deleteAllEnabledIocAdvancedFilters() {
  cy.get('[data-testid="ioc-adv-delete-filter"]').then(($allButtons) => {
    const $enabledButtons = $allButtons.filter(':enabled');

    if ($enabledButtons.length === 0) {
      return;
    }

    cy.wrap($enabledButtons[0]).scrollIntoView().should('be.visible').click();
    deleteAllEnabledIocAdvancedFilters();
  });
}

const DOMAIN_SCANNER_MODAL_TIMEOUT = 90000;
const DOMAIN_SCANNER_SELECTOR = '[data-testid="domain-scanner-modal"]';

export function openHomepageAndSearch(query = '{enter}') {
  cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').click();
  cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().should('be.visible').click();
  cy.get('[data-testid="homepage-search-input"]', {timeout: 30000}).should('be.visible').click().type(query);
}

export function switchToDeepSearchTab() {
  cy.get('[data-testid="consolidated-tab-deep-search"]', {timeout: 30000}).should('be.visible').click({force: true});
}

export function searchInDeepSearch(query: string) {
  cy.get('[data-testid="dashboard-general-input"]', {timeout: 30000}).should('be.visible').clear().type(`${query}{enter}`);
}

export function switchToIocsTab() {
  cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).should('be.visible').click({force: true});
}

export function searchInIocs(query: string) {
  cy.get('[data-testid="ioc-basic-search-input"]', {timeout: 30000}).should('be.visible').clear().type(`${query}{enter}`);
}

export function toggleIocAdvanced() {
  cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000}).should('be.visible').click({force: true});
}

export function ensureDomainScannerModalOpen() {
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
}

export function closeDomainScannerModalIfOpen() {
  cy.get('body', {timeout: 30000}).then(($body) => {
    if ($body.find(`${DOMAIN_SCANNER_SELECTOR}:visible`).length === 0) {
      return;
    }
    cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: 30000}).should('be.visible').click('topLeft');
    cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: 30000}).should('not.exist');
  });
}

export function openFirstReportAndGoBack() {
  cy.get('[data-testid="open-report"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().should('be.visible').click({force: true});
  cy.url({timeout: 30000}).should('include', '/dashboard/profile/consolidated');
  cy.go('back');
  cy.get('.ui-consolidated-main', {timeout: 30000}).should('exist');
}
