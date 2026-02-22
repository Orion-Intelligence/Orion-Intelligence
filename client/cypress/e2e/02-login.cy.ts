describe('Orion Intelligence – Login', () => {
  it('Login session testing', () => {
    cy.loginAsAdmin();

    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .dashboard_container').should('be.visible');
    cy.logout();
  });
});
