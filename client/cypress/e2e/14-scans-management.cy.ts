describe('Dashboard Sections Test – Stealer Logs', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Web Scans – Basic, Port, Repository & SEO', () => {

    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Web Scans')
      .should('be.visible')
      .click();

    cy.contains('.sidebar__subitem-content', 'Basic Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.get('.search__result-detail')
      .should('exist');

    cy.get('.search__result__section__heading .toggle-btn')
      .first()
      .click();

    cy.contains('.sidebar__subitem-content', 'Port Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.get('.search__result-detail')
      .should('exist');

    cy.contains('.sidebar__subitem-content', 'Repository Scan')
      .click();

    cy.get('input[placeholder="Repository"]')
      .clear()
      .type('https://github.com/juice-shop/juice-shop');

    cy.contains('button', 'Search')
      .click();

    cy.get('app-code-block')
      .should('exist');

    cy.get('button[ng-reflect-tooltip-text="Download"]')
      .click();

    cy.get('button[ng-reflect-tooltip-text="Print"]')
      .click();

    cy.contains('.sidebar__subitem-content', 'SEO Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.contains('.sidebar__subitem-content', 'APK Scan')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk', { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.get('button[aria-label="Download report"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('button[aria-label="Scan another file"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk', { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

  });

  it('Live APIs → Email Breach, Social Scanner, Playstore Scanner, Software Scanner', () => {

    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Live APIs')
      .should('be.visible')
      .click();

        cy.contains('.sidebar__subitem-content', 'File Scanner')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.get('button[aria-label="Download report"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('button[aria-label="Scan another file"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.contains('.sidebar__subitem-content', 'Email Breach')
      .click();

    cy.get('input[name="q2"]')
      .clear()
      .type('msmannan00@gmail.com');

    cy.get('.dash-search-button')
      .click();

    cy.contains('.sidebar__subitem-content', 'Social Scanner')
      .click();

    cy.get('input[placeholder="Username"]')
      .should('be.visible')
      .clear({ force: true })
      .type('Usama', { force: true });

    cy.get('.dash-search-button')
      .click();

    cy.get('.dashboard-result-card .card-subtitle a')
      .should('exist');

    cy.contains('.sidebar__subitem-content', 'Playstore Scanner')
      .click();

    cy.get('input[placeholder="Package / Playstore URL"]')
      .clear()
      .type('https://play.google.com/store/apps/details?id=com.supercell.clashofclans&hl=en');

    cy.get('.dash-search-button')
      .click();

    cy.get('.dashboard-result-card .card-subtitle a')
      .should('exist');

    cy.contains('.sidebar__subitem-content', 'Software Scanner')
      .click();

    cy.get('input[placeholder="Software Name"]')
      .should('be.visible')
      .clear({ force: true })
      .type('GTA V', { force: true });

    cy.get('.dash-search-button')
      .click();

  });

  it('Dashboard → Global Search → Consolidated Scan → Ranked → IOCs', () => {

    cy.visit('/dashboard');

    cy.get('[data-cy="dashboard-general-input"]')
      .should('exist')
      .should('be.visible')
      .clear()
      .type('ucp.edu.pk{enter}');

    cy.contains(
      '.consolidated-scans-title',
      'Threats Scans Report: ucp.edu.pk'
    ).should('exist');

    cy.contains('button', 'Hide details')
      .should('be.visible')
      .click();

    cy.contains('.card_header span', 'Keyword insights')
      .should('exist');

    cy.contains('.card_header span', 'Results General Coverage')
      .should('exist');

    cy.contains('.card_header', 'Keyword insights')
      .find('.toggle-btn')
      .click();

    cy.contains('.card_header', 'Results General Coverage')
      .find('.toggle-btn')
      .click();

    cy.contains('a.nav-link', 'IOCs')
      .should('be.visible')
      .click();
  });

});
