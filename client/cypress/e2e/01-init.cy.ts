describe('Orion Intelligence – Init', () => {
  it('should load the app', () => {
    cy.visit('/');
    cy.get('[data-cy="login-page-container"], .login-page-container').should('be.visible');

  });
});
