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
      .click({ force: true });


    cy.url().should('include', '/dashboard/profile/consolidated');
    cy.go('back');
  };

  const openSection = (tagName: string) => {
    cy.contains('.dashboard__tag', tagName)
      .parents('.dashboard__search-main-div')
      .first()
      .as('currentItem');

    cy.get('@currentItem').should('exist');

    openReportAndCTI(cy.get('@currentItem'));

    cy.get('@currentItem')
      .parent()
      .find('span.see-more')
      .then($seeMore => {
        if ($seeMore.length) {
          cy.wrap($seeMore.first()).click({ force: true });
        }
      });
  };

  it('Open all sections: Social, Tracking, News, Leaks, CVE, General', () => {

    cy.visit('/dashboard');


    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true })
      .type('netflix{enter}');

    /*cy.contains('.category-heading-enforced', 'News Results')
      .should('be.visible');

    cy.get('app-dashboard-result-news')
      .should('exist')
      .first()
      .as('news');


    cy.get('@news')
      .contains('span.see-more', 'See More')
      .click({ force: true });


    openReportAndCTI(cy.get('@news'));


    cy.get('div.search-bar')
      .find('input[type="text"]')
      .should('be.visible')
      .clear()
      .type('Website');


    cy.get('div.filter-toggles')
      .contains('label', 'Email')
      .find('input[type="radio"]')
      .check({ force: true });


    cy.get('div.filter-toggles')
      .contains('label', 'Name')
      .find('input[type="radio"]')
      .check({ force: true });


    cy.get('div.filter-toggles')
      .contains('label', 'All')
      .find('input[type="radio"]')
      .check({ force: true });


    cy.get('div.scrollable')
      .find('div.search-result')
      .contains('Website')
      .should('exist');


    const insightCards = [
      'Emails', 'Domains', 'Country', 'URLs', 'CVE & CWE', 'IP Addresses', 'File Paths',
      'Company Names', 'Persons', 'Locations', 'Languages', 'Teams', 'Hashtags',
      'Mentions', 'Social Media Profiles', 'Currencies', 'Platform', 'Author', 'Scrap Script'
    ];

    insightCards.forEach(card => {
      cy.contains('div.card_header span', card)
        .parents('div.insight-card')
        .find('div.toggle-btn')
        .click({ force: true });
    });*/
  });

  it('Open Ranked tab, open report, expand insight cards and toggle radios', () => {

    cy.visit('/dashboard');


    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true })
      .type('netflix{enter}');


    cy.contains('li.nav-item a', 'Ranked')
      .should('be.visible')
      .click({ force: true });


    cy.get('div.dashboard__search-button[apptooltip="Open Report"]')
      .first()
      .then($btn => {
        openReportAndCTI(cy.wrap($btn).parent());
      });


    cy.get('app-result-insights')
      .find('div.insight-card')
      .each(($card) => {
        cy.wrap($card)
          .find('div.toggle-btn')
          .then($toggle => {
            if ($toggle.length) {
              cy.wrap($toggle).click({ force: true });
            }
          });


        /*cy.get('div.search-bar')
          .find('input[type="text"]')
          .should('be.visible')
          .clear()
          .type('Website');

        cy.get('div.filter-toggles')
          .contains('label', 'Email')
          .find('input[type="radio"]')
          .check({ force: true });

        cy.get('div.filter-toggles')
          .contains('label', 'Name')
          .find('input[type="radio"]')
          .check({ force: true });*/
      });
  });

  it('Open IOCs tab and expand all IOC rows', () => {

    cy.visit('/dashboard');



    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"], input[type="search"], input')
      .should('be.visible');

    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true })
      .type('netflix{enter}');


    cy.contains('li.nav-item a', 'IOCs')
      .should('be.visible')
      .click({ force: true });


    cy.get('div.consolidated-ioc-row', { timeout: 10000 }).should('exist');


    cy.get('div.consolidated-ioc-row').each(($row) => {
      cy.wrap($row)
        .find('div.consolidated-ioc-expand img[alt="toggle"]')
        .then($toggle => {
          if ($toggle.length) {
            cy.wrap($toggle).click({ force: true });
          }
        });
    });
    cy.get('div.filter-button-wrapper label.filters-button')
    .should('be.visible')
    .click({ force: true });


  cy.get('form.sidebar_form').should('be.visible');

  cy.get('ul[aria-labelledby="dropdownnetwork"] li a').each(($el) => {
  const option = $el.text().trim();


  cy.get('div.filter-button-wrapper label.filters-button')
    .should('be.visible')
    .click({ force: true });


  cy.get('form.sidebar_form').should('be.visible');


  cy.get('button#dropdownnetwork').click({ force: true });
  cy.contains(`ul[aria-labelledby="dropdownnetwork"] li a`, option)
    .click({ force: true });


  cy.get('button.sidebar_submit-button').contains('Apply').click({ force: true });


  cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
});


cy.get('ul[aria-labelledby="dropdowncontent"] li a').each(($el) => {
  const option = $el.text().trim();
  cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
  cy.get('form.sidebar_form').should('be.visible');
  cy.get('button#dropdowncontent').click({ force: true });
  cy.contains(`ul[aria-labelledby="dropdowncontent"] li a`, option).click({ force: true });
  cy.get('button.sidebar_submit-button').contains('Apply').click({ force: true });
  cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
});


cy.get('ul[aria-labelledby="dropdownplatform"] li a').each(($el) => {
  const option = $el.text().trim();
  cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
  cy.get('form.sidebar_form').should('be.visible');
  cy.get('button#dropdownplatform').click({ force: true });
  cy.contains(`ul[aria-labelledby="dropdownplatform"] li a`, option).click({ force: true });
  cy.get('button.sidebar_submit-button').contains('Apply').click({ force: true });
  cy.get('div.filter-button-wrapper label.filters-button').click({ force: true });
    });
  });
});
