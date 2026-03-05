describe('Orion Intelligence – Init', () => {
  it('should load the app', () => {
    cy.visit('/');
    cy.get('[data-cy="login-page"]').should('be.visible');
  });
});
