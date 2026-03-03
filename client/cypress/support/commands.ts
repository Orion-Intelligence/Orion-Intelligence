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
    cy.get('[data-cy="login-button"], input.login-button').first().click();
    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 15000 }).should("be.visible");
});
Cypress.Commands.add("loginAsTest1", () => {
    const users = Cypress.env("TEST_USERS") || {};
    const key = Cypress.env("DEFAULT_TEST_USER_KEY") || "testing5";
    const user = users[key];
    if (!user?.username || !user?.password) {
        throw new Error(`Missing test user credentials for key: ${key}`);
    }
    cy.visit("/login");
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password, { log: false });
    cy.get('[data-cy="login-button"], input.login-button').first().click();
    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 15000 }).should("be.visible");
});
Cypress.Commands.add("logout", () => {
    cy.get('img[alt="Logout"]', { timeout: 10000 })
        .first()
        .click();
    cy.contains('li', 'Sign out')
        .first()
        .click({ force: true });
    cy.get('input[name="username"]', { timeout: 10000 })
        .should('exist');
});
Cypress.Commands.add("openTenantsPage", () => {
    cy.contains('app-dashboard-sidebar-items div', 'Tenant')
        .should('be.visible')
        .click();
    cy.url().should('include', '/dashboard/profile/tenant');
});
Cypress.Commands.add("openHomepage", () => {
    cy.contains('app-dashboard-sidebar-items div', 'Homepage')
        .should('be.visible')
        .click();
});
Cypress.Commands.add("clearAllEmails", () => {
    cy.request("DELETE", "http://localhost:8025/api/v1/messages");
});
Cypress.Commands.add("openLastMailAndGetUrl", () => {
    const timeoutMs = 20000;
    const intervalMs = 500;
    const startedAt = Date.now();
    const waitForUrl = (): Cypress.Chainable<string> => {
        return cy
            .request("GET", "http://localhost:8025/api/v1/messages")
            .then((r) => {
            const messages = (r.body?.messages || []) as any[];
            const total = messages.length;
            if (total !== 1) {
                if (Date.now() - startedAt > timeoutMs) {
                    throw new Error(`Expected exactly 1 email, found ${total}`);
                }
                return cy.wait(intervalMs).then(() => waitForUrl());
            }
            const id = messages[0]?.ID as string;
            return cy.request("GET", `http://localhost:8025/api/v1/message/${id}`);
        })
            .then((r: any) => {
            const text = (r.body.Text as string) ||
                (r.body.HTML as string) ||
                (r.body.Snippet as string) ||
                "";
            const match = text.match(/https?:\/\/[^\s*]+/);
            if (!match) {
                if (Date.now() - startedAt > timeoutMs) {
                    throw new Error("Reset URL not found");
                }
                return cy.wait(intervalMs).then(() => waitForUrl());
            }
            const emailUrl = new URL(match[0]);
            const base = new URL(Cypress.config("baseUrl") as string);
            emailUrl.protocol = base.protocol;
            emailUrl.hostname = base.hostname;
            emailUrl.port = base.port;
            return cy.wrap(emailUrl.toString());
        });
    };
    return waitForUrl().then((url) => cy.request("GET", "http://localhost:8025/api/v1/messages").then((r) => {
        const total = (r.body?.messages || []).length;
        if (total !== 1) {
            throw new Error(`Expected exactly 1 email at end, found ${total}`);
        }
        return url;
    }));
});
