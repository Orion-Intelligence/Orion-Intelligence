import 'cypress-axe';
import "./commands";

if (Cypress.expose("coverage")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@cypress/code-coverage/support");
}

Cypress.on("window:before:load", (win) => {
    const doc = win.document;
    const originalDocumentGetAnimations = win.Document.prototype.getAnimations?.bind(doc);
    const forceInstantBehavior = (options?: ScrollIntoViewOptions | ScrollToOptions | boolean) => {
        if (typeof options === "boolean" || options == null) {
            return options;
        }
        return { ...options, behavior: "auto" as const };
    };

    const originalAnimate = win.Element.prototype.animate;
    win.Element.prototype.animate = function (...args: Parameters<typeof originalAnimate>) {
        const animation = originalAnimate.apply(this, args);
        animation.finish();
        return animation;
    };

    const originalScrollIntoView = win.Element.prototype.scrollIntoView;
    win.Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
        return originalScrollIntoView.call(this, forceInstantBehavior(arg));
    };

    const originalWindowScrollTo = win.scrollTo.bind(win);
    win.scrollTo = ((...args: [ScrollToOptions] | [number, number]) => {
        if (typeof args[0] === "object") {
            return originalWindowScrollTo(forceInstantBehavior(args[0]));
        }
        return originalWindowScrollTo(...args);
    }) as typeof win.scrollTo;

    const originalElementScrollTo = win.Element.prototype.scrollTo;
    win.Element.prototype.scrollTo = function (...args: [ScrollToOptions] | [number, number]) {
        if (typeof args[0] === "object") {
            return originalElementScrollTo.call(this, forceInstantBehavior(args[0]));
        }
        return originalElementScrollTo.call(this, ...args);
    };

    if (win.matchMedia) {
        const originalMatchMedia = win.matchMedia.bind(win);
        win.matchMedia = ((query: string) => {
            const result = originalMatchMedia(query);
            if (query.includes("prefers-reduced-motion")) {
                return {
                    ...result,
                    matches: true,
                    media: query,
                };
            }
            return result;
        }) as typeof win.matchMedia;
    }

    let animationFlushQueued = false;
    const stopAllAnimations = () => {
        const animations = originalDocumentGetAnimations?.({ subtree: true }) ?? [];
        animations.forEach((animation) => {
            try {
                animation.finish();
            }
            catch {
                try {
                    animation.cancel();
                }
                catch {
                    // Ignore animations that cannot be finished or canceled.
                }
            }
        });
    };
    const queueAnimationFlush = () => {
        if (animationFlushQueued) {
            return;
        }
        animationFlushQueued = true;
        win.requestAnimationFrame(() => {
            animationFlushQueued = false;
            stopAllAnimations();
        });
    };

    const style = doc.createElement("style");
    style.setAttribute("data-testid", "instant-animations");
    style.innerHTML = `
      html {
        scroll-behavior: auto !important;
      }

      *,
      *::before,
      *::after {
        transition-property: none !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        transition-timing-function: step-start !important;
        transition: none !important;
        animation-name: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-timing-function: step-start !important;
        animation-iteration-count: 1 !important;
        animation-fill-mode: both !important;
        animation-play-state: paused !important;
        animation: none !important;
        scroll-behavior: auto !important;
        caret-color: auto !important;
      }

      #dashboard-container,
      [data-testid="dashboard-container"],
      [data-testid="dashboard-body"] {
        overflow-x: hidden !important;
      }

      .notif-stagger-item,
      .alert-card-stagger-item {
        opacity: 1 !important;
        transform: none !important;
      }
    `;
    doc.head.appendChild(style);

    new win.MutationObserver(() => {
        queueAnimationFlush();
    }).observe(doc.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
    });

    doc.addEventListener("DOMContentLoaded", () => {
        stopAllAnimations();
        queueAnimationFlush();
        win.setTimeout(stopAllAnimations, 0);
        win.setTimeout(stopAllAnimations, 50);
        win.setTimeout(stopAllAnimations, 150);
    });
});

export {};
