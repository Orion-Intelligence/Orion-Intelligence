import { applyNeutralBrand, restoreNeutralBrand, type NeutralBrandState } from "./brand-neutralize";

export {};
type SlowTypeOptions = {
    submit?: boolean;
    delay?: number;
    settleMs?: number;
};

type CypressAutomation = typeof Cypress & {
    automation(eventName: string, options: Record<string, unknown>): Promise<unknown>;
};

const NAV_DEBUG_DIR = "/tmp/orion-geo-navlog";
const navDebugLog: string[] = [];
const navDebugPush = (entry: string) => {
    navDebugLog.push(`${new Date().toISOString()} [${Cypress.currentTest?.title ?? "hook"}] ${entry}`);
    if (navDebugLog.length > 400) {
        navDebugLog.splice(0, navDebugLog.length - 400);
    }
};

Cypress.on("window:before:load", (win) => {
    navDebugPush(`PAGE LOAD ${win.location.href}`);
    (["pushState", "replaceState"] as const).forEach((name) => {
        const original = win.history[name].bind(win.history);
        win.history[name] = (data: unknown, unused: string, url?: string | URL | null) => {
            navDebugPush(`${name} ${String(url)}\n${new Error().stack}`);
            return original(data, unused, url);
        };
    });
    win.addEventListener("popstate", () => navDebugPush(`popstate ${win.location.href}\n${new Error().stack}`));
    win.addEventListener("error", (event) => navDebugPush(`window error ${event.message}\n${(event.error as Error | undefined)?.stack ?? ""}`));
    win.addEventListener("unhandledrejection", (event) => navDebugPush(`unhandledrejection ${String((event.reason as Error | undefined)?.stack ?? event.reason)}`));
    const watched = /\/api\/(token|logout|get\/tenant\/node|admin\/backups)/;
    const originalFetch = win.fetch.bind(win);
    win.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method ?? (input instanceof Request ? input.method : "GET");
        const promise = originalFetch(input, init);
        if (watched.test(url)) {
            navDebugPush(`fetch start ${method} ${url}`);
            promise.then((res) => {
                res.clone().text().then((text) => navDebugPush(`fetch done ${res.status} ${method} ${url} body=${text.slice(0, 600)}`), () => navDebugPush(`fetch done ${res.status} ${method} ${url}`));
            }, (err) => navDebugPush(`fetch error ${method} ${url} ${String(err)}`));
        }
        return promise;
    };
    const originalOpen = win.XMLHttpRequest.prototype.open;
    win.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
        const target = String(url);
        if (watched.test(target)) {
            navDebugPush(`xhr start ${method} ${target}`);
            this.addEventListener("loadend", () => navDebugPush(`xhr done ${this.status} ${method} ${target} body=${String(this.responseText ?? "").slice(0, 600)}`));
        }
        return (originalOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
    } as typeof win.XMLHttpRequest.prototype.open;
    const originalConsoleError = win.console.error.bind(win.console);
    win.console.error = (...args: unknown[]) => {
        navDebugPush(`console.error ${args.map((arg) => (arg instanceof Error ? arg.stack ?? arg.message : String(arg))).join(" ")}`);
        originalConsoleError(...args);
    };
});

afterEach(function () {
    if (this.currentTest?.state !== "failed") {
        return;
    }
    const file = `${NAV_DEBUG_DIR}/${Cypress.spec.name}-test-failed-${Date.now()}.txt`;
    void cy.location("href", { log: false }).then((href) => cy.writeFile(file, `FAILED TEST ${this.currentTest?.title}\nFINAL ${href}\n\n${navDebugLog.join("\n\n----\n\n")}`));
});

const waitForLogoutLanding = (attempts = 0): Cypress.Chainable<void> => {
    return cy.document({ log: false }).then((doc) => {
        if (doc.querySelector('[data-testid="login-user"]')) {
            return cy.wrap<void>(undefined, { log: false });
        }
        if (attempts < 120) {
            return cy.wait(500, { log: false }).then(() => waitForLogoutLanding(attempts + 1));
        }
        return cy.location("href", { log: false }).then((href) => {
            const file = `${NAV_DEBUG_DIR}/${Cypress.spec.name}-${Date.now()}.txt`;
            return cy.writeFile(file, `FINAL ${href}\n\n${navDebugLog.join("\n\n----\n\n")}`).then(() => {
                throw new Error(`Logout did not reach the login page (final ${href}); navigation log written to ${file}`);
            });
        });
    });
};

type MailSummary = {
    ID?: string;
};

type MailDetail = {
    Text?: string;
    HTML?: string;
    Snippet?: string;
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
    void cy.clearCookies({ log: false });
    void cy.clearLocalStorage();
    void cy.visit("/login", {
        onBeforeLoad(win) {
            win.localStorage.clear();
            win.sessionStorage.clear();
        },
    });
};

