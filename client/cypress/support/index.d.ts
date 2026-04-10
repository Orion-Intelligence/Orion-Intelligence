export {};
declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
            openSideFilter(): Chainable<void>;
            closeSideFilter(): Chainable<void>;
            applySideFilter(): Chainable<void>;
            scrollDashboardToTop(): Chainable<void>;
            scrollDashboardToBottom(): Chainable<void>;
        }
    }
}
