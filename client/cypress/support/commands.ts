export {};
type SlowTypeOptions = {
    submit?: boolean;
    delay?: number;
    settleMs?: number;
};

declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
            loginAsTest1(): Chainable<void>;
            visitLoginWithCleanAuthState(): Chainable<void>;
            waitForLoginRequest(alias?: string): Chainable<void>;
            logout(): Chainable<void>;
            typeSlow(selector: string, value: string, options?: SlowTypeOptions): Chainable<void>;
            startInterceptTracking(): Chainable<void>;
            waitForIntercepts(options?: { timeout?: number; idleMs?: number }): Chainable<void>;
            openSideFilter(): Chainable<void>;
            closeSideFilter(): Chainable<void>;
            applySideFilter(): Chainable<void>;
            scrollDashboardToTop(): Chainable<void>;
            scrollDashboardToBottom(): Chainable<void>;
            openLastMailAndGetUrl(): Chainable<string>;
            clearAllEmails(): Chainable<void>;
            docsScreenshot(name: string, options?: Partial<Cypress.ScreenshotOptions>): Chainable<void>;
        }
    }
}

Cypress.Commands.add("startInterceptTracking", () => {
    return cy.wrap<void>(undefined, { log: false });
});

Cypress.Commands.add("waitForIntercepts", () => {
    return cy.wrap<void>(undefined, { log: false });
});

const loginRequestAlias = (alias = "loginRequest"): `@${string}` => (
    alias.startsWith("@") ? alias : `@${alias}`
) as `@${string}`;

const visitLoginWithCleanAuthState = () => {
    cy.clearCookies({ log: false });
    cy.clearLocalStorage(undefined, { log: false });
    cy.visit("/login", {
        onBeforeLoad(win) {
            win.localStorage.clear();
            win.sessionStorage.clear();
        },
    });
};

const waitForLoginForm = (reloaded = false, attempts = 0): Cypress.Chainable<void> => {
    return cy.document({ log: false }).then((doc) => {
        if (doc.querySelector('[data-testid="login-user"]')) {
            cy.get('[data-testid="login-page"]', { timeout: 60000 }).should('be.visible');
            cy.get('[data-testid="login-user"]', { timeout: 60000 }).should('be.visible');
            cy.get('[data-testid="login-pass"]', { timeout: 60000 }).should('be.visible');
            return cy.wrap<void>(undefined, { log: false });
        }

        if (attempts < 20) {
            return cy.wait(500, { log: false }).then(() => waitForLoginForm(reloaded, attempts + 1));
        }

        if (!reloaded) {
            cy.reload();
            return waitForLoginForm(true);
        }

        throw new Error("Login form did not render after visiting /login");
    });
};

Cypress.Commands.add("visitLoginWithCleanAuthState", () => {
    visitLoginWithCleanAuthState();
    return cy.wrap<void>(undefined, { log: false });
});

Cypress.Commands.add("waitForLoginRequest", (alias = "loginRequest") => {
    return cy.wait(loginRequestAlias(alias), { timeout: 60000 })
        .its("response.statusCode")
        .should("be.oneOf", [200, 201])
        .then(() => cy.wrap<void>(undefined, { log: false }));
});

Cypress.Commands.add("docsScreenshot", (name: string, options: Partial<Cypress.ScreenshotOptions> = {}) => {
    return cy.env<{ takeScreenshots?: boolean | string }>(["takeScreenshots"]).then(({ takeScreenshots }) => {
        if (takeScreenshots !== true && takeScreenshots !== "true") {
            return cy.wrap<void>(undefined, { log: false });
        }

        const safeName = String(name || "screenshot").replace(/\\/g, "/").replace(/^\/+/, "") || "screenshot";
        const taskScreenshotName = safeName.startsWith("user-manual/") ? safeName.slice("user-manual/".length) : safeName;
        void options;
        let restoreCaptureState: (() => void) | undefined;
        let screenshotClip: { x: number; y: number; width: number; height: number; scale: number } | undefined;
        const hiddenScrollbarCss = `
            html, body { scrollbar-width: none !important; }
            html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
                width: 0 !important;
                height: 0 !important;
                display: none !important;
            }
        `;

        return cy.window({ log: false }).then((win) => {
            const restoreFns: Array<() => void> = [];
            const appStyle = win.document.createElement("style");
            appStyle.textContent = hiddenScrollbarCss;
            (win.document.head || win.document.documentElement).appendChild(appStyle);
            restoreFns.push(() => appStyle.remove());

            try {
                const topWindow = win.top || win;
                const topDocument = topWindow.document;
                const iframe = Array.from(topDocument.querySelectorAll("iframe"))
                    .find(frame => frame.contentWindow === win)
                    || topDocument.querySelector<HTMLIFrameElement>("iframe.aut-iframe, iframe[data-cy='aut-iframe'], iframe");

                const topStyle = topDocument.createElement("style");
                topStyle.textContent = hiddenScrollbarCss;
                (topDocument.head || topDocument.documentElement).appendChild(topStyle);
                restoreFns.push(() => topStyle.remove());

                if (iframe) {
                    const rect = iframe.getBoundingClientRect();
                    const viewportWidth = Number(Cypress.config("viewportWidth")) || Math.round(win.innerWidth);
                    const viewportHeight = Number(Cypress.config("viewportHeight")) || Math.round(win.innerHeight);
                    const scale = Math.max(
                        viewportWidth / Math.max(1, rect.width),
                        viewportHeight / Math.max(1, rect.height),
                    );
                    screenshotClip = {
                        x: Math.max(0, rect.left),
                        y: Math.max(0, rect.top),
                        width: Math.max(1, rect.width),
                        height: Math.max(1, rect.height),
                        scale,
                    };
                }
            }
            catch {
                screenshotClip = undefined;
            }

            restoreCaptureState = () => {
                restoreFns.reverse().forEach(restore => restore());
                restoreCaptureState = undefined;
            };
        }).then(() => cy.wait(50, { log: false })).then(() => (
            (Cypress as any).automation("remote:debugger:protocol", {
                command: "Page.captureScreenshot",
                params: {
                    captureBeyondViewport: false,
                    ...(screenshotClip ? { clip: screenshotClip } : {}),
                    format: "png",
                    fromSurface: true,
                },
            })
        )).then((result: any) => {
            const data = typeof result === "string" ? result : result?.data;
            expect(data, `docs screenshot ${name}`).to.be.a("string").and.not.be.empty;
            return cy.task("writeDocScreenshot", {
                data,
                name: taskScreenshotName,
                specName: Cypress.spec.name,
            }, { log: false });
        }).then(() => {
            restoreCaptureState?.();
            return cy.wrap<void>(undefined, { log: false });
        });
    });
});

