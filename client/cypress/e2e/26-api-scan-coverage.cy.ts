describe('Orion Intelligence - API Scanner Coverage (real backend)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  function runScan(route: string, query: string, alias: string, endpoint: string) {
    cy.intercept('POST', endpoint).as(alias);
    cy.visit(route);
    cy.get('[data-testid="scan-primary-input"]', { timeout: 120000 }).filter(':visible').first()
      .should('be.visible').clear().type(query);
    cy.get('[data-testid="scan-search-button"]').filter(':visible').first()
      .should('not.be.disabled').click({ force: true });
    cy.wait(`@${alias}`, { timeout: 120000 });
  }

  it('dispatches a social scanner job to the backend', () => {
    runScan('/dashboard/api/social-scanner', 'testuser', 'dynSocial', '**/api/dynamic/social');
    cy.docsScreenshot('api-social-scanner');
  });

  it('dispatches a software scanner job to the backend', () => {
    runScan('/dashboard/api/software-scanner', 'chrome', 'dynSoftware', '**/api/dynamic/software');
    cy.docsScreenshot('api-software-scanner');
  });

  it('dispatches a crypto scanner job to the backend', () => {
    runScan('/dashboard/api/crypto-scanner', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'cryptoScan', '**/api/crypto/scan');
    cy.docsScreenshot('api-crypto-scanner');
  });
});
