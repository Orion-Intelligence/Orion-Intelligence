import 'cypress-axe';
import "./commands";

if (Cypress.env("coverage")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@cypress/code-coverage/support");
}

Cypress.on("window:before:load", (win) => {
    const doc = win.document;
    const style = doc.createElement("style");
    style.setAttribute("data-cy", "disable-animations");
    style.innerHTML = `
      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        animation-play-state: paused !important;
        scroll-behavior: auto !important;
        caret-color: auto !important;
      }
    `;
    doc.head.appendChild(style);
});

export {};
