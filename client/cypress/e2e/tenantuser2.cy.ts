describe('Tenant Login – test_for_tenants', () => {

  it('Logs in using tenant credentials', () => {
    cy.visit('http://localhost:4200/login');

    cy.get('input[name="username"]')
      .should('exist')
      .clear()
      .type('test_for_tenants');

    cy.get('input[name="password"]')
      .should('exist')
      .clear()
      .type('1qaz!QAZ', { log: false }); // hide password from logs

    cy.get('input.login-button, input[type="submit"], button')
      .contains(/sign in|login/i)
      .click({ force: true });

    cy.get('.dashboard_container')
      .should('exist');

    cy.contains('test_for_tenants')
      .should('exist');
  });

});
