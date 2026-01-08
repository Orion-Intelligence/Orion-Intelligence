export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("/login");
  cy.get('input[name="username"]').type(Cypress.env("ADMIN_USERNAME"));
  cy.get('input[name="password"]').type(Cypress.env("ADMIN_PASSWORD"), { log: false });
  cy.get("input.login-button").click();
  cy.get(".dashboard_container").should("be.visible");
});

Cypress.Commands.add("logout", () => {
  cy.get('div.profile_category.profile_logout_icon', { timeout: 10000 })
    .should('exist')
    .click({ force: true });

  cy.get('li.profile-item')
    .contains('Sign out')
    .should('exist')
    .click({ force: true });

  cy.get('input[name="username"]', { timeout: 10000 })
    .should('exist');
});
