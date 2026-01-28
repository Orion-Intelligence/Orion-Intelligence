describe('Orion Intelligence – Login', () => {
  it('Login session testing', () => {
    cy.loginAsAdmin();

    cy.get('.dashboard_container').should('be.visible');
    cy.logout();
  });
});
