describe('Orion Intelligence - Login Session', () => {
  it('logs in as admin and signs out successfully', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-page"]').should('be.visible');
    cy.docsScreenshot('login-page');
    cy.get('[data-testid="reset-password-link"]').click({ force: true });
    cy.get('[data-testid="reset-companymail"]').should('be.visible');
    cy.docsScreenshot('password-reset');

    cy.loginAsAdmin();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="profile-menu"]').click();
    cy.get('li[data-testid="signout-btn"]').click({scrollBehavior: false});
    cy.get('[data-testid="login-user"]').should('exist');
    cy.logout();
  });
});
