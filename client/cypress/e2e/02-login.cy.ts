describe('Orion Intelligence – Login', () => {
  it('Login session testing', () => {
    cy.loginAsAdmin();

    cy.visit('/dashboard');
    cy.get('.dashboard_container').should('be.visible');
  });
});
