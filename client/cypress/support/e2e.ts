import 'cypress-axe';
import "./commands";

if (Cypress.env("coverage")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@cypress/code-coverage/support");
}

export {};
