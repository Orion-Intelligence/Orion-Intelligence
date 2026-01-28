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


    cy.contains('div.sidebar__item-dropdown', 'General Intelligence')
      .should('be.visible')
      .click({ force: true });


    TABS.forEach((tab) => {

      cy.log(`TAB: ${tab}`);


      cy.contains('.sidebar__subitem-content', tab)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
       cy.reload();

      cy.get('.dashboard__search-main-div')
        .should('exist');


      cy.get('body').scrollTo('bottom', {
        ensureScrollable: false
      });


      cy.get('.pagination_search-container')
        .should('exist')
        .scrollIntoView();


      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


            cy.get('.dashboard__search-main-div')
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

    cy.contains('div.sidebar__item-dropdown', 'Data Breach')
      .click({ force: true });


    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.contains('.sidebar__subitem-content', tab)
        .click({ force: true });


      cy.get('.dashboard__search-main-div.ng-star-inserted')
        .should('exist');


      cy.get('.pagination_search-container').should('exist');


      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


            cy.get('.dashboard__search-main-div.ng-star-inserted')
              .should('exist');
          }
        });
    });
  });
});


describe('Discussion – Tabs & Pagination', () => {

  const TABS = [
    'All'
  ];

  beforeEach(() => {

    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard');


    cy.get('app-dashboard-sidebar-items').should('exist');
  });

  it('Discussion – tabs load & pagination', () => {

    cy.contains('div.sidebar__item-dropdown', 'Discussion')
      .click({ force: true });


    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.contains('.sidebar__subitem-content', tab)
        .click({ force: true });


      cy.get('.dashboard__search-main-div.ng-star-inserted')
        .should('exist');


      cy.get('.pagination_search-container').should('exist');


      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


            cy.get('.dashboard__search-main-div.ng-star-inserted')
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

    cy.contains('div.sidebar__item-dropdown', 'Defacement')
      .click({ force: true });


    cy.get('div.sidebar__item-dropdown')
      .contains('Defacement')
      .parent()
      .find('ul.sidebar__subitems')
      .as('defacementTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@defacementTabs')
        .contains('.sidebar__subitem-content', tab)
        .click({ force: true });


      cy.get('tr.ng-trigger.ng-trigger-fadeInDashboardItem.ng-star-inserted')
        .should('exist');


      cy.get('.pagination_search-container').should('exist');


      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


            cy.get('tr.ng-trigger.ng-trigger-fadeInDashboardItem.ng-star-inserted')
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

    cy.contains('div.sidebar__item-dropdown', 'Social')
      .click({ force: true });


    cy.get('div.sidebar__item-dropdown')
      .contains('Social')
      .parent()
      .find('ul.sidebar__subitems')
      .as('socialTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);


      cy.get('@socialTabs')
        .contains('.sidebar__subitem-content', tab)
        .click({ force: true });


      cy.get('.dashboard__search-main-div')
        .should('exist');


      cy.get('.dashboard__tag')
        .should('exist');


      cy.get('.pagination_search-container')
        .should('exist');


      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });


            cy.get('.dashboard__search-main-div')
              .should('exist');

            cy.get('.dashboard__tag')
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
    cy.contains('div.sidebar__item-dropdown', 'Exploit')
      .click({ force: true });

    cy.get('div.sidebar__item-dropdown')
      .contains('Exploit')
      .parent()
      .find('ul.sidebar__subitems')
      .as('exploitTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@exploitTabs')
        .contains('.sidebar__subitem-content', tab)
        .click({ force: true });

      cy.get('.dashboard__search-main-div')
        .should('exist');


      cy.get('.dashboard__search-tags')
        .should('exist');

      cy.get('.pagination_search-container')
        .should('exist');

      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });

            cy.get('.dashboard__search-main-div')
              .should('exist');
            cy.get('.dashboard__search-tags')
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
    cy.contains('div.sidebar__item-dropdown', 'Feed')
      .click({ force: true });

    cy.get('div.sidebar__item-dropdown')
      .contains('Feed')
      .parent()
      .find('ul.sidebar__subitems')
      .as('feedTabs');

    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);

      cy.get('@feedTabs')
        .contains('.sidebar__subitem-content', tab)
        .click({ force: true });

      cy.get('.dashboard__search-main-div')
        .should('exist');


      cy.get('.dashboard__search-main-div')
        .should('exist');

      cy.get('.pagination_search-container')
        .should('exist');

      cy.get('button.pagination_navigation')
        .not('.disabled')
        .find('img[alt="nav-next"]')
        .parents('button')
        .then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click({ force: true });
            cy.reload();
            cy.get('.dashboard__search-main-div')
              .should('exist');
          }
        });
      cy.logout();
    });
  });
});

