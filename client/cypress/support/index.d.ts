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
            logout(): Chainable<void>;
            typeSlow(selector: string, value: string, options?: SlowTypeOptions): Chainable<void>;
            startInterceptTracking(): Chainable<void>;
            waitForIntercepts(options?: { timeout?: number; idleMs?: number }): Chainable<void>;
            openSideFilter(): Chainable<void>;
            closeSideFilter(): Chainable<void>;
            applySideFilter(): Chainable<void>;
            scrollDashboardToTop(): Chainable<void>;
            scrollDashboardToBottom(): Chainable<void>;
        }
    }
}
