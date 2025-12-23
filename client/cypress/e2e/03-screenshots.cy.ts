describe('Orion Intelligence – Full Stable Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Login', () => {
    cy.visit('/dashboard');
    cy.get('.dashboard_container').should('be.visible');
    cy.screenshot('01-login-success');
  });

  it('Search', () => {
    cy.visit('/dashboard');
    cy.get('input[name="q"]').should('be.visible').clear().type('cities');
    cy.get('button.default-input-button').should('be.enabled').click();
    cy.get('app-consolidated-apis').should('exist');
    cy.get('.dashboard__search-card').should('have.length.greaterThan', 0);
    cy.screenshot('02-search-uk-results');
  });

  // it('Open Report', () => {
  //   cy.visit('/dashboard');
  //   cy.get('#item-t3_1peft0s .dashboard__buttons div')
  //     .should('have.length.at.least', 3)
  //     .eq(2)
  //     .scrollIntoView()
  //     .should('be.visible')
  //     .click();
  //   cy.get('.dashboard_container').should('be.visible');
  //   cy.screenshot('03-report-opened');
  // });
  //
  it('Account', () => {
    cy.visit('/dashboard');
    cy.contains('.sidebar__subitem-content', 'Account').should('be.visible').click();
    cy.url().should('include', '/dashboard/profile/account');
    // cy.get('.company-profile_section-title')
    //   .contains('Admin Profile')
    //   .should('be.visible');
    cy.screenshot('04-account-page');

    // cy.get('.company-profile_section').each(($section, index) => {
    //   cy.wrap($section)
    //     .find('.company-profile_section-header')
    //     .scrollIntoView()
    //     .click({ force: true });
    //   cy.screenshot(`05-account-section-${index + 1}-open`);
    //   cy.wrap($section)
    //     .find('.company-profile_section-header')
    //     .click({ force: true });
    //   cy.screenshot(`06-account-section-${index + 1}-closed`);
    // });
  });

  it('Auditlog', () => {
    cy.visit('/dashboard');
    cy.contains('.sidebar__subitem-content', 'Auditlog').should('be.visible').click();
    cy.get('.directory-listing_header')
      .should('contain.text', 'Audit Logs');
    cy.screenshot('11-auditlog-page');

    cy.get(
      '#dashboard-container > span > app-auditlog > div > div > div > div > div.side-menu-container'
    ).within(() => {
      cy.get('label.filters-button').should('be.visible').click();
      cy.get('input.filter__date-hidden').first().click({ force: true });
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

    cy.screenshot('12-auditlog-filter-applied');
  });

  it('Tenant', () => {
    cy.visit('/dashboard');
    cy.contains('.sidebar__subitem-content', 'Tenant').should('be.visible').click();
    cy.get('tbody tr').should('have.length.greaterThan', 0);
    // cy.get('tbody tr')
    //   .first()
    //   .find('button.expand-btn')
    //   .scrollIntoView()
    //   .should('be.visible')
    //   .click();
    cy.screenshot('13-tenant-edit-opened');
  });

  it('System Settings', () => {
    cy.visit('/dashboard');
    cy.contains('.sidebar__subitem-content', 'System Settings')
      .should('be.visible')
      .click();
    // cy.get('app-sidebar-profile-system-settings')
    //   .should('be.visible');
    cy.screenshot('14-system-settings-edit-opened');
  });

  it('General Intelligence Sections', () => {
    cy.visit('/dashboard');
    cy.get('div.sidebar__item-dropdown')
      .contains('General Intelligence')
      .scrollIntoView()
      .click({ force: true });
    cy.screenshot('15-general-intelligence-dropdown-opened');

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

      cy.screenshot(
        `${16 + index}-${section.replace(/\s+/g, '-').toLowerCase()}-page`
      );
    });
  });

  it('CTI Graph', () => {
    cy.visit('/dashboard');
    cy.get('a.sidebar__item-dropdown-hotlink')
      .contains('CTI Graph')
      .scrollIntoView()
      .should('be.visible')
      .invoke('removeAttr', 'target')
      .click({ force: true });

    cy.get('body').should('contain.text', 'CTI Graph');
    cy.screenshot('28-ctigraph-page');
  });

});
