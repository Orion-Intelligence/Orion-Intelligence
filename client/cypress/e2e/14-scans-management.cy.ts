describe('Dashboard Sections Test – Stealer Logs', () => {

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Web Scans – Basic, Port, Repository & SEO', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Web Scans')
      .should('be.visible')
      .click();

    cy.contains('app-dashboard-sidebar-items div', 'Basic Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.contains('div', 'Security Posture')
      .should('exist');

    cy.contains('h3', 'Findings')
      .first()
      .click();

    cy.contains('app-dashboard-sidebar-items div', 'Port Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.contains('div', 'Security Posture')
      .should('exist');

    cy.contains('app-dashboard-sidebar-items div', 'Repository Scan')
      .click();

    cy.get('input[placeholder="Repository"]')
      .clear()
      .type('https://github.com/juice-shop/juice-shop');

    cy.contains('button', 'Search')
      .click();

    cy.get('app-code-block')
      .should('exist');

    cy.get('button[apptooltip="Download"]')
      .click();

    cy.get('button[apptooltip="Print"]')
      .click();

    cy.contains('app-dashboard-sidebar-items div', 'SEO Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.contains('app-dashboard-sidebar-items div', 'APK Scan')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk', { force: true });

    cy.contains('span', 'success', { timeout: 300000 })
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

    cy.contains('span', 'success', { timeout: 300000 })
      .should('be.visible');

  });

  it('Entity APIs → Email Breach, Social Scanner, Playstore Scanner, Software Scanner', () => {

    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'Entity API')
      .should('be.visible')
      .click();

        cy.contains('app-dashboard-sidebar-items div', 'File Scanner')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

    cy.contains('span', 'success', { timeout: 300000 })
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

    cy.contains('span', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.contains('app-dashboard-sidebar-items div', 'Email Breach')
      .click();

    cy.get('input[name="q2"]')
      .clear()
      .type('msmannan00@gmail.com');

    cy.contains('button', 'Search')
      .click();

    cy.contains('app-dashboard-sidebar-items div', 'Social Scanner')
      .click();

    cy.get('input[placeholder="Username"]')
      .should('be.visible')
      .clear({ force: true })
      .type('Usama', { force: true });

    cy.contains('button', 'Search')
      .click();


  });




});




after(() => {
  cy.logoutIfLoggedIn();
});
