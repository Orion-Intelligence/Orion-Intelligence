export {};
declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
            loginAsTest1(): Chainable<void>;
            logout(): Chainable<void>;
            openSideFilter(): Chainable<void>;
            closeSideFilter(): Chainable<void>;
            applySideFilter(): Chainable<void>;
            scrollDashboardToTop(): Chainable<void>;
            openLastMailAndGetUrl(): Chainable<string>;
            clearAllEmails(): Chainable<void>;
        }
    }
}

Cypress.Commands.add("loginAsAdmin", () => {
    cy.env(["ADMIN_USERNAME", "ADMIN_PASSWORD"]).then(({ ADMIN_USERNAME, ADMIN_PASSWORD }) => {
        cy.visit("/login");
        cy.get('[data-testid="login-user"]').type(ADMIN_USERNAME);
        cy.get('[data-testid="login-pass"]').type(ADMIN_PASSWORD, { log: false });
        cy.get('[data-testid="login-button"], input.login-button').first().click();
        cy.get('[data-testid="profile-menu"], [data-testid="dashboard-main"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 35000 })
            .filter(':visible')
            .should('have.length.greaterThan', 0);
    });
});
Cypress.Commands.add("loginAsTest1", () => {
    cy.env(["TEST_USERS"]).then(({ TEST_USERS }) => {
        const users = TEST_USERS || {};
        const key = "testing4";
        const user = users[key];
        if (!user?.username || !user?.password) {
            throw new Error(`Missing test user credentials for key: ${key}`);
        }
        cy.visit("/login");
        cy.get('input[name="username"]').type(user.username);
        cy.get('input[name="password"]').type(user.password, { log: false });
        cy.get('[data-cy="login-button"], input.login-button').first().click();
        cy.get('[data-testid="profile-menu"], [data-cy="dashboard-main"], [data-cy="dashboard-container"], .dashboard_container', { timeout: 35000 })
            .filter(':visible')
            .should('have.length.greaterThan', 0);
    });
});
Cypress.Commands.add("logout", () => {
    cy.location('pathname').then((pathname) => {
        if (pathname.includes('/login')) return;
        cy.document({ log: false }).then((doc) => {
            if (!doc?.body) {
                return;
            }
            const $body = Cypress.$(doc.body);
            const profileMenu = $body.find('[data-testid="profile-menu"]:visible').first();
            if (!profileMenu.length) {
                return;
            }
            cy.scrollTo("top", { ensureScrollable: false });
            cy.wrap(profileMenu).scrollIntoView().should('be.visible').click();
            cy.get('[data-testid="signout-btn"]', { timeout: 10000 }).filter(':visible').first().scrollIntoView().should('be.visible').click();
            cy.get('[data-testid="login-user"]', { timeout: 10000 }).should('exist');
        });
    });
});
Cypress.Commands.add("scrollDashboardToTop", () => {
    cy.window({ log: false }).then((win) => {
        const containers = Array.from(
            win.document.querySelectorAll<HTMLElement>('#dashboard-container, [data-testid="dashboard-container"], [data-testid="dashboard-body"]')
        );

        containers.forEach((el) => {
            el.scrollTop = 0;
        });
    });
});

Cypress.Commands.add("openSideFilter", () => {
    cy.scrollDashboardToTop();
    cy.get('[data-testid="side-filter-open"]', { timeout: 20000 }).filter(':visible').first().should('be.visible').click();
    cy.get('[data-testid="side-filter-apply"]', { timeout: 20000 }).filter(':visible').first().should('be.visible');
});
Cypress.Commands.add("closeSideFilter", () => {
    cy.window().then((win) => {
        const x = win.innerWidth / 2;
        const y = 10;

        const target = win.document.elementFromPoint(x, y) as HTMLElement | null;

        if (!target) {
            return;
        }

        cy.wrap(target).click('center', { force: true });
    });
});
Cypress.Commands.add("applySideFilter", () => {
    cy.get('[data-testid="side-filter-apply"]', { timeout: 20000 })
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true, waitForAnimations: false, animationDistanceThreshold: 0 });
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
