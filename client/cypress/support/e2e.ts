import 'cypress-axe';
import "@cypress/code-coverage/support";
import "./commands";
export {};
const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition: none !important;
    transition-property: none !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }

  .fade, .collapsing, .collapse, .show {
    transition: none !important;
    animation: none !important;
  }

  .mat-ripple, .mat-ripple-element,
  .cdk-overlay-backdrop, .cdk-overlay-pane,
  .mat-mdc-menu-panel, .mat-mdc-dialog-container {
    transition: none !important;
    animation: none !important;
  }
`;
function injectDisableAnimations(win: Window) {
    const doc = win.document;
    if (!doc.getElementById("cypress-disable-animations")) {
        const style = doc.createElement("style");
        style.id = "cypress-disable-animations";
        style.innerHTML = DISABLE_ANIMATIONS_CSS;
        doc.head.appendChild(style);
    }
    const originalMatchMedia = win.matchMedia.bind(win);
    win.matchMedia = ((query: string) => {
        if (query.includes("prefers-reduced-motion")) {
            return {
                matches: true,
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => false,
            } as unknown as MediaQueryList;
        }
        return originalMatchMedia(query);
    }) as any;
    win.requestAnimationFrame = (cb: FrameRequestCallback) => win.setTimeout(() => cb(performance.now()), 0);
}
Cypress.on("window:before:load", (win) => {
    injectDisableAnimations(win);
});
