describe('Tenant Complete Flow – Correct Order', () => {

  const tenant = {
    username: 'test_for_tenants',
    email: 'testing1@orionintelligence.org',
    password: '1qaz!QAZ'
  };

  it('Tenant signs up', () => {
    cy.visit('/login');

    cy.contains('Sign Up').click({ force: true });

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="companymail"]').type(tenant.email);
    cy.get('input[name="password"]').type(tenant.password);

    cy.contains('input[type="submit"]', 'Sign Up')
      .should('be.visible')
      .click({ force: true });

    cy.get('.welcome-page__card').should('exist');
    cy.contains('Go to login').click({ force: true });
  });


  it('Admin verifies tenant and assigns Enterprise license', () => {
  cy.loginAsAdmin();

  cy.visit('/dashboard/profile/homepage');
  cy.openTenantsPage();


  cy.get('tr')
    .contains('Not Verified')
    .closest('tr')
    .within(() => {
      cy.get('#edit-tenant')
        .should('be.visible')
        .click({ force: true });
    });


  cy.get('button.pill-toggle')
    .contains('Not Verified')
    .should('be.visible')
    .click({ force: true });


  cy.get('button.dropdown-toggle')
    .contains(/disable/i)
    .click({ force: true });

  cy.get('a.dropdown-item')
    .contains(/active/i)
    .click({ force: true });


  cy.contains('.license-label', 'Enterprise')
    .closest('.license-card')
    .find('input[type="checkbox"]')
    .check({ force: true });

  cy.contains('Save changes')
    .should('be.visible')
    .click({ force: true });

  cy.logout();
});




const openManageIOCs = () => {
  cy.contains('.sidebar__subitem-content', 'IOC')
    .should('be.visible')
    .click({ force: true });

  cy.get('.onboarding-step2__category-scroll')
    .should('exist');
};

const addIOCValue = (value:string) => {
  cy.get('.onboarding-step2__input')
    .should('be.visible')
    .clear()
    .type(value);

  cy.get('button.onboarding-step2__add-btn')
    .should('be.visible')
    .click({ force: true });
};

const addIOCForAllTabs = () => {
  cy.get('.onboarding-step2__category-scroll')
    .find('.onboarding-step2__tab')
    .each(($tab, index) => {
      cy.wrap($tab)
        .scrollIntoView()
        .click({ force: true });


      addIOCValue(`test-${index}`);
    });
  const goToHomepageAndScan = () => {
    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });

    cy.get('button[apptooltip="scan all"]')
      .should('be.visible')
      .click({ force: true });
};

};


it('Tenant adds user, IOCs, scans and logs out', () => {

  cy.visit('/login');
  cy.get('input[name="username"]').type(tenant.username);
  cy.get('input[name="password"]').type(tenant.password, { log: false });
  cy.contains('Sign In').click({ force: true });
  cy.get('.dashboard_container').should('exist');


  cy.contains('Users').click({ force: true });
  cy.contains('button', 'Add User').click({ force: true });

  cy.get('input[name="username"]').type('tenant_user_1');
  cy.get('input[name="email"]').type('tenant1@gmail.com');
  cy.get('input[name="password"]').type('1qaz!QAZ', { log: false });

  cy.contains('.license-card', 'Enterprise')
    .find('input.license-checkbox')
    .check({ force: true });

  cy.contains('.add-tenant_footer button', 'Add User')
    .click({ force: true });


  openManageIOCs();
  addIOCForAllTabs();
  //goToHomepageAndScan();


  cy.contains('button', 'Logout').click({ force: true });
  cy.url().should('include', '/login');
});


  it('Admin logs in again and sets quota to 1', () => {
    cy.loginAsAdmin();

    cy.visit('/dashboard/profile/homepage');
    cy.openTenantsPage();

    cy.get('tr')
      .contains('orionintelligence')
      .closest('tr')
      .within(() => {
        cy.get('#edit-tenant').click({ force: true });
      });

    cy.get('input.tenant-input')
      .clear()
      .type('1');

    cy.contains('Save changes').click({ force: true });
    cy.logout();
  });


  it('Tenant logs in again and sees homepage / paywall behavior', () => {
    cy.visit('/login');

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, { log: false });
    cy.contains('Sign In').click({ force: true });

    cy.get('.dashboard_container').should('exist');


    cy.contains('Homepage').click({ force: true });
    cy.get('.user-homepage_cards').should('exist');


    cy.contains('Logout').click({ force: true });
  });

});
