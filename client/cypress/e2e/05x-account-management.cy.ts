/// <reference types="cypress" />

describe('Orion Intelligence – Account Settings Basic Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Change image, toggle theme, toggle 2FA', () => {
    cy.visit('/dashboard');

    cy.contains(/profile|account|settings/i)
      .scrollIntoView()
      .click({ force: true });

    cy.contains('.user-settings_section', 'Admin Profile')
      .within(() => {
        cy.get('input[type="file"]')
          .selectFile('cypress/fixtures/avatar.png', { force: true });

        cy.get('.delete-img-btn').should('exist');
      });

    cy.contains('.user-settings_section', 'Theme')
      .within(() => {
        cy.get('input[type="checkbox"]').click({ force: true });
        cy.get('input[type="checkbox"]').click({ force: true });
      });

    cy.contains('.user-settings_section', '2 Factor Authentication')
      .within(() => {
        cy.get('input[type="checkbox"]').click({ force: true });
        cy.get('input[type="checkbox"]').click({ force: true });
      });
  });
});
