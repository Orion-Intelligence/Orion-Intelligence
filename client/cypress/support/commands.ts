// cypress/support/commands.ts
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

// --------- LOGIN COMMAND ---------
Cypress.Commands.add("loginAsAdmin", () => {
  // Visit login page
  cy.visit("/login");

  // Type username and password
  cy.get('input[name="username"]').type(Cypress.env("ADMIN_USERNAME"));
  cy.get('input[name="password"]').type(Cypress.env("ADMIN_PASSWORD"), { log: false });

  // Click login
  cy.get("input.login-button").click();

  // Ensure dashboard loaded
  cy.get(".dashboard_container").should("be.visible");
});

// --------- LOGOUT COMMAND ---------
Cypress.Commands.add("logout", () => {
  // Click profile button to open dropdown
  cy.get('div.profile_category.profile_logout_icon')
    .should('be.visible')
    .click({ force: true });

  // Wait for dropdown and click "Sign out"
  cy.get('li.profile-item')
    .contains('Sign out')
    .should('be.visible')
    .click({ force: true });

  // Ensure login page is visible
  cy.get('input[name="username"]', { timeout: 10000 }) // wait up to 10s
    .should('be.visible');


});
