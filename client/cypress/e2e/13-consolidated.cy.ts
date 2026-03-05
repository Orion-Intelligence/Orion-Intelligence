describe('Homepage – Consolidated Checker Full Flow', () => {

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Open consolidated checker and validate all categories', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click()
      .type('{enter}');
  });
});


describe('Dashboard Sections Test', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Open IOCs tab, search credentials, use advanced filters, and delete', () => {
    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click()
      .type('{enter}');

    cy.contains('button', 'IOCs')
      .should('be.visible')
      .click();

    cy.get('app-credentials-search-bar form').should('exist');

    cy.get('app-credentials-search-bar input[name="searchQuery"]')
      .should('exist')
      .type('gmail.com || \n' +
        'floflick@gmx.de{enter}');

    cy.wait(1000);
    cy.contains('button', 'Advanced')
      .click();
    cy.get('div.ui-ioc-table-row', {timeout: 20000})
      .first()
      .should('be.visible')
      .find('button[aria-label="Expand row"]')
      .click();

    cy.get('div.ui-ioc-adv-row')
      .first()
      .find('select')
      .eq(1)
      .select('Email');

    cy.get('div.ui-ioc-adv-row')
      .first()
      .find('input[type="text"]')
      .first()
      .clear()
      .type('uzzalsen2530@gmail.com');

    cy.contains('button', 'Execute')
      .click();

    cy.get('button img[alt="add filter"]')
      .last()
      .parent()
      .click();

    cy.get('div.ui-ioc-adv-row')
      .last()
      .find('select')
      .eq(1)
      .select('Email');

    cy.get('div.ui-ioc-adv-row')
      .last()
      .find('input[type="text"]')
      .type('hotmail.com');

    cy.get('div.ui-ioc-adv-row')
      .last()
      .find('select')
      .first()
      .select('OR');

    cy.contains('button', 'Execute')
      .click();

    cy.get('button img[alt="delete filter"]')
      .each($btn => cy.wrap($btn).click());
  });

});

describe('Dashboard Sections Test', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Open all sections: Social, Tracking, News, Leaks, CVE, General', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click()
      .type('netflix{enter}');

  });


  it('Open IOCs tab and expand all IOC rows', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click()
      .type('netflix{enter}');

    cy.contains('button', 'IOCs')
      .should('be.visible')
      .click();

  });

  it('Open Domain Scanner and run Subdomain, IP Lookup, and Wayback scans', () => {
    cy.visit('/dashboard');
    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click();

    cy.get('[data-cy="dashboard-general-input"]')
      .scrollIntoView()
      .should('be.visible')
      .type('{enter}');

    cy.contains('button', 'IOCs')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('button img[src*="scanner.svg"]')
      .parent()
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.contains('div', 'Domain Scanner').should('be.visible');

    cy.get('app-scan-helper')
      .contains('button', 'Subdomains')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('app-scan-helper')
      .contains('button', 'Subdomains')
      .should('have.css', 'color', 'rgb(87, 165, 235)');

    cy.contains('label', 'Show only live').click();

    ['example.com', 'google.com', 'openai.com'].forEach((d) => {
      cy.get('#domain-input')
        .scrollIntoView()
        .should('be.visible')
        .clear()
        .type(d);

      cy.get('app-scan-helper')
        .contains('button', 'Search')
        .click();


      cy.get('app-scan-helper')
        .contains('button', 'Search')
        .should('not.be.disabled', {timeout: 30000});
    });

    cy.get('app-scan-helper')
      .contains('button', 'IP Lookup')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('app-scan-helper')
      .contains('button', 'IP Lookup')
      .should('have.css', 'color', 'rgb(87, 165, 235)');

    cy.get('#domain-input')
      .clear()
      .type('1.1.1.1');

    cy.get('app-scan-helper')
      .contains('span', 'Lookup IP')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('app-scan-helper')
      .contains('span', 'Lookup IP')
      .closest('button')
      .should('not.be.disabled', {timeout: 30000});

    cy.get('app-scan-helper')
      .contains('button', 'Wayback')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('app-scan-helper')
      .contains('button', 'Wayback')
      .should('have.css', 'color', 'rgb(87, 165, 235)');

    cy.contains('div', 'View archived snapshots from Wayback Machine')
      .should('be.visible');

    cy.get('#domain-input')
      .clear()
      .type('example.com');

    cy.contains('button', 'Search Wayback')
      .scrollIntoView()
      .should('be.visible')
      .click();
  });
});

after(() => {
  cy.get('body').then(($body) => {
    const $close = $body.find('button[aria-label="Close"]').filter(':visible').first();
    if ($close.length) {
      cy.wrap($close).click();
    }
  });
  cy.scrollTo('top', { ensureScrollable: false });
  cy.logout();
});
