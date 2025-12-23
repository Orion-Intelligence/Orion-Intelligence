describe('Orion Intelligence – Init', () => {
  it('should load the app', () => {
    cy.visit('/dashboard');
    cy.get('.login-page-container').should('be.visible');
  });
});
