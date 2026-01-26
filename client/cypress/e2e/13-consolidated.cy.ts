describe('Homepage – Consolidated Checker Full Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open consolidated checker and validate all categories', () => {


    cy.visit('/dashboard');


    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });


    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true })
      .type('{enter}');


    cy.contains('.home-defacement-result__title', 'IP Threat Report')
      .should('be.visible');

    const openCategoryAndReturn = (categoryName: string) => {
    cy.contains('.home-defacement-result__filter-type', categoryName, { timeout: 30000 }).should('be.visible').click({ force: true });
    };

    openCategoryAndReturn('databases');
    openCategoryAndReturn('hacked');
    openCategoryAndReturn('phishing');
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
      .type('{enter}');


    cy.contains('.category-heading-enforced', 'Social Results')
      .should('be.visible');

    cy.get('app-dashboard-result-social')
      .should('exist')
      .first()
      .as('social');


    cy.get('@social')
      .contains('span.see-more', 'See More')
      .click({ force: true });


    openReportAndCTI(cy.get('@social'));


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


    const insightCards = [
      'Emails', 'Domains', 'Country', 'URLs', 'CVE & CWE'
    ];

    insightCards.forEach(card => {
      cy.contains('div.card_header span', card)
        .parents('div.insight-card')
        .find('div.toggle-btn')
        .click({ force: true });
    });
  });



  it('Open IOCs tab, search credentials, use advanced filters, and delete', () => {
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
    .type('{enter}');

  cy.contains('li.nav-item a', 'IOCs')
    .should('be.visible')
    .click();


  cy.get('form.credential_search_wrapper').should('exist');

  cy.get('form.credential_search_wrapper input[name="searchQuery"]')
    .should('exist')
    .type('gmail.com || \n' +
      'floflick@gmx.de{enter}');




  cy.get('button.credentials-search_mode-toggle')
    .click({ force: true });



  cy.get('div.credential_row')
    .contains('floflick@gmx.de')
    .parents('div.credential_row')
    .find('button.credential_row_toggle')
    .click({ force: true });


  cy.get('select.credentials-search_tag-select')
    .select('Email');

  cy.get('input.credentials-search_filter-input')
    .first()
    .clear()
    .type('uzzalsen2530@gmail.com');

  cy.contains('button.credentials-search_execute-btn', 'Execute')
    .click({ force: true });


  cy.get('button.credentials-search_btn-icon.credentials-search_add')
    .click({ force: true });

  cy.get('div.credentials-search_filter-row')
    .last()
    .find('select.credentials-search_tag-select')
    .select('Email');

  cy.get('div.credentials-search_filter-row')
    .last()
    .find('input.credentials-search_filter-input')
    .type('hotmail.com');

  cy.get('div.credentials-search_filter-row')
    .last()
    .find('select.credentials-search_operator-select')
    .select('OR');

  cy.contains('button.credentials-search_execute-btn', 'Execute')
    .click({ force: true });


  cy.get('button.credentials-search_btn-icon.credentials-search_delete')
    .each($btn => cy.wrap($btn).click({ force: true }));
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

  });
});
