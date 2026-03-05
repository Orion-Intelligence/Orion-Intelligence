export {};
declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
            openSideFilter(): Chainable<void>;
            closeSideFilter(): Chainable<void>;
        }
    }
}
