describe('Orion Intelligence - Live Login Session', () => {
  it('logs in on live and signs out successfully', () => {

    cy.loginAsAdminLive();

    cy.get('[data-testid="dashboard-main"]').should('be.visible');

    cy.get('[data-testid="profile-menu"]').click();

    cy.get('li[data-testid="signout-btn"]')
      .click({ scrollBehavior: false });

    cy.get('[data-testid="login-user"]').should('exist');

  });
});
