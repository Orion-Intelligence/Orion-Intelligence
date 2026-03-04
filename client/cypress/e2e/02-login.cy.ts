describe('Orion Intelligence – Login', () => {
  it('Login session testing', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-user"]').type(Cypress.env('ADMIN_USERNAME'));
    cy.get('[data-cy="login-pass"]').type(Cypress.env('ADMIN_PASSWORD'), { log: false });
    cy.get('[data-cy="login-button"]').click();

    cy.get('[data-cy="dashboard-main"]').should('be.visible');
    cy.get('[data-cy="profile-menu"]').click();

    cy.get('li[data-cy="signout-btn"]').click({ scrollBehavior: false });
    cy.get('[data-cy="login-user"]').should('exist');
    cy.logoutIfLoggedIn();
  });
});
