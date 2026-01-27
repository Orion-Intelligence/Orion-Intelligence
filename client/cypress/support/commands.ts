export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      loginAsTest1(): Chainable<void>;
      logout(): Chainable<void>;
      openTenantsPage(): Chainable<void>;
      openHomepage(): Chainable<void>;
      openLastMailAndGetUrl(): Chainable<string>;
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

Cypress.Commands.add("loginAsTest1", () => {
  cy.visit("/login");
  cy.get('input[name="username"]').type("testing4");
  cy.get('input[name="password"]').type("1qaz!QAZ", { log: false });
  cy.get("input.login-button").click();
  cy.get(".dashboard_container").should("be.visible");
});

Cypress.Commands.add("logout", () => {
  cy.get('img[alt="Logout"]', { timeout: 10000 })
    .closest('a.profile-dropdown-toggle')
    .click({ force: true })

  cy.contains('li.profile-item', 'Sign out')
    .first()
    .click({ force: true })

  cy.get('input[name="username"]', { timeout: 10000 })
    .should('exist');
});

Cypress.Commands.add("openTenantsPage", () => {
  cy.contains('div.sidebar__subitem-content', 'Tenant')
    .should('be.visible')
    .click({ force: true });

  cy.url().should('include', '/dashboard/profile/tenant');
});

Cypress.Commands.add("openHomepage", () => {
  cy.contains('div.sidebar__subitem-content', 'Homepage')
    .should('be.visible')
    .click({ force: true });
});

Cypress.Commands.add("openLastMailAndGetUrl", () => {
  cy.wait(2000)
  return cy
    .request("GET", "http://localhost:8025/api/v1/messages")
    .then((r) => {
      const id = r.body.messages[0].ID;
      return cy.request("GET", `http://localhost:8025/api/v1/message/${id}`);
    })
    .then((r) => {
      const text =
        (r.body.Text as string) ||
        (r.body.HTML as string) ||
        (r.body.Snippet as string) ||
        "";

      const match = text.match(/https?:\/\/[^\s*]+/);
      if (!match) {
        throw new Error("Reset URL not found");
      }

      const emailUrl = new URL(match[0]);
      const base = new URL(Cypress.config("baseUrl") as string);

      emailUrl.protocol = base.protocol;
      emailUrl.hostname = base.hostname;
      emailUrl.port = base.port;

      return emailUrl.toString();
    });
});
