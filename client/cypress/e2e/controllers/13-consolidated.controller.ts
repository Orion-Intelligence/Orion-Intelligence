const DOMAIN_SCANNER_MODAL_TIMEOUT = 90000;
const DOMAIN_SCANNER_SELECTOR = '[data-testid="domain-scanner-modal"]';
const DOMAIN_SCANNER_TEST_DOMAINS = ['example.com', 'bbc.com', 'cnn.com'];
const DOMAIN_SCANNER_INPUT_SELECTOR = '[data-testid="domain-scanner-input"]';

function executeIocAdvancedSearch() {
  cy.get('[data-testid="ioc-adv-execute"]')
    .filter(':visible')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .and('not.be.disabled')
    .click();
}

export function openHomepageAndSearch(query = '{enter}') {
  cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').click();
  cy.get('[data-testid="sidebar-subitem-profile-homepage"]').filter(':visible').first().should('be.visible').click();
  cy.get('[data-testid="homepage-search-input"]').should('be.visible').click().type(query);
}

export function switchToDeepSearchTab() {
  cy.get('[data-testid="consolidated-tab-deep-search"]').scrollIntoView().should('be.visible').click();
}

export function switchToIocsTab() {
  cy.get('[data-testid="consolidated-tab-iocs"]').scrollIntoView().should('be.visible').click();
}

export function searchInIocs(query: string) {
  cy.get('[data-testid="consolidated-tab-iocs"]').scrollIntoView().click();
  cy.closeSideFilter()
  cy.get('[data-testid="dashboard-body"]').scrollTo('top', {ensureScrollable: false});
  cy.get('[data-testid="ioc-basic-search-input"]')
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
  cy.get(`[data-testid="consolidated-open-domain-scanner"], ${DOMAIN_SCANNER_SELECTOR}`).then(($els) => {
    const isModalVisible = $els.filter(`${DOMAIN_SCANNER_SELECTOR}:visible`).length > 0;
    if (!isModalVisible) {
      cy.get('[data-testid="consolidated-open-domain-scanner"]')
        .scrollIntoView()
        .should('be.visible')
        .click({force: true});
    }
  });
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('exist');
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('be.visible');
}

export function openFirstReportAndGoBack() {
  cy.get('[data-testid="open-report"]').filter(':visible').first().scrollIntoView().should('be.visible').click();
  cy.url().should('include', '/dashboard/profile/consolidated');
  cy.get('[data-testid="dashboard-header-back"]')
    .filter(':visible')
    .first()
    .scrollIntoView()
    .click();
  cy.get('[data-testid="consolidated-tab-deep-search"]')
    .scrollIntoView()
    .should('be.visible')
    .click();
}

export function runDomainScannerFlow() {
  cy.get('[data-testid="consolidated-tab-iocs"]').scrollIntoView().should('be.visible').click();
  ensureDomainScannerModalOpen();
  cy.get('[data-testid="domain-scanner-tab-subdomains"]').scrollIntoView().should('be.visible').click();
  cy.get('[data-testid="domain-scanner-live-toggle"]').should('exist').parents('label').first().click();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type('abcderfghh');
  cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
  cy.get('[data-testid="domain-scanner-search-subdomains"]').should('not.be.disabled');

  DOMAIN_SCANNER_TEST_DOMAINS.forEach((domain) => {
    cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type(domain);
    cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
    cy.get('[data-testid="domain-scanner-search-subdomains"]').should('not.be.disabled');
  });

  cy.get('[data-testid="domain-scanner-tab-ip-lookup"]').scrollIntoView().should('be.visible').click();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).clear().type('1.1.1.1');
  cy.get('[data-testid="domain-scanner-lookup-ip"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
  cy.get('[data-testid="domain-scanner-lookup-ip"]').should('not.be.disabled');

  ensureDomainScannerModalOpen();
  cy.get('[data-testid="domain-scanner-tab-wayback"]').scrollIntoView().should('be.visible').click();
  ensureDomainScannerModalOpen();
  cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).should('be.visible').clear().type('example.com');
  cy.get('[data-testid="domain-scanner-search-wayback"]').scrollIntoView().should('be.visible').click();
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('exist').within(() => {
    cy.get('button[aria-label="Close"]').click({force: true});
  });
  cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('not.exist');
}

export function applyPasswordSchemeAndValidate() {
  cy.get('[data-testid="ioc-open-password-scheme"]').first().scrollIntoView().click();
  cy.get('[data-testid="password-scheme-modal"]').should('be.visible');
  cy.get('[data-testid="password-scheme-title"]').should('contain.text', 'Password Scheme Filter');

  cy.get('[data-testid="password-scheme-min-length"]').scrollIntoView().clear().type('8');
  cy.get('[data-testid="password-scheme-max-length"]').scrollIntoView().clear().type('24');
  cy.get('[data-testid="password-scheme-has-alphabets"]').scrollIntoView().check();
  cy.get('[data-testid="password-scheme-has-numbers"]').scrollIntoView().check();
  cy.get('[data-testid="password-scheme-search"]').scrollIntoView().click();
  cy.get('[data-testid="password-scheme-modal"]').should('not.exist');

  cy.get('[data-testid="ioc-threat-table"]').scrollIntoView();
  cy.get('[data-testid="ioc-threat-table"]').find('[data-testid="ioc-threat-row"]').should('have.length.greaterThan', 0);
}

export function openIocFilterPanel() {
  cy.openSideFilter()
}

