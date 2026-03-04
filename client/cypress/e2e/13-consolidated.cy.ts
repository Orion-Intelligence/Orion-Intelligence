describe('Homepage – Consolidated Checker Full Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open consolidated checker and validate all categories', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({force: true})
      .type('{enter}');

    const openCategoryAndReturn = (categoryName: string) => {
      cy.contains('.ui-consolidated-main div', categoryName, {timeout: 30000}).should('be.visible').click({force: true});
    };

  });
});


describe('Dashboard Sections Test', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const openReportAndCTI = (item: Cypress.Chainable) => {
    item
      .find('img[src*="redirect"]')
      .first()
      .should('be.visible')
      .click({force: true});

    cy.url().should('include', '/dashboard/profile/consolidated');
    cy.go('back');
  };

  const openSection = (tagName: string) => {
    cy.contains('span', tagName)
      .closest('.ui-result-card')
      .first()
      .as('currentItem');

    cy.get('@currentItem').should('exist');

    openReportAndCTI(cy.get('@currentItem'));

    cy.get('@currentItem')
      .parent()
      .find('span.ui-see-more-btn')
      .then($seeMore => {
        if ($seeMore.length) {
          cy.wrap($seeMore.first()).click({force: true});
        }
      });
  };



  it('Open IOCs tab, search credentials, use advanced filters, and delete', () => {
    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({force: true})
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
      .click({force: true});
cy.get('div.ui-ioc-table-row', { timeout: 20000 })
  .first()
  .should('be.visible')
  .find('button[aria-label="Expand row"]')
  .click({ force: true });

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
      .click({force: true});

    cy.get('button img[alt="add filter"]')
      .last()
      .parent()
      .click({force: true});

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
      .click({force: true});

    cy.get('button img[alt="delete filter"]')
      .each($btn => cy.wrap($btn).click({force: true}));
  });

});

describe('Dashboard Sections Test', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  const openReportAndCTI = (item: Cypress.Chainable) => {
    item
      .find('img[src*="redirect"]')
      .first()
      .should('be.visible')
      .click({force: true});

    cy.url().should('include', '/dashboard/profile/consolidated');
    cy.go('back');
  };

  const openSection = (tagName: string) => {
    cy.contains('span', tagName)
      .closest('.ui-result-card')
      .first()
      .as('currentItem');

    cy.get('@currentItem').should('exist');

    openReportAndCTI(cy.get('@currentItem'));

    cy.get('@currentItem')
      .parent()
      .find('span.ui-see-more-btn')
      .then($seeMore => {
        if ($seeMore.length) {
          cy.wrap($seeMore.first()).click({force: true});
        }
      });
  };

  it('Open all sections: Social, Tracking, News, Leaks, CVE, General', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({force: true})
      .type('netflix{enter}');

  });


  it('Open IOCs tab and expand all IOC rows', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
      .should('be.visible')
      .click({force: true});

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({force: true})
      .type('netflix{enter}');

    cy.contains('button', 'IOCs')
      .should('be.visible')
      .click({force: true});

  });

  it('Open Domain Scanner and run Subdomain, IP Lookup, and Wayback scans', () => {
  cy.visit('/dashboard');
  cy.contains('app-dashboard-sidebar-items div', 'Homepage')
    .should('be.visible')
    .click({force: true});

  cy.get('[data-cy="dashboard-general-input"]')
    .scrollIntoView()
    .should('be.visible')
    .type('{enter}', {force: true});

  cy.contains('button', 'IOCs')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get('button img[src*="scanner.svg"]')
    .parent()
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});

  cy.contains('div', 'Domain Scanner').should('be.visible');

  cy.get('app-scan-helper')
    .contains('button', 'Subdomains')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});

  cy.get('app-scan-helper')
    .contains('button', 'Subdomains')
    .should('have.css', 'color', 'rgb(87, 165, 235)');

  cy.contains('label', 'Show only live').click({force: true});

  ['example.com', 'google.com', 'openai.com'].forEach((d) => {
    cy.get('#domain-input')
      .scrollIntoView()
      .should('be.visible')
      .clear({force: true})
      .type(d);

    cy.get('app-scan-helper')
      .contains('button', 'Search')
      .click({force: true});


    cy.get('app-scan-helper')
      .contains('button', 'Search')
      .should('not.be.disabled', {timeout: 30000});
  });

  cy.get('app-scan-helper')
    .contains('button', 'IP Lookup')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});

  cy.get('app-scan-helper')
    .contains('button', 'IP Lookup')
    .should('have.css', 'color', 'rgb(87, 165, 235)');

  cy.get('#domain-input')
    .clear({force: true})
    .type('1.1.1.1');

  cy.get('app-scan-helper')
    .contains('span', 'Lookup IP')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});

    cy.get('app-scan-helper')
    .contains('span', 'Lookup IP')
    .closest('button')
    .should('not.be.disabled', {timeout: 30000});

  cy.get('app-scan-helper')
    .contains('button', 'Wayback')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});

    cy.get('app-scan-helper')
    .contains('button', 'Wayback')
    .should('have.css', 'color', 'rgb(87, 165, 235)');

  cy.contains('div', 'View archived snapshots from Wayback Machine')
    .should('be.visible');

  cy.get('#domain-input')
    .clear({force: true})
    .type('example.com');

  cy.contains('button', 'Search Wayback')
    .scrollIntoView()
    .should('be.visible')
    .click({force: true});
});
  });

