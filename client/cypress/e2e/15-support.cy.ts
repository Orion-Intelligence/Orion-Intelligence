describe('Help & Support', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('opens and closes the support popup', () => {
    cy.visit('/dashboard');

    cy.get('img[alt="Logout"]')
      .closest('a.profile-dropdown-toggle')
      .click({ force: true });

    cy.get('ul.profile-dropdown')
      .should('have.class', 'show');

    cy.contains('li .profile_theme-toggle.profile-item span', 'Help & Support')
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
