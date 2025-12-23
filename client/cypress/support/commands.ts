export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
    }
  }
}

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("/login");

  cy.get('input[name="username"]').type(
    Cypress.env("ADMIN_USERNAME")
  );

  cy.get('input[name="password"]').type(
    Cypress.env("ADMIN_PASSWORD"),
    { log: false }
  );

  cy.get("input.login-button").click();
  cy.get(".dashboard_container").should("be.visible");
});
