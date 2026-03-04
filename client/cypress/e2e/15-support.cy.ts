describe('Help & Support', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('opens and closes the support popup', () => {
    cy.visit('/dashboard');

    cy.get('img[alt="Logout"]')
      .closest('a')
      .click({ force: true });

    cy.get('ul')
      .should('exist');

    cy.contains('li span', 'Help & Support')
      .should('be.visible')
      .closest('li')
      .click({ force: true });

    cy.get('app-support')
      .should('exist');

    cy.contains('h2', 'Contact Support', { timeout: 10000 })
      .should('be.visible');

    cy.contains('button', 'Cancel')
      .should('be.visible')
      .click();

    cy.contains('h2', 'Contact Support')
      .should('not.exist');
  });
});


after(() => {
  cy.logoutIfLoggedIn();
});
