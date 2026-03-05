describe('Orion Intelligence - Login Session', () => {
  it('logs in as admin and signs out successfully', () => {
    cy.loginAsAdmin();
    cy.get('[data-testid="dashboard-main"]').should('be.visible');
    cy.get('[data-testid="profile-menu"]').click();
    cy.get('li[data-testid="signout-btn"]').click({scrollBehavior: false});
    cy.get('[data-testid="login-user"]').should('exist');
    cy.logout();
  });
});