const getSlowTypeInput = (selector: string) => cy.get(selector).first().scrollIntoView().should('be.visible').and('not.be.disabled');

Cypress.Commands.add("typeSlow", (selector: string, value: string, options: SlowTypeOptions = {}) => {
    const delay = options.delay ?? 0;
    const settleMs = options.settleMs ?? 250;
    const submit = options.submit ?? false;

    const typeValue = (typeDelay = delay) => {
        getSlowTypeInput(selector).click({ force: true });
        getSlowTypeInput(selector).type('{selectall}{backspace}', { force: true });
        cy.wait(settleMs);
        getSlowTypeInput(selector).type(value, { force: true, delay: typeDelay });
    };

    typeValue();
    getSlowTypeInput(selector).then(($input) => {
        if (String($input.val() ?? '') !== value) {
            typeValue(0);
        }
    });
    getSlowTypeInput(selector).should('have.value', value);

    if (submit) {
        cy.wait(settleMs);
        getSlowTypeInput(selector).type('{enter}', { force: true });
    }

    return cy.wrap<void>(undefined, { log: false });
});

Cypress.Commands.add("loginAsAdmin", () => {
    cy.env(["ADMIN_USERNAME", "ADMIN_PASSWORD"]).then(({ ADMIN_USERNAME, ADMIN_PASSWORD }) => {
        cy.intercept("POST", "**/api/token").as("loginRequest");
        cy.intercept("POST", "**/api/get/tenant/node").as("tenantNodeRequest");
        cy.visitLoginWithCleanAuthState();
        waitForLoginForm();
        cy.get('[data-testid="login-user"]').clear().type(ADMIN_USERNAME);
        cy.get('[data-testid="login-pass"]').clear().type(ADMIN_PASSWORD, { log: false });
        cy.get('[data-testid="login-button"], input.login-button').first().click();
        cy.waitForLoginRequest();
        cy.wait("@tenantNodeRequest", { timeout: 60000 }).its("response.statusCode").should("be.oneOf", [200, 201]);
        cy.get('[data-testid="profile-menu"], [data-testid="dashboard-main"], [data-testid="dashboard-container"], .dashboard_container')
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
        cy.intercept("POST", "**/api/token").as("loginRequest");
        cy.intercept("POST", "**/api/get/tenant/node").as("tenantNodeRequest");
        cy.visitLoginWithCleanAuthState();
        waitForLoginForm();
        cy.get('[data-testid="login-user"]').clear().type(user.username);
        cy.get('[data-testid="login-pass"]').clear().type(user.password, { log: false });
        cy.get('[data-testid="login-button"], input.login-button').first().click();
        cy.waitForLoginRequest();
        cy.wait("@tenantNodeRequest", { timeout: 60000 }).its("response.statusCode").should("be.oneOf", [200, 201]);
        cy.get('[data-testid="profile-menu"], [data-testid="dashboard-main"], [data-testid="dashboard-container"], .dashboard_container')
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
            cy.intercept("GET", "**/api/insight", {
                statusCode: 200,
                body: {
                    insights: { general: {}, leak: {}, defacement: {} },
                    latestDocument: { generic_model: [], leak_model: [], defacement_model: [], chat_model: [], exploit_model: [] },
                },
            });
            cy.intercept("POST", "**/api/logout").as("logoutRequest");
            cy.scrollTo("top", { ensureScrollable: false });
            cy.wrap(profileMenu).scrollIntoView().click({ force: true });
            cy.get('[data-testid="signout-btn"]').first().scrollIntoView().click({ force: true });
            cy.wait("@logoutRequest", { timeout: 60000 })
                .its("response.statusCode")
                .should("be.oneOf", [200, 204]);
            cy.get('[data-testid="login-user"]').should('exist');
            cy.clearCookies({ log: false });
            cy.clearLocalStorage(undefined, { log: false });
            cy.window({ log: false }).then((win) => {
                win.localStorage.clear();
                win.sessionStorage.clear();
            });
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

Cypress.Commands.add("scrollDashboardToBottom", () => {
    cy.window({ log: false }).then((win) => {
        const containers = Array.from(
            win.document.querySelectorAll<HTMLElement>('#dashboard-container, [data-testid="dashboard-container"], [data-testid="dashboard-body"]')
        );

        containers.forEach((el) => {
            el.scrollTop = el.scrollHeight;
        });
    });
});

Cypress.Commands.add("openSideFilter", () => {
    cy.scrollDashboardToTop();
    cy.get('[data-testid="side-filter-open"]').filter(':visible').first().should('be.visible').click();
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
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
    cy.get('[data-testid="side-filter-apply"]')
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
            const body = r.body || {};
            const text = (body.Text as string) ||
                (body.HTML as string) ||
                (body.Snippet as string) ||
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
