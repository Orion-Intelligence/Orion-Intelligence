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
      clearAllEmails(): Chainable<void>;
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
  cy.get(".dashboard_container", { timeout: 10000 }).should("be.visible");
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

Cypress.Commands.add("clearAllEmails", () => {
  cy.request("DELETE", "http://localhost:8025/api/v1/messages");
});

Cypress.Commands.add("openLastMailAndGetUrl", () => {
  const timeoutMs = 20000;
  const intervalMs = 500;
  const startedAt = Date.now();

  const log = (msg: string, data?: any) => cy.task("log", data ? `${msg} ${JSON.stringify(data)}` : msg);

  const waitForUrl = (): Cypress.Chainable<string> => {
    return cy
      .request("GET", "http://localhost:8025/api/v1/messages")
      .then((r) => {
        const msgs = r.body?.messages ?? [];
        const id = msgs?.[0]?.ID as string | undefined;

        log("[mailhog] messages count:", { count: msgs.length });
        if (msgs[0]) {
          log("[mailhog] latest meta:", {
            ID: msgs[0].ID,
            Subject: msgs[0].Content?.Headers?.Subject?.[0],
            To: msgs[0].Content?.Headers?.To?.[0],
            From: msgs[0].Content?.Headers?.From?.[0],
          });
        }

        if (!id) {
          if (Date.now() - startedAt > timeoutMs) {
            throw new Error(`No email received within ${timeoutMs}ms`);
          }
          return cy.wait(intervalMs).then(() => waitForUrl());
        }

        return cy.request("GET", `http://localhost:8025/api/v1/message/${id}`);
      })
      .then((r: any) => {
        const text =
          (r.body?.Text as string) ||
          (r.body?.HTML as string) ||
          (r.body?.Snippet as string) ||
          "";

        log("[mailhog] snippet:", { snippet: text.slice(0, 500) });

        const match = text.match(/https?:\/\/[^\s<>"')\]]+/); // slightly safer than your regex
        if (!match) {
          if (Date.now() - startedAt > timeoutMs) {
            throw new Error(`Reset URL not found within ${timeoutMs}ms`);
          }
          return cy.wait(intervalMs).then(() => waitForUrl());
        }

        log("[mailhog] raw url found:", { url: match[0] });

        const emailUrl = new URL(match[0]);
        const base = new URL(Cypress.config("baseUrl") as string);

        emailUrl.protocol = base.protocol;
        emailUrl.hostname = base.hostname;
        emailUrl.port = base.port;

        const finalUrl = emailUrl.toString();
        log("[mailhog] final url used:", { url: finalUrl });

        return cy.wrap(finalUrl);
      });
  };

  return waitForUrl();
});