const waitForLoginForm = (reloaded = false, attempts = 0): Cypress.Chainable<void> => {
    return cy.document({ log: false }).then((doc) => {
        if (doc.querySelector('[data-testid="login-user"]')) {
            void cy.get('[data-testid="login-page"]', { timeout: 60000 }).should('be.visible');
            void cy.get('[data-testid="login-user"]', { timeout: 60000 }).should('be.visible');
            void cy.get('[data-testid="login-pass"]', { timeout: 60000 }).should('be.visible');
            return cy.wrap<void>(undefined, { log: false });
        }

        if (attempts < 20) {
            return cy.wait(500, { log: false }).then(() => waitForLoginForm(reloaded, attempts + 1));
        }

        if (!reloaded) {
            void cy.reload();
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
        let screenshotClip: { x: number; y: number; width: number; height: number; scale: number } | undefined;
        let appWindow: Window | undefined;
        let neutralState: NeutralBrandState | undefined;
        void options;

        const captureSurface = () => (Cypress as unknown as CypressAutomation).automation("remote:debugger:protocol", {
            command: "Page.captureScreenshot",
            params: {
                captureBeyondViewport: false,
                clip: screenshotClip,
                format: "png",
                fromSurface: true,
            },
        });

        const extractScreenshotData = (result: unknown): string => {
            const data = typeof result === "string" ? result : (result as { data?: unknown } | null)?.data;
            if (typeof data !== "string" || data.length === 0) {
                throw new Error(`Browser returned no data for docs screenshot: ${name}`);
            }
            return data;
        };

        const writeShot = (data: string, variant: "user-manual" | "user-manual-neutral") =>
            cy.task("writeDocScreenshot", { data, name: taskScreenshotName, specName: Cypress.spec.name, variant }, { log: false });

        return cy.window({ log: false }).then((win) => {
            appWindow = win;
            const topWindow = win.top;
            if (!topWindow) {
                throw new Error(`Unable to resolve the Cypress runner window for docs screenshot: ${name}`);
            }

            const iframe = Array.from(topWindow.document.querySelectorAll("iframe"))
                .find((frame) => frame.contentWindow === win);
            if (!iframe) {
                throw new Error(`Unable to resolve the application frame for docs screenshot: ${name}`);
            }

            const rect = iframe.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) {
                throw new Error(`Application frame has invalid dimensions for docs screenshot: ${name}`);
            }

            const viewportWidth = Number(Cypress.config("viewportWidth")) || Math.round(win.innerWidth);
            const viewportHeight = Number(Cypress.config("viewportHeight")) || Math.round(win.innerHeight);
            screenshotClip = {
                x: Math.max(0, rect.left),
                y: Math.max(0, rect.top),
                width: rect.width,
                height: rect.height,
                scale: Math.min(
                    viewportWidth / rect.width,
                    viewportHeight / rect.height,
                ),
            };
        }).then(() => cy.wait(50, { log: false })).then(() => {
            if (!screenshotClip) {
                throw new Error(`Missing capture bounds for docs screenshot: ${name}`);
            }
            return captureSurface();
        }).then((result) => writeShot(extractScreenshotData(result), "user-manual")).then(() => {
            if (appWindow) {
                neutralState = applyNeutralBrand(appWindow);
            }
            return cy.wait(80, { log: false });
        }).then(() => {
            if (appWindow) {
                applyNeutralBrand(appWindow, neutralState);
            }
            return cy.wait(30, { log: false });
        }).then(() => captureSurface().then(
            (result) => {
                restoreNeutralBrand(neutralState);
                neutralState = undefined;
                return result;
            },
            (error) => {
                restoreNeutralBrand(neutralState);
                neutralState = undefined;
                throw error;
            },
        )).then((result) => writeShot(extractScreenshotData(result), "user-manual-neutral")).then(() => cy.wrap<void>(undefined, { log: false }));
    });
});

const getSlowTypeInput = (selector: string) => cy.get(selector).first().scrollIntoView().should('be.visible').and('not.be.disabled');

Cypress.Commands.add("typeSlow", (selector: string, value: string, options: SlowTypeOptions = {}) => {
    const delay = options.delay ?? 0;
    const settleMs = options.settleMs ?? 250;
    const submit = options.submit ?? false;

    const typeValue = (typeDelay = delay) => {
        void getSlowTypeInput(selector).click({ force: true });
        void getSlowTypeInput(selector).type('{selectall}{backspace}', { force: true });
        void cy.wait(settleMs);
        void getSlowTypeInput(selector).type(value, { force: true, delay: typeDelay });
    };

    typeValue();
    getSlowTypeInput(selector).then(($input) => {
        if (String($input.val() ?? '') !== value) {
            typeValue(0);
        }
    });
    void getSlowTypeInput(selector).should('have.value', value);

    if (submit) {
        void cy.wait(settleMs);
        void getSlowTypeInput(selector).type('{enter}', { force: true });
    }

    return cy.wrap<void>(undefined, { log: false });
});

