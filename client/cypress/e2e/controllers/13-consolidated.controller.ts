const DOMAIN_SCANNER_MODAL_TIMEOUT = 90000;
const DOMAIN_SCANNER_SELECTOR = '[data-testid="domain-scanner-modal"]';
const DOMAIN_SCANNER_TEST_DOMAINS = ['example.com', 'bbc.com', 'cnn.com'];
const DOMAIN_SCANNER_INPUT_SELECTOR = '[data-testid="domain-scanner-input"]';

function executeIocAdvancedSearch() {
  cy.get('[data-testid="ioc-adv-execute"]', {timeout: 30000})
    .filter(':visible')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .and('not.be.disabled')
    .click();
}

export function openHomepageAndSearch(query = '{enter}') {
  cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').click();
  cy.get('[data-testid="sidebar-subitem-profile-homepage"]', {timeout: 30000}).filter(':visible').first().should('be.visible').click();
  cy.get('[data-testid="homepage-search-input"]', {timeout: 30000}).should('be.visible').click().type(query);
}

export function switchToDeepSearchTab() {
  cy.get('[data-testid="consolidated-tab-deep-search"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
}

export function switchToIocsTab() {
  cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
}

export function searchInIocs(query: string) {
  cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).scrollIntoView().click();
  cy.get('[data-testid="side-filter-close"]', {timeout: 30000}).then(($closeButtons) => {
    const visibleClose = $closeButtons.filter(':visible').first();
    if (visibleClose.length) {
      cy.wrap(visibleClose).scrollIntoView().click();
    }
  });
  cy.get('[data-testid="dashboard-body"]', {timeout: 30000}).scrollTo('top', {ensureScrollable: false});
  cy.get('[data-testid="ioc-basic-search-input"]', {timeout: 30000})
    .should('have.length.at.least', 1)
    .then(($inputs) => {
      const visible = $inputs.filter(':visible');
      const target = visible.length ? visible[0] : $inputs[0];
      cy.wrap(target)
        .scrollIntoView()
        .should('exist')
        .click()
        .type('{selectAll}{backspace}');

      if (query && query.length > 0) {
        cy.wrap(target)
          .type(query, {delay: 0})
          .type('{enter}');
      } else {
        cy.wrap(target).type('{enter}');
      }
    });
}

export function ensureDomainScannerModalOpen() {
  cy.get(`[data-testid="consolidated-open-domain-scanner"], ${DOMAIN_SCANNER_SELECTOR}`, {timeout: 30000}).then(($els) => {
    const isModalVisible = $els.filter(`${DOMAIN_SCANNER_SELECTOR}:visible`).length > 0;
    if (!isModalVisible) {
      cy.get('[data-testid="consolidated-open-domain-scanner"]', {timeout: 30000})
        .scrollIntoView()
        .should('be.visible')
        .click({force: true});
    }
  });
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('exist');
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('be.visible');
}

export function openFirstReportAndGoBack() {
  cy.get('[data-testid="open-report"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().should('be.visible').click();
  cy.url({timeout: 30000}).should('include', '/dashboard/profile/consolidated');
  cy.get('[data-testid="dashboard-header-back"]', {timeout: 30000})
    .filter(':visible')
    .first()
    .scrollIntoView()
    .click();
  cy.get('[data-testid="consolidated-tab-deep-search"]', {timeout: 30000})
    .scrollIntoView()
    .should('be.visible')
    .click();
}

export function runDomainScannerFlow() {
  cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
  ensureDomainScannerModalOpen();
  cy.get('[data-testid="domain-scanner-tab-subdomains"]').scrollIntoView().should('be.visible').click();
  cy.get('[data-testid="domain-scanner-live-toggle"]').should('exist').parents('label').first().click();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type('abcderfghh');
  cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
  cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');

  DOMAIN_SCANNER_TEST_DOMAINS.forEach((domain) => {
    cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type(domain);
    cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
    cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');
  });

  cy.get('[data-testid="domain-scanner-tab-ip-lookup"]').scrollIntoView().should('be.visible').click();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).clear().type('1.1.1.1');
  cy.get('[data-testid="domain-scanner-lookup-ip"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
  cy.get('[data-testid="domain-scanner-lookup-ip"]', {timeout: 30000}).should('not.be.disabled');

  ensureDomainScannerModalOpen();
  cy.get('[data-testid="domain-scanner-tab-wayback"]').scrollIntoView().should('be.visible').click();
  ensureDomainScannerModalOpen();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR, {timeout: 30000}).should('be.visible').clear().type('example.com');
  cy.get('[data-testid="domain-scanner-search-wayback"]').scrollIntoView().should('be.visible').click();
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('exist').within(() => {
    cy.get('button[aria-label="Close"]').click({force: true});
  });
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('not.exist');
}

