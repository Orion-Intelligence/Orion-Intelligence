describe('Orion Intelligence – Full Stable Flow', () => {

  it('Login → Search → Open Report → Account → Users → Auditlog → System Settings', () => {


    cy.visit('https://try.orionintelligence.org/login');

    cy.get('input[name="username"]')
      .should('be.visible')
      .type('admin');

    cy.get('input[name="password"]')
      .should('be.visible')
      .type('cmUFD@CRw(MpYEj!)^rBhSAxk+HXWbu&#eGaq#ePysJNtgnV91', { log: false });

    cy.get('input.login-button')
      .should('be.enabled')
      .click();

    cy.get('.dashboard_container')
      .should('be.visible');

    cy.takeStepScreenshot('01-login-success');


    cy.get('input[name="q"]')
      .should('be.visible')
      .clear()
      .type('uk');

    cy.get('button.default-input-button')
      .should('be.enabled')
      .click();

    cy.get('app-consolidated-apis')
      .should('exist');

    cy.get('.dashboard__search-card')
      .should('have.length.greaterThan', 0);

    cy.takeStepScreenshot('02-search-uk-results');


    cy.get('#item-t3_1peft0s .dashboard__buttons div')
      .should('have.length.at.least', 3)
      .eq(2)
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('.dashboard_container')
      .should('be.visible');

    cy.takeStepScreenshot('03-report-opened');

    /* =====================
       ACCOUNT PAGE
    ====================== */
    cy.contains('.sidebar__subitem-content', 'Account')
      .should('be.visible')
      .click();

    cy.url().should('include', '/dashboard/profile/account');

    cy.get('.company-profile_section-title')
      .contains('Admin Profile')
      .should('be.visible');

    cy.takeStepScreenshot('04-account-page');


    cy.get('.company-profile_section')
      .each(($section, index) => {
        cy.wrap($section)
          .find('.company-profile_section-header')
          .scrollIntoView()
          .click({ force: true });
        cy.takeStepScreenshot(`06-account-section-${index + 1}-open`);

        cy.wrap($section)
          .find('.company-profile_section-header')
          .click({ force: true });
        cy.takeStepScreenshot(`06-account-section-${index + 1}-closed`);
      });


    cy.contains('.sidebar__subitem-content', 'Users')
      .should('be.visible')
      .click();

    cy.contains('button', 'Add User')
      .should('be.visible')
      .click();

    cy.get('form.add-tenant_form')
      .should('be.visible');

    cy.takeStepScreenshot('07-add-user-form');


    cy.get('input[name="username"]').type('abdullah_test');
    cy.get('input[name="email"]').type('abdullah@orionintelligence.com');
    cy.get('input[name="password"]').type('Test@12345');

    cy.get('select[name="role"]').select('Analyst');
    cy.get('select[name="status"]').select('Active');

    cy.contains('.license-card', 'Free')
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.takeStepScreenshot('08-add-user-filled');


    cy.contains('button', 'Add Tenant')
      .should('be.enabled')
      .click();

    cy.get('tbody')
      .should('be.visible');

    cy.takeStepScreenshot('09-user-added-success');


    cy.get('tbody tr')
      .should('have.length.greaterThan', 0)
      .each(($row, index) => {
        cy.wrap($row)
          .find('button')
          .first()
          .scrollIntoView()
          .click({ force: true });

        cy.takeStepScreenshot(`10-user-action-${index + 1}`);

        cy.get('body').type('{esc}', { force: true });
      });


    cy.contains('.sidebar__subitem-content', 'Auditlog')
      .should('be.visible')
      .click();

    cy.get('.directory-listing_header')
      .should('contain.text', 'Audit Logs');

    cy.takeStepScreenshot('11-auditlog-page');


    cy.get('#dashboard-container > span > app-auditlog > div > div > div > div > div.side-menu-container')
      .within(() => {
        cy.get('label.filters-button')
          .should('be.visible')
          .click();

        cy.get('input.filter__date-hidden')
          .first()
          .click({ force: true });

        cy.get('ngb-datepicker').should('be.visible');

        cy.get('ngb-datepicker')
          .find('ngb-datepicker-navigation-select select[title="Select month"]')
          .select('Dec');

        cy.get('ngb-datepicker')
          .find('ngb-datepicker-navigation-select select[title="Select year"]')
          .select('2025');

        cy.get('ngb-datepicker')
          .contains('span.custom-day', '1')
          .click({ force: true });

        cy.get('.sidebar_submit-button')
          .contains('Apply')
          .click({ force: true });
      });

    cy.takeStepScreenshot('12-auditlog-filter-applied');


    cy.contains('.sidebar__subitem-content', 'Tenant')
      .should('be.visible')
      .click();

    cy.get('tbody tr')
      .should('have.length.greaterThan', 0);

    cy.get('tbody tr')
      .first()
      .find('button.expand-btn')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.takeStepScreenshot('tenant-edit-opened');


    cy.contains('.sidebar__subitem-content', 'System Settings')
      .should('be.visible')
      .click();

    cy.get('app-sidebar-profile-system-settings')
      .should('be.visible');


    cy.takeStepScreenshot('system-settings-edit-opened');

  });

});