Cypress.Commands.add("loginAsAdmin", () => {
    cy.env(["ADMIN_USERNAME", "ADMIN_PASSWORD"]).then(({ ADMIN_USERNAME, ADMIN_PASSWORD }) => {
        void cy.intercept({ method: "POST", pathname: "**/api/token" }).as("loginRequest");
        void cy.visitLoginWithCleanAuthState();
        void waitForLoginForm();
        void cy.get('[data-testid="login-user"]').clear().type(ADMIN_USERNAME);
        void cy.get('[data-testid="login-pass"]').clear().type(ADMIN_PASSWORD, { log: false });
        void cy.get('[data-testid="login-button"]').first().click();
        void cy.waitForLoginRequest();
        void cy.get('[data-testid="profile-menu"], [data-testid="dashboard-main"], [data-testid="dashboard-container"]')
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
        void cy.intercept({ method: "POST", pathname: "**/api/token" }).as("loginRequest");
        void cy.visitLoginWithCleanAuthState();
        void waitForLoginForm();
        void cy.get('[data-testid="login-user"]').clear().type(user.username);
        void cy.get('[data-testid="login-pass"]').clear().type(user.password, { log: false });
        void cy.get('[data-testid="login-button"]').first().click();
        void cy.waitForLoginRequest();
        void cy.get('[data-testid="profile-menu"], [data-testid="dashboard-main"], [data-testid="dashboard-container"]')
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
            void cy.intercept("GET", "**/api/insight", {
                statusCode: 200,
                body: {
                    insights: { general: {}, leak: {}, defacement: {} },
                    latestDocument: { generic_model: [], leak_model: [], defacement_model: [], chat_model: [], exploit_model: [] },
                },
            });
            void cy.scrollTo("top", { ensureScrollable: false });
            void cy.wrap(profileMenu).scrollIntoView().click({ force: true });
            void cy.then(() => navDebugPush("LOGOUT CLICK"));
            void cy.get('[data-testid="signout-btn"]').first().scrollIntoView().click({ force: true });
            void waitForLogoutLanding();
            void cy.clearCookies({ log: false });
            void cy.clearLocalStorage();
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
    void cy.scrollDashboardToTop();
    void cy.get('[data-testid="side-filter-open"]').filter(':visible').first().should('be.visible').click();
    void cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
});
Cypress.Commands.add("closeSideFilter", () => {
    cy.window().then((win) => {
        const x = win.innerWidth / 2;
        const y = 10;

        const target = win.document.elementFromPoint(x, y) as HTMLElement | null;

        if (!target) {
            return;
        }

        void cy.wrap(target).click('center', { force: true });
    });
});
Cypress.Commands.add("applySideFilter", () => {
    void cy.get('[data-testid="side-filter-apply"]')
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true, waitForAnimations: false, animationDistanceThreshold: 0 });
});
Cypress.Commands.add("clearAllEmails", () => {
    void cy.request("DELETE", "http://localhost:8025/api/v1/messages");
});
Cypress.Commands.add("openLastMailAndGetUrl", () => {
    const timeoutMs = 20000;
    const intervalMs = 500;
    const startedAt = Date.now();
    const waitForUrl = (): Cypress.Chainable<string> => {
        return cy.request("GET", "http://localhost:8025/api/v1/messages").then((r) => {
            const messages = (r.body?.messages || []) as MailSummary[];
            const total = messages.length;
            if (total !== 1) {
                if (Date.now() - startedAt > timeoutMs) {
                    throw new Error(`Expected exactly 1 email, found ${total}`);
                }
                return cy.wait(intervalMs).then(() => waitForUrl());
            }
            const id = messages[0]?.ID;
            if (!id) {
                throw new Error("Email ID is missing");
            }
            return cy.request<MailDetail>("GET", `http://localhost:8025/api/v1/message/${id}`).then((messageResponse) => {
                const body = messageResponse.body || {};
                const text = body.Text ||
                    body.HTML ||
                    body.Snippet ||
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
                return emailUrl.toString();
            });
        }) as unknown as Cypress.Chainable<string>;
    };
    return waitForUrl().then((url) => cy.request("GET", "http://localhost:8025/api/v1/messages").then((r) => {
        const total = (r.body?.messages || []).length;
        if (total !== 1) {
            throw new Error(`Expected exactly 1 email at end, found ${total}`);
        }
        return url;
    }));
});
