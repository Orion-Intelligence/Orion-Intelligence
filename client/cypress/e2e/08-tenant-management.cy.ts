describe('Tenant Complete Flow – Correct Order', () => {

  const tenant = {
    username: 'test_for_tenants',
    email: 'testing1@orionintelligence.org',
    password: '1qaz!QAZ'
  };

  it('Tenant signs up', () => {
    cy.visit('/login');

    cy.contains('Sign Up').click();

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="companymail"]').type(tenant.email);
    cy.get('input[name="password"]').type(tenant.password);

    cy.contains('input[type="submit"]', 'Sign Up')
      .should('be.visible')
      .click();

    cy.get('.welcome-page__card').should('exist');
    cy.contains('Go to login').click();
    cy.openLastMailAndGetUrl().then(url => {
      cy.visit(url);
    });
  });

  it('Admin verifies all tenants and assigns Enterprise license', () => {
    cy.loginAsAdmin();

    cy.openTenantsPage();

    const approveAllTenants = (tries = 0) => {
      if (tries >= 5) return;

      cy.get('tbody tr').then($rows => {
        const rows = $rows.filter((_: number, row: HTMLElement) => {
          return Cypress.$(row).find('.badge-false').length > 0 && !Cypress.$(row).hasClass('table-active');
        });

        if (!rows.length) return;

        cy.wrap(rows.eq(0)).within(() => {
          cy.get('#edit-tenant').click({force: true});
        });

        cy.wrap(false).as('changed');

        cy.get('tr.table-active')
          .find('button.pill-toggle')
          .then($btn => {
            if ($btn.text().includes('Not Verified')) {
              cy.wrap($btn).click({force: true});
              cy.wrap(true).as('changed');
            }
          });

        cy.get('tr.table-active')
          .find('.license-card')
          .contains('.license-label', 'Enterprise')
          .closest('.license-card')
          .find('input[type="checkbox"]')
          .then($cb => {
            if (!$cb.is(':checked')) {
              cy.wrap($cb).check({force: true});
              cy.wrap(true).as('changed');
            }
          });

        cy.get('@changed').then((changed: any) => {
          if (changed) {
            cy.contains('button', 'Save changes')
              .should('be.visible')
              .click({force: true});
          }
        });

        cy.openTenantsPage();
        cy.get('body').then($b => {
          if ($b.find('.badge-false').length) approveAllTenants(tries + 1);
        });
      });
    };

    approveAllTenants();

    cy.openTenantsPage();

    cy.logout();
  });

  const openManageIOCs = () => {
    cy.contains('.sidebar__subitem-content', 'IOC')
      .should('be.visible')
      .click();

    cy.get('.onboarding-step2__category-scroll')
      .should('exist');
  };

  const addIOCValue = (value: string) => {
    cy.get('.onboarding-step2__input')
      .should('be.visible')
      .clear()
      .type(value);

    cy.get('button.onboarding-step2__add-btn')
      .should('be.visible')
      .click();
  };

  const addIOCForAllTabs = () => {
    cy.get('.onboarding-step2__category-scroll')
      .find('.onboarding-step2__tab')
      .then($tabs => {
        Cypress._.take($tabs.toArray(), 5).forEach((tab, index) => {
          cy.wrap(tab)
            .scrollIntoView()
            .click();

          addIOCValue(`test-${index}`);
        });
      });

    const goToHomepageAndScan = () => {
      cy.contains('.sidebar__subitem-content', 'Homepage')
        .should('be.visible')
        .click();

      cy.get('button[apptooltip="scan all"]')
        .should('be.visible')
        .click();
    };

    goToHomepageAndScan();
  };

  it('Tenant adds user, IOCs, scans and logs out', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, {log: false});
    cy.contains('Sign In').click();

    cy.get('.onboarding-box', {timeout: 40000}).should('be.visible');

    cy.get('#company', {timeout: 40000})
      .clear()
      .type('Orion Intelligence');

    cy.contains('button', 'Next')
      .should('not.be.disabled')
      .click();

    cy.contains('.onboarding-step2__tab', 'Country')
      .scrollIntoView()
      .click();

    cy.get('.onboarding-step2__input')
      .clear()
      .type('austria{enter}');

    cy.contains('button', 'Next')
      .should('not.be.disabled')
      .click();

    cy.contains('button', 'Confirm')
      .should('be.visible')
      .click();

    cy.contains('Users').click();
    cy.contains('button', 'Add User').click();

    cy.get('input[name="username"]').type('tenant_user_1');
    cy.get('input[name="email"]').type('tenant1@gmail.com');
    cy.get('input[name="password"]').type('1qaz!QAZ', {log: false});

    cy.get('.license-card')
      .contains('.license-label', 'Enterprise')
      .click();

    cy.contains('.add-tenant_footer button', 'Add User')
      .click();

    openManageIOCs();

    cy.logout();
    cy.url().should('include', '/login');
  });

  it('Admin logs in again and sets quota to 1', () => {
    cy.loginAsAdmin();

    cy.visit('/dashboard/profile/homepage');
    cy.openTenantsPage();

    cy.get('tr')
      .contains('Orion Intelligence')
      .closest('tr')
      .within(() => {
        cy.get('#edit-tenant').click();
      });

    cy.get('input.tenant-input')
      .clear()
      .type('1');

    cy.contains('Save changes').click();
    cy.logout();
  });

  it('Tenant logs in again and sees homepage / paywall behavior', () => {
    cy.visit('/login');

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, {log: false});
    cy.contains('Sign In').click();

    cy.get('.dashboard_container').should('be.visible');
    cy.contains('Homepage').click();
    cy.get('.user-homepage_cards').should('exist');
  });

  it('Tenant alerts and notifications', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, {log: false});
    cy.contains('Sign In').click();

    cy.get('.dashboard_container').should('be.visible');

    cy.wait(2000)
    cy.get('button[apptooltip="scan all"]', {timeout: 40000})
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    cy.get('div.loading-content', {timeout: 40000})
      .should('not.exist');

    cy.get('button[apptooltip="Print Alerts"]')
      .should('be.visible')
      .click();

    cy.get('a.profile-dropdown-toggle.notification-icon')
      .should('be.visible')
      .click();

    cy.get('.notification_sidebar-item', {timeout: 40000})
      .first()
      .within(() => {
        cy.contains('button', 'See Details').click();
      });

    cy.get('a.profile-dropdown-toggle.notification-icon')
      .should('be.visible')
      .click();

    cy.contains('button', 'Clear All')
      .should('be.visible')
      .click();

    cy.contains('.user-homepage_cards-card', 'Breach')
      .click();

    cy.get('.category_report_burger-icon').first().click();

    cy.contains('.category_report_alert-btn', 'See Details').first().click();

    cy.get('button[apptooltip="add alert"]').click();

    cy.get('input[name="title"]').type('Test Alert');
    cy.get('textarea[name="alert_description"]').type('Test description');

    cy.get('#iocTypeDropdown').click();
    cy.contains('.dropdown-item span', 'Domains').click();

    cy.get('input[name="source"]').type('Automation');
    cy.get('input[name="url"]').type('https://example.com');
    cy.get('input[name="ioc_value"]').type('example.com');

    cy.contains('button', 'Add Alert').click();

    cy.get('button[apptooltip="open sidebar"]').click();
    cy.get('.sidebar_input_date-button').click();

    cy.contains('.ngb-dp-day', '1').click();
    cy.contains('.ngb-dp-day', '25').click();

    cy.contains('button', 'Apply').click();

    cy.get('button[apptooltip="flush all"]').click();
    cy.contains('button', 'Yes, Confirm').click();
  });

});
