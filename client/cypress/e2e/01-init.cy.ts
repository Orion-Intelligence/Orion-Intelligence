describe('Orion Intelligence - App Initialization', () => {
  it('loads the login page', () => {
    cy.visit('/');
    cy.get('[data-testid="login-page"]').should('be.visible');
  });
});
