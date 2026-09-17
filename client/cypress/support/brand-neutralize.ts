const NEUTRAL_NAME = "Intelligence Platform";

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="pfm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="16" fill="url(#pfm-g)"/><g fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"><path d="M32 15a17 17 0 0 1 17 17"/><path d="M32 49a17 17 0 0 1 -17 -17"/></g><circle cx="32" cy="32" r="5" fill="#ffffff"/></svg>`;

function wordmarkSvg(textColor: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="410" height="64" viewBox="0 0 410 64"><defs><linearGradient id="pfw-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><rect x="6" y="12" width="40" height="40" rx="12" fill="url(#pfw-g)"/><g fill="none" stroke="#ffffff" stroke-width="2.7" stroke-linecap="round"><path d="M26 22a10 10 0 0 1 10 10"/><path d="M26 42a10 10 0 0 1 -10 -10"/></g><circle cx="26" cy="32" r="3.4" fill="#ffffff"/><text x="54" y="42" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="${textColor}">${NEUTRAL_NAME}</text></svg>`;
}

const MARK_URI = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`;
const WORDMARK_LIGHT_URI = `data:image/svg+xml,${encodeURIComponent(wordmarkSvg("#1e293b"))}`;
const WORDMARK_DARK_URI = `data:image/svg+xml,${encodeURIComponent(wordmarkSvg("#e2e8f0"))}`;
const NEUTRAL_URIS = new Set([MARK_URI, WORDMARK_LIGHT_URI, WORDMARK_DARK_URI]);

const LOGO_SRC = /logo|\/api\/s\/static\/system\//i;
const HAS_ORION = /orion/i;
const ORION_FULL = /Orion Intelligence/gi;
const ORION_WORD = /\bOrion\b/gi;
const BG_TARGETS = '[class*="logo" i],[class*="brand" i],[id*="logo" i],[style*="background"]';

export interface NeutralBrandState {
    imgs: Array<[HTMLImageElement, string | null, string | null]>;
    bgs: Array<[HTMLElement, string]>;
    texts: Array<[Text, string]>;
}

function neutralizeText(value: string): string {
    return value.replace(ORION_FULL, NEUTRAL_NAME).replace(ORION_WORD, NEUTRAL_NAME);
}

function logoUriFor(source: string): string {
    if (/light/i.test(source)) {
        return WORDMARK_LIGHT_URI;
    }
    if (/wide/i.test(source)) {
        return WORDMARK_DARK_URI;
    }
    return MARK_URI;
}

export function applyNeutralBrand(win: Window, state?: NeutralBrandState): NeutralBrandState {
    const collected: NeutralBrandState = state || { imgs: [], bgs: [], texts: [] };
    const doc = win.document;
    if (!doc || !doc.body) {
        return collected;
    }

    try {
        doc.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src") || "";
            if (NEUTRAL_URIS.has(src)) {
                return;
            }
            const srcset = img.getAttribute("srcset") || "";
            if (LOGO_SRC.test(src) || LOGO_SRC.test(srcset)) {
                collected.imgs.push([img, img.getAttribute("src"), img.getAttribute("srcset")]);
                img.setAttribute("src", logoUriFor(src || srcset));
                if (img.hasAttribute("srcset")) {
                    img.removeAttribute("srcset");
                }
            }
        });

        doc.querySelectorAll(BG_TARGETS).forEach((node) => {
            const el = node as HTMLElement;
            if (!el.style) {
                return;
            }
            let bg = el.style.backgroundImage || "";
            if (!bg || bg === "none") {
                try {
                    bg = win.getComputedStyle(el).backgroundImage || "";
                } catch {
                    bg = "";
                }
            }
            if (bg && bg !== "none" && LOGO_SRC.test(bg) && bg.indexOf("data:image/svg+xml") === -1) {
                collected.bgs.push([el, el.style.backgroundImage]);
                el.style.backgroundImage = `url("${logoUriFor(bg)}")`;
            }
        });

        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode() as Text | null;
        while (node) {
            const value = node.nodeValue || "";
            if (HAS_ORION.test(value)) {
                const replaced = neutralizeText(value);
                if (replaced !== value) {
                    collected.texts.push([node, value]);
                    node.nodeValue = replaced;
                }
            }
            node = walker.nextNode() as Text | null;
        }
    } catch {
        /* best effort: restore below undoes whatever was applied */
    }

    return collected;
}

export function restoreNeutralBrand(state: NeutralBrandState | undefined): void {
    if (!state) {
        return;
    }
    try {
        for (let i = state.texts.length - 1; i >= 0; i--) {
            const [node, value] = state.texts[i];
            node.nodeValue = value;
        }
        for (let i = state.bgs.length - 1; i >= 0; i--) {
            const [el, backgroundImage] = state.bgs[i];
            el.style.backgroundImage = backgroundImage;
        }
        for (let i = state.imgs.length - 1; i >= 0; i--) {
            const [img, src, srcset] = state.imgs[i];
            if (src === null) {
                img.removeAttribute("src");
            } else {
                img.setAttribute("src", src);
            }
            if (srcset === null) {
                img.removeAttribute("srcset");
            } else {
                img.setAttribute("srcset", srcset);
            }
        }
    } catch {
        /* best effort */
    }
}