function moveDatePickerToMonth(targetLabel: string, attempts = 0): void {
  if (attempts > 24) {
    throw new Error(`Could not navigate date picker to ${targetLabel}`);
  }

  cy.get('[data-testid="side-filter-date-month-label"]').first().invoke('text').then((raw) => {
    const currentLabel = raw.trim();
    if (currentLabel === targetLabel) {
      return;
    }

    const currentDate = new Date(`${currentLabel} 1`);
    const targetDate = new Date(`${targetLabel} 1`);
    const goPrev = currentDate.getTime() > targetDate.getTime();
    const navSelector = goPrev ? '[data-testid="side-filter-date-prev-month"]' : '[data-testid="side-filter-date-next-month"]';
    cy.get(navSelector).first().scrollIntoView().click({force: true});
    moveDatePickerToMonth(targetLabel, attempts + 1);
  });
}

export function applyDateRangeFilter(monthLabel: string, startDay: number, endDay: number) {
  cy.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`);
  cy.window().then((win) => win.console.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`));
  cy.scrollDashboardToTop()
  openIocFilterPanel()
  cy.get('[data-testid="side-filter-date-toggle"]')
    .filter(':visible')
    .first()
    .click({force: true});
  moveDatePickerToMonth(monthLabel);
  cy.get(`[data-testid="side-filter-date-day-${startDay}"]`).filter(':visible').first().scrollIntoView().click({force: true});
  cy.get(`[data-testid="side-filter-date-day-${endDay}"]`).filter(':visible').first().scrollIntoView().click({force: true});
  cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().scrollIntoView().click();
}

export function clearSideFilters() {
  openIocFilterPanel()
  cy.get('[data-testid="side-filter-reset"]').filter(':visible').first().scrollIntoView().click();
  cy.get('body').then(($body) => {
    const $apply = $body.find('[data-testid="side-filter-apply"]:visible').first();
    if ($apply.length > 0) {
      openIocFilterPanel()
      cy.wrap($apply).scrollIntoView().click();
    }
  });
}

export function searchDeepFromTop(query: string) {
  cy.get('[data-testid="dashboard-body"]').scrollTo('top', {ensureScrollable: false});
  cy.get('[data-testid="dashboard-general-input"]').filter(':visible').first().scrollIntoView().clear().type(`${query}{enter}`);
}

export function setAllInsightsExpanded(expand: boolean) {
  cy.get('[data-testid^="insights-toggle-"]').each(($toggle) => {
    cy.wrap($toggle).find('[aria-label]').first().invoke('attr', 'aria-label').then((ariaLabel) => {
      const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
      if (expand ? !isExpanded : isExpanded) {
        cy.wrap($toggle).scrollIntoView().click();
      }
    });
  });
}

export function ensureInsightSectionExpanded(toggleTestId: string) {
  cy.get(`[data-testid="${toggleTestId}"]`).find('[aria-label]').first().invoke('attr', 'aria-label').then((ariaLabel) => {
    const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
    if (!isExpanded) {
      cy.get(`[data-testid="${toggleTestId}"]`).scrollIntoView().click();
    }
  });
}

export function runAdvancedFilterFlow() {
  cy.log('Advanced: open and test real/fake filters with add/delete');
  cy.get('[data-testid="dashboard-body"]').scrollTo('top', {ensureScrollable: false});

  cy.get('[data-testid="ioc-adv-row"], [data-testid="ioc-basic-search-input"]').then(($els) => {
    const hasVisibleAdvancedRow = $els.filter('[data-testid="ioc-adv-row"]:visible').length > 0;
    if (!hasVisibleAdvancedRow) {
      cy.get('[data-testid="ioc-advanced-toggle"]').filter(':visible').first().scrollIntoView().click();
    }
  });
  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').should('have.length.at.least', 1);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
    cy.get('[data-testid="ioc-adv-tag-select"]').scrollIntoView().select('m_email');
    cy.get('[data-testid="ioc-adv-value-input"]').scrollIntoView().clear().type('ydt.sja@gail.ccmm');
  });
  executeIocAdvancedSearch();
  cy.get('[data-testid="ioc-stealer-table"]').find('[data-testid="ioc-stealer-row"]').should('have.length.greaterThan', 0);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
    cy.get('[data-testid="ioc-adv-add-filter"]').scrollIntoView().click();
  });
  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').should('have.length.at.least', 2);

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
    cy.get('[data-testid="ioc-adv-operator-select"]').scrollIntoView().select('&&');
    cy.scrollDashboardToTop()
    cy.get('[data-testid="ioc-adv-tag-select"]').scrollIntoView().select('m_email');
    cy.scrollDashboardToTop()
    cy.get('[data-testid="ioc-adv-value-input"]').scrollIntoView().clear().type('fake-no-result-value-xyz@gmail.com');
  });
  executeIocAdvancedSearch();

  cy.get('[data-testid="ioc-stealer-table"]').should(($shell) => {
    const rowCount = $shell.find('[data-testid="ioc-stealer-row"]').length;
    const emptyCount = $shell.find('.ui-ioc-table-empty').length;
    expect(rowCount === 0 || emptyCount > 0).to.eq(true);
  });

  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
    cy.get('[data-testid="ioc-adv-delete-filter"]').scrollIntoView().click();
  });
  executeIocAdvancedSearch();
  cy.get('[data-testid="ioc-adv-row"]').filter(':visible').should('have.length.at.least', 1);
  cy.get('[data-testid="ioc-stealer-table"]').should(($shell) => {
    const rowCount = $shell.find('[data-testid="ioc-stealer-row"]').length;
    const emptyCount = $shell.find('.ui-ioc-table-empty').length;
    expect(rowCount > 0 || emptyCount > 0).to.eq(true);
  });

  cy.get('[data-testid="ioc-advanced-toggle"]').filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="ioc-adv-row"]:visible').should('have.length', 0);
  cy.get('[data-testid="ioc-basic-search-input"]').filter(':visible').first().should('be.visible');
}
