describe('Orion Intelligence – Init', () => {
  before(() => {
    cy.session('admin-login', () => {
      cy.visit('https://try.orionintelligence.org/login');

      cy.get('input[name="username"]').should('be.visible').type('admin');
      cy.get('input[name="password"]').should('be.visible')
        .type('cmUFD@CRw(MpYEj!)^rBhSAxk+HXWbu&#eGaq#ePysJNtgnV91', { log: false });

      cy.get('input.login-button').should('be.enabled').click();
      cy.get('.dashboard_container').should('be.visible');

      // Fixed: use built-in screenshot
      cy.screenshot('01-login-success');
    });
  });

  it('Login session is preserved', () => {
    cy.visit('/dashboard');
    cy.get('.dashboard_container').should('be.visible');
  });
});
