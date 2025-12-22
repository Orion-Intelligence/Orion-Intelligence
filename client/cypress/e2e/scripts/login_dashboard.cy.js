describe('Orion Intelligence – Full Stable Flow', () => {
  it('Login → Search → Open Report → Account → Users → Auditlog → Tenant → System Settings → General Intelligence → Data Sections', () => {

    /* =====================
       VISIT LOGIN PAGE
    ====================== */
    cy.visit('https://try.orionintelligence.org/login');

    /* =====================
       LOGIN FORM
    ====================== */
    cy.get('input[name="username"]').should('be.visible').type('admin');
    cy.get('input[name="password"]').should('be.visible')
      .type('cmUFD@CRw(MpYEj!)^rBhSAxk+HXWbu&#eGaq#ePysJNtgnV91', { log: false });
    cy.get('input.login-button').should('be.enabled').click();
    cy.get('.dashboard_container').should('be.visible');
    cy.takeStepScreenshot('01-login-success');

    /* =====================
       SEARCH FOR "uk"
    ====================== */
    cy.get('input[name="q"]').should('be.visible').clear().type('uk');
    cy.get('button.default-input-button').should('be.enabled').click();
    cy.get('app-consolidated-apis').should('exist');
    cy.get('.dashboard__search-card').should('have.length.greaterThan', 0);
    cy.takeStepScreenshot('02-search-uk-results');

    /* =====================
       OPEN FIRST REPORT
    ====================== */
    cy.get('#item-t3_1peft0s .dashboard__buttons div')
      .should('have.length.at.least', 3)
      .eq(2)
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.get('.dashboard_container').should('be.visible');
    cy.takeStepScreenshot('03-report-opened');

    /* =====================
       ACCOUNT PAGE
    ====================== */
    cy.contains('.sidebar__subitem-content', 'Account').should('be.visible').click();
    cy.url().should('include', '/dashboard/profile/account');
    cy.get('.company-profile_section-title').contains('Admin Profile').should('be.visible');
    cy.takeStepScreenshot('04-account-page');

    /* =====================
       TOGGLE ACCOUNT SECTIONS
    ====================== */
    cy.get('.company-profile_section').each(($section, index) => {
      cy.wrap($section).find('.company-profile_section-header').scrollIntoView().click({ force: true });
      cy.takeStepScreenshot(`05-account-section-${index + 1}-open`);
      cy.wrap($section).find('.company-profile_section-header').click({ force: true });
      cy.takeStepScreenshot(`06-account-section-${index + 1}-closed`);
    });

    /* =====================
       USERS → ADD USER
    ====================== */
    cy.contains('.sidebar__subitem-content', 'Users').should('be.visible').click();
    cy.contains('button', 'Add User').should('be.visible').click();
    cy.get('form.add-tenant_form').should('be.visible');
    cy.takeStepScreenshot('07-add-user-form');

    cy.get('input[name="username"]').type('abdullah_test');
    cy.get('input[name="email"]').type('abdullah@orionintelligence.com');
    cy.get('input[name="password"]').type('Test@12345');
    cy.get('select[name="role"]').select('Analyst');
    cy.get('select[name="status"]').select('Active');
    cy.contains('.license-card', 'Free').find('input[type="checkbox"]').check({ force: true });
    cy.takeStepScreenshot('08-add-user-filled');

    cy.contains('button', 'Add Tenant').should('be.enabled').click();
    cy.get('tbody').should('be.visible');
    cy.takeStepScreenshot('09-user-added-success');

    /* =====================
       AUDITLOG
    ====================== */
    cy.contains('.sidebar__subitem-content', 'Auditlog').should('be.visible').click();
    cy.get('.directory-listing_header').should('contain.text', 'Audit Logs');
    cy.takeStepScreenshot('11-auditlog-page');

    cy.get('#dashboard-container > span > app-auditlog > div > div > div > div > div.side-menu-container')
      .within(() => {
        cy.get('label.filters-button').should('be.visible').click();
        cy.get('input.filter__date-hidden').first().click({ force: true });
        cy.get('ngb-datepicker').should('be.visible');
        cy.get('ngb-datepicker').find('ngb-datepicker-navigation-select select[title="Select month"]').select('Dec');
        cy.get('ngb-datepicker').find('ngb-datepicker-navigation-select select[title="Select year"]').select('2025');
        cy.get('ngb-datepicker').contains('span.custom-day', '1').click({ force: true });
        cy.get('.sidebar_submit-button').contains('Apply').click({ force: true });
      });
    cy.takeStepScreenshot('12-auditlog-filter-applied');

    /* =====================
       TENANT
    ====================== */
    cy.contains('.sidebar__subitem-content', 'Tenant').should('be.visible').click();
    cy.get('tbody tr').should('have.length.greaterThan', 0);
    cy.get('tbody tr').first().find('button.expand-btn').scrollIntoView().should('be.visible').click();
    cy.takeStepScreenshot('13-tenant-edit-opened');

    /* =====================
       SYSTEM SETTINGS
    ====================== */
    cy.contains('.sidebar__subitem-content', 'System Settings').should('be.visible').click();
    cy.get('app-sidebar-profile-system-settings').should('be.visible');
    cy.takeStepScreenshot('14-system-settings-edit-opened');

    /* =====================
       GENERAL INTELLIGENCE
    ====================== */
    cy.get('div.sidebar__item-dropdown').contains('General Intelligence').scrollIntoView().click({ force: true });
    cy.takeStepScreenshot('15-general-intelligence-dropdown-opened');

    /* =====================
       DATA SECTIONS
       Iterate all dropdowns and take screenshots
    ====================== */
    const dataSections = [
      'Data Breach',
      'Discussion',
      'Defacement',
      'Social',
      'Exploit',
      'Feed',
      'Stealer logs',
      'Web Scans',
      'Live APIs',
      'Dump',
      'Tenant'
    ];

    dataSections.forEach((section, index) => {
      cy.get('div.sidebar__item-dropdown')
        .contains(section)
        .scrollIntoView()
        .click({ force: true });

      cy.get('ul.sidebar__subitems .sidebar__subitems-container')
        .should('exist')
        .and('be.visible');

      cy.takeStepScreenshot(`${16 + index}-${section.replace(/\s+/g, '-').toLowerCase()}-page`);
    });

    /* =====================
       CTI Graph (Hotlink)
    ====================== */
    cy.get('a.sidebar__item-dropdown-hotlink')
      .contains('CTI Graph')
      .scrollIntoView()
      .should('be.visible')
      .invoke('removeAttr', 'target') // optional: open in same tab for Cypress
      .click({ force: true });

    cy.get('body').should('contain.text', 'CTI Graph');
    cy.takeStepScreenshot('28-ctigraph-page');

  });
});
