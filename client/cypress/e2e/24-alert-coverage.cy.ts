describe('Orion Intelligence - Alert Coverage (real backend)', () => {
  const ALERT_TYPES = ['breach', 'defacement', 'exploit', 'social', 'news', 'strategic'];

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('loads every alert category report from the backend', () => {
    cy.intercept('GET', '**/api/profile/alerts*').as('typedAlerts');
    cy.intercept('GET', '**/api/profile/alerts/filter-options*').as('filterOptions');

    ALERT_TYPES.forEach((type) => {
      cy.visit(`/dashboard/profile/alerts/${type}`);
      cy.get('app-category-alert-report', { timeout: 120000 }).should('exist');
      cy.wait('@typedAlerts', { timeout: 120000 });
      cy.get('[data-testid="tenant-alert-report-table"], app-empty-result', { timeout: 120000 }).should('exist');
    });
    cy.docsScreenshot('alert-category-report');
  });

  it('opens the alert filter sidebar on a category report', () => {
    cy.intercept('GET', '**/api/profile/alerts*').as('alerts');

    cy.visit('/dashboard/profile/alerts/breach');
    cy.get('app-category-alert-report', { timeout: 120000 }).should('exist');
    cy.wait('@alerts', { timeout: 120000 });

    cy.get('[data-testid="tenant-alert-open-sidebar"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="side-filter-overlay"]', { timeout: 120000 }).should('be.visible');
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible').click({ force: true });
  });

  it('opens the alert detail drawer from a report row', () => {
    cy.intercept('GET', '**/api/profile/alerts*').as('alerts');

    cy.visit('/dashboard/profile/alerts/breach');
    cy.get('app-category-alert-report', { timeout: 120000 }).should('exist');
    cy.wait('@alerts', { timeout: 120000 });

    cy.get('body').then(($body) => {
      const row = $body.find('[data-testid="tenant-alert-report-card"]:visible').first();
      if (row.length) {
        cy.wrap(row).scrollIntoView().click({ force: true });
        cy.get('[data-testid="tenant-alert-detail-drawer"]', { timeout: 120000 }).should('be.visible');
        cy.docsScreenshot('alert-detail-drawer');
      }
    });
  });
});