export function applyPasswordSchemeAndValidate() {
  cy.get('[data-testid="ioc-open-password-scheme"]', {timeout: 30000}).first().scrollIntoView().click();
  cy.get('[data-testid="password-scheme-modal"]', {timeout: 30000}).should('be.visible');
  cy.get('[data-testid="password-scheme-title"]', {timeout: 30000}).should('contain.text', 'Password Scheme Filter');

  cy.get('[data-testid="password-scheme-min-length"]', {timeout: 30000}).scrollIntoView().clear().type('8');
  cy.get('[data-testid="password-scheme-max-length"]', {timeout: 30000}).scrollIntoView().clear().type('24');
  cy.get('[data-testid="password-scheme-has-alphabets"]', {timeout: 30000}).scrollIntoView().check();
  cy.get('[data-testid="password-scheme-has-numbers"]', {timeout: 30000}).scrollIntoView().check();
  cy.get('[data-testid="password-scheme-search"]', {timeout: 30000}).scrollIntoView().click();
  cy.get('[data-testid="password-scheme-modal"]', {timeout: 30000}).should('not.exist');

  cy.get('[data-testid="ioc-threat-table"]', {timeout: 30000}).scrollIntoView();
  cy.get('[data-testid="ioc-threat-table"]', {timeout: 30000}).find('[data-testid="ioc-threat-row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
}

export function openIocFilterPanel() {
  cy.log('Filter: scroll to top and open panel');
  cy.window().then((win) => win.console.log('Filter: scroll to top and open panel'));
  cy.get('[data-testid="dashboard-body"]', {timeout: 30000}).scrollTo('top', {ensureScrollable: false});
  cy.get('[data-testid="side-filter-open"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
  cy.get('[data-testid="side-filter-close"]', {timeout: 30000}).filter(':visible').first().should('be.visible');
}

function moveDatePickerToMonth(targetLabel: string, attempts = 0): void {
  if (attempts > 24) {
    throw new Error(`Could not navigate date picker to ${targetLabel}`);
  }

  cy.get('[data-testid="side-filter-date-month-label"]', {timeout: 30000}).first().invoke('text').then((raw) => {
    const currentLabel = raw.trim();
    if (currentLabel === targetLabel) {
      return;
    }

    const currentDate = new Date(`${currentLabel} 1`);
    const targetDate = new Date(`${targetLabel} 1`);
    const goPrev = currentDate.getTime() > targetDate.getTime();
    const navSelector = goPrev ? '[data-testid="side-filter-date-prev-month"]' : '[data-testid="side-filter-date-next-month"]';
    cy.get(navSelector, {timeout: 30000}).first().scrollIntoView().click();
    moveDatePickerToMonth(targetLabel, attempts + 1);
  });
}

export function applyDateRangeFilter(monthLabel: string, startDay: number, endDay: number) {
  cy.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`);
  cy.window().then((win) => win.console.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`));
  openIocFilterPanel();
  cy.get('[data-testid="side-filter-date-toggle"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  moveDatePickerToMonth(monthLabel);
  cy.get(`[data-testid="side-filter-date-day-${startDay}"]`, {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.get(`[data-testid="side-filter-date-day-${endDay}"]`, {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-apply"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
}

export function clearSideFilters() {
  cy.log('Filter: clearing side filters before advanced flow');
  openIocFilterPanel();
  cy.get('[data-testid="side-filter-reset"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.get('body', {timeout: 30000}).then(($body) => {
    const $apply = $body.find('[data-testid="side-filter-apply"]:visible').first();
    if ($apply.length > 0) {
      cy.wrap($apply).scrollIntoView().click();
    }
  });
}

export function searchDeepFromTop(query: string) {
  cy.get('[data-testid="dashboard-body"]', {timeout: 30000}).scrollTo('top', {ensureScrollable: false});
  cy.get('[data-testid="dashboard-general-input"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().clear().type(`${query}{enter}`);
}

export function setAllInsightsExpanded(expand: boolean) {
  cy.get('[data-testid^="insights-toggle-"]', {timeout: 30000}).each(($toggle) => {
    cy.wrap($toggle).find('[aria-label]').first().invoke('attr', 'aria-label').then((ariaLabel) => {
      const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
      if (expand ? !isExpanded : isExpanded) {
        cy.wrap($toggle).scrollIntoView().click();
      }
    });
  });
}

export function ensureInsightSectionExpanded(toggleTestId: string) {
  cy.get(`[data-testid="${toggleTestId}"]`, {timeout: 30000}).find('[aria-label]').first().invoke('attr', 'aria-label').then((ariaLabel) => {
    const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
    if (!isExpanded) {
      cy.get(`[data-testid="${toggleTestId}"]`).scrollIntoView().click();
    }
  });
}

export function runAdvancedFilterFlow() {
  cy.log('Advanced: open and test real/fake filters with add/delete');
  cy.get('[data-testid="dashboard-body"]', {timeout: 30000}).scrollTo('top', {ensureScrollable: false});

  cy.get('[data-testid="ioc-adv-row"], [data-testid="ioc-basic-search-input"]', {timeout: 30000}).then(($els) => {
    const hasVisibleAdvancedRow = $els.filter('[data-testid="ioc-adv-row"]:visible').length > 0;
    if (!hasVisibleAdvancedRow) {
      cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
    }
  });
  cy.get('[data-testid="ioc-adv-row"]', {timeout: 30000}).filter(':visible').should('have.length.at.least', 1);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
    cy.get('[data-testid="ioc-adv-tag-select"]').scrollIntoView().select('m_email');
    cy.get('[data-testid="ioc-adv-value-input"]').scrollIntoView().clear().type('ydt.sja@gail.ccmm');
  });
  executeIocAdvancedSearch();
  cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000}).find('[data-testid="ioc-stealer-row"]', {timeout: 30000}).should('have.length.greaterThan', 0);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
    cy.get('[data-testid="ioc-adv-add-filter"]').scrollIntoView().click();
  });
  cy.get('[data-testid="ioc-adv-row"]', {timeout: 30000}).filter(':visible').should('have.length.at.least', 2);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
    cy.get('[data-testid="ioc-adv-operator-select"]').scrollIntoView().select('&&');
    cy.get('[data-testid="ioc-adv-tag-select"]').scrollIntoView().select('m_email');
    cy.get('[data-testid="ioc-adv-value-input"]').scrollIntoView().clear().type('fake-no-result-value-xyz@gmail.com');
  });
  executeIocAdvancedSearch();

  cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000}).should(($shell) => {
    const rowCount = $shell.find('[data-testid="ioc-stealer-row"]').length;
    const emptyCount = $shell.find('.ui-ioc-table-empty').length;
    expect(rowCount === 0 || emptyCount > 0).to.eq(true);
  });

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
    cy.get('[data-testid="ioc-adv-delete-filter"]').scrollIntoView().click();
  });
  executeIocAdvancedSearch();
  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').should('have.length.at.least', 1);
  cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000}).should(($shell) => {
    const rowCount = $shell.find('[data-testid="ioc-stealer-row"]').length;
    const emptyCount = $shell.find('.ui-ioc-table-empty').length;
    expect(rowCount > 0 || emptyCount > 0).to.eq(true);
  });

  cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="ioc-adv-row"]:visible', {timeout: 30000}).should('have.length', 0);
  cy.get('[data-testid="ioc-basic-search-input"]', {timeout: 30000}).filter(':visible').first().should('be.visible');
}
