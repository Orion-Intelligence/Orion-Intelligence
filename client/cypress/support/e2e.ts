import 'cypress-axe';
import "./commands";

if (Cypress.expose("coverage")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@cypress/code-coverage/support");
}

Cypress.on("window:before:load", (win) => {
    const doc = win.document;
    const style = doc.createElement("style");
    style.setAttribute("data-cy", "instant-animations");
    style.innerHTML = `
      *,
      *::before,
      *::after {
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        caret-color: auto !important;
      }

      #dashboard-container,
      [data-testid="dashboard-container"],
      [data-testid="dashboard-body"] {
        overflow-x: hidden !important;
      }
    `;
    doc.head.appendChild(style);
});

export {};
