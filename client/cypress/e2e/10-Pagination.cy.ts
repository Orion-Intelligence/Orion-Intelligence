describe('Dashboard – General Intelligence – Tabs & Pagination', () => {

  const TABS = [
    'All',
    'General'
  ];

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard');


    cy.get('app-dashboard-sidebar-items')
      .should('exist');
  });

  it('General Intelligence – tabs load & pagination', () => {


    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .should('be.visible')
      .click({ force: true });


    TABS.forEach((tab) => {

      cy.log(`TAB: ${tab}`);


      cy.contains('app-dashboard-sidebar-items div', tab)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
       cy.reload();

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
            cy.wrap($btn).click({ force: true });


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

    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard');


    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Data Breach – tabs load & pagination', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Data Breach')
      .click({ force: true });


    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.contains('app-dashboard-sidebar-items div', tab)
        .click({ force: true });


      cy.get('.ui-result-card')
        .should('exist');


      cy.get('app-pagination').should('exist');


      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


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
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Defacement – tabs load & pagination with scoped clicks', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Defacement')
      .click({ force: true });


    cy.get('app-dashboard-sidebar-items')
      .contains('Defacement')
      .parent()
      .as('defacementTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@defacementTabs')
        .contains('div', tab)
        .click({ force: true });


      cy.get('tr[id^="item-"], .ui-result-card')
        .should('exist');


      cy.get('app-pagination').should('exist');


      cy.get('app-pagination button')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


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
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Social – tabs load & pagination with scoped clicks', () => {

    cy.contains('app-dashboard-sidebar-items div', 'Social')
      .click({ force: true });


    cy.get('app-dashboard-sidebar-items')
      .contains('Social')
      .parent()
      .as('socialTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@socialTabs')
        .contains('div', tab)
        .click({ force: true });


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
            cy.wrap($btn).click({ force: true });


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
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Exploit – tabs load & pagination with scoped clicks', () => {
    cy.contains('app-dashboard-sidebar-items div', 'Exploit')
      .click({ force: true });

    cy.get('app-dashboard-sidebar-items')
      .contains('Exploit')
      .parent()
      .as('exploitTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@exploitTabs')
        .contains('div', tab)
        .click({ force: true });

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
            cy.wrap($btn).click({ force: true });

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
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
    cy.visit('/dashboard');
    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Feed – tabs load & pagination with scoped clicks', () => {
    cy.contains('app-dashboard-sidebar-items div', 'Feed')
      .click({ force: true });

    cy.get('app-dashboard-sidebar-items')
      .contains('Feed')
      .parent()
      .as('feedTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@feedTabs')
        .contains('div', tab)
        .click({ force: true });

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
            cy.wrap($btn).click({ force: true });
            cy.reload();
            cy.get('.ui-result-card')
              .should('exist');
          }
        });
      cy.logout();
    });
  });
});
