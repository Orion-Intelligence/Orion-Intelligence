export {};
declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
            loginAsTest1(): Chainable<void>;
            logout(): Chainable<void>;
            logoutIfLoggedIn(): Chainable<void>;
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
    cy.get('[data-cy="dashboard-main"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 15000 })
        .filter(':visible')
        .should('have.length.greaterThan', 0);
});
Cypress.Commands.add("loginAsTest1", () => {
    const users = Cypress.env("TEST_USERS") || {};
    const key = "testing4";
    const user = users[key];
    if (!user?.username || !user?.password) {
        throw new Error(`Missing test user credentials for key: ${key}`);
    }
    cy.visit("/login");
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password, { log: false });
    cy.get('[data-cy="login-button"], input.login-button').first().click();
    cy.get('[data-cy="dashboard-main"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 15000 })
        .filter(':visible')
        .should('have.length.greaterThan', 0);
});
Cypress.Commands.add("logout", () => {
    cy.location('pathname').then((pathname) => {
        if (pathname.includes('/login')) return;

        if (Cypress.$('[data-cy="profile-menu"]').length > 0) {
            cy.get('[data-cy="profile-menu"]', { timeout: 10000 }).then(($menus) => {
                const $visibleMenu = $menus.filter(':visible').first();
                if (!$visibleMenu.length) return;
                cy.wrap($visibleMenu).should('be.visible').click({ scrollBehavior: false });
            });
        } else {
            cy.get('img[alt="Logout"]', { timeout: 10000 }).then(($icons) => {
                const $visibleIcon = $icons.filter(':visible').first();
                if (!$visibleIcon.length) return;
                cy.wrap($visibleIcon).should('be.visible').click({ scrollBehavior: false });
            });
        }

        if (Cypress.$('li[data-cy="signout-btn"]').length > 0) {
            cy.get('li[data-cy="signout-btn"]', { timeout: 10000 }).then(($signouts) => {
                const $visibleSignout = $signouts.filter(':visible').first();
                if (!$visibleSignout.length) return;
                cy.wrap($visibleSignout).should('be.visible').click({ scrollBehavior: false });
            });
        } else {
            cy.contains('li', 'Sign out', { timeout: 10000 })
                .should('be.visible')
                .click({ scrollBehavior: false });
        }

        cy.get('input[name="username"], [data-cy="login-user"]', { timeout: 10000 }).should('exist');
    });
});
Cypress.Commands.add("logoutIfLoggedIn", () => {
    cy.location('pathname').then((pathname) => {
        if (pathname.includes('/login')) return;
        if (Cypress.$('body').length === 0) return;
        cy.scrollTo("top", { ensureScrollable: false });
        const $menus = Cypress.$('[data-cy="profile-menu"]');
        if (!$menus.length) return;
        const $visibleMenu = $menus.filter(':visible').first();
        if (!$visibleMenu.length) return;
        cy.wrap($visibleMenu).click({ scrollBehavior: false });

        if (Cypress.$('li[data-cy="signout-btn"]').length === 0) return;

        cy.get('li[data-cy="signout-btn"]').then(($signouts) => {
            const $visibleSignout = $signouts.filter(':visible').first();
            if (!$visibleSignout.length) return;
            cy.wrap($visibleSignout).click({ scrollBehavior: false });
        });

        cy.get('[data-cy="login-user"]', { timeout: 10000 })
            .should("exist");
    });
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
