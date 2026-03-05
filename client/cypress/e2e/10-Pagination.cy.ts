describe('Dashboard – General Intelligence – Tabs & Pagination', () => {

  const TABS = [
    'All',
    'General'
  ];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('General Intelligence – tabs load & pagination', () => {

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .should('be.visible')
      .click();

    TABS.forEach((tab) => {

      cy.log(`TAB: ${tab}`);

      cy.get('.ui-result-card')
        .should('exist');


      cy.get('body').scrollTo('bottom', {
        ensureScrollable: false
      });


      cy.get('app-pagination')
        .should('exist')
        .scrollIntoView();
      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.get('.ui-result-card')
              .should('exist');
          }
        });

    });
  });
});



describe('Data Breach – Tabs & Pagination', () => {
  const TABS = ['All','Tracking'];

  beforeEach(() => {

    cy.loginAsAdmin();

    cy.visit('/dashboard');


    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Data Breach – tabs load & pagination', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Data Breach')
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.contains('app-dashboard-sidebar-items div', 'Data Breach')
      .closest('li')
      .as('dataBreachTabs');


    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@dataBreachTabs')
        .find('> ul')
        .should('have.class', 'pointer-events-auto')
        .contains('div', tab)
        .should('be.visible')
        .click();


      cy.get('.ui-result-card')
        .should('exist');


      cy.get('app-pagination').should('exist');


      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();


            cy.get('.ui-result-card')
              .should('exist');
          }
        });
    });
  });
});


describe('Defacement – Tabs & Pagination', () => {
  const TABS = ['All', 'Hacked'];

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Defacement – tabs load & pagination with scoped clicks', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Defacement')
      .click();


    cy.get('app-dashboard-sidebar-items')
      .contains('Defacement')
      .parent()
      .as('defacementTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@defacementTabs')
        .contains('div', tab)
        .click();


      cy.get('tr[id^="item-"], .ui-result-card')
        .should('exist');


      cy.get('app-pagination').should('exist');


      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();


            cy.get('tr[id^="item-"], .ui-result-card')
              .should('exist');
          }
        });
    });
  });
});




describe('Social – Tabs & Pagination', () => {
  const TABS = [
    'All',
    'Twitter'
  ];

  beforeEach(() => {
    cy.loginAsAdmin();

    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Social – tabs load & pagination with scoped clicks', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Social')
      .click();


    cy.get('app-dashboard-sidebar-items')
      .contains('Social')
      .parent()
      .as('socialTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@socialTabs')
        .contains('div', tab)
        .click();


      cy.get('.ui-result-card')
        .should('exist');


      cy.get('.ui-result-card')
        .should('exist');


      cy.get('app-pagination')
        .should('exist');


      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();


            cy.get('.ui-result-card')
              .should('exist');

            cy.get('.ui-result-card')
              .should('exist');
          }
        });
    });
  });
});


describe('Exploit – Tabs & Pagination', () => {
  const TABS = ['All', 'CVE'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Exploit – tabs load & pagination with scoped clicks', () => {
    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
      .click();

    cy.get('app-dashboard-sidebar-items')
      .contains('Exploit')
      .parent()
      .as('exploitTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@exploitTabs')
        .contains('div', tab)
        .click();

      cy.get('.ui-result-card')
        .should('exist');


      cy.get('.ui-result-card')
        .should('exist');

      cy.get('app-pagination')
        .should('exist');

      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();

            cy.get('.ui-result-card')
              .should('exist');
            cy.get('.ui-result-card')
              .should('exist');
          }
        });
    });
  });
});

describe('Feed – Tabs & Pagination', () => {
  const TABS = ['News'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Feed – tabs load & pagination with scoped clicks', () => {
    cy.contains('app-dashboard-sidebar-items div', 'Feed')
      .click();

    cy.get('app-dashboard-sidebar-items')
      .contains('Feed')
      .parent()
      .as('feedTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@feedTabs')
        .contains('div', tab)
        .click();

      cy.get('.ui-result-card')
        .should('exist');


      cy.get('.ui-result-card')
        .should('exist');

      cy.get('app-pagination')
        .should('exist');

      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.reload();
            cy.get('.ui-result-card')
              .should('exist');
          }
        });
      cy.logout();
    });
  });
});


after(() => {
  cy.logoutIfLoggedIn();
});
