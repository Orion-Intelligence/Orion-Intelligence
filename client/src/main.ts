import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

const PLACEHOLDER_SRC = '/assets/images/shared/placeholder.svg';
const AUTH_ICON_SRC = '/assets/images/shared/auth_dashboard_icon.svg';
const SEARCH_LOGO_SRC = '/assets/images/shared/logo-wide-light.svg';
const DEFAULT_DASHBOARD_LOGO_SRC = '/assets/images/shared/logo-wide-light.svg';
const preloadImageHref = (href: string) => {
    if (document.head.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    document.head.prepend(link);
};
const preload = document.createElement('link');
preload.rel = 'preload';
preload.as = 'image';
preload.href = PLACEHOLDER_SRC;
document.head.prepend(preload);
const preloadAuthIcon = document.createElement('link');
preloadAuthIcon.rel = 'preload';
preloadAuthIcon.as = 'image';
preloadAuthIcon.href = AUTH_ICON_SRC;
document.head.prepend(preloadAuthIcon);
const preloadSearchLogo = document.createElement('link');
preloadSearchLogo.rel = 'preload';
preloadSearchLogo.as = 'image';
preloadSearchLogo.href = SEARCH_LOGO_SRC;
document.head.prepend(preloadSearchLogo);
preloadImageHref(DEFAULT_DASHBOARD_LOGO_SRC);
const preloadPlaceholder = new Image();
preloadPlaceholder.src = PLACEHOLDER_SRC;
const preloadAuth = new Image();
preloadAuth.src = AUTH_ICON_SRC;
const preloadSearch = new Image();
preloadSearch.src = SEARCH_LOGO_SRC;
const preloadDashboardLogo = new Image();
preloadDashboardLogo.src = DEFAULT_DASHBOARD_LOGO_SRC;
const loadDeferredStylesheet = (href: string) => {
    if (document.querySelector(`link[data-deferred-style="${href}"]`)) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-deferred-style', href);
    document.head.appendChild(link);
};
let bootstrapIconsRequested = false;
const maybeLoadBootstrapIcons = () => {
    if (bootstrapIconsRequested || !document.querySelector('.bi, [class^="bi-"], [class*=" bi-"]')) {
        return;
    }
    bootstrapIconsRequested = true;
    const schedule = () => {
        loadDeferredStylesheet('bootstrap-icons.css');
    };
    if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number; }).requestIdleCallback(() => {
            schedule();
        });
        return;
    }
    setTimeout(() => {
        schedule();
    }, 0);
};
maybeLoadBootstrapIcons();
const mark = (img: HTMLImageElement) => {
    if (img.dataset['ph'] === '1') {
        return;
    }
    const src = img.getAttribute('src') || '';
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    if (!/images\/(statistics|sidebar)\//.test(src)) {
        return;
    }
    if (alt === 'background' ||
        src.endsWith('Bg.webp') ||
        src.endsWith('hint.svg') ||
        src.endsWith('auth_dashboard_icon.svg') ||
        src.includes('search_nav_logo.png') ||
        img.classList.contains('auth-wrapper__image')) {
        return;
    }
    img.dataset['ph'] = '1';
    img.setAttribute('data-ph', '');
    const onload = () => { img.removeAttribute('data-ph'); };
    img.addEventListener('load', onload, { once: true });
};
Array.from(document.images).forEach(i => mark(i as HTMLImageElement));
new MutationObserver(ms => {
    for (const m of ms) {
        if (m.type === 'childList') {
            m.addedNodes.forEach(n => {
                if (n instanceof HTMLImageElement) {
                    mark(n);
                }
                else if (n instanceof Element) {
                    n.querySelectorAll('img').forEach(i => mark(i as HTMLImageElement));
                }
            });
        }
        else if (m.type === 'attributes' && m.target instanceof HTMLImageElement && m.attributeName === 'src') {
            mark(m.target);
        }
    }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
new MutationObserver(() => {
    maybeLoadBootstrapIcons();
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

bootstrapApplication(AppComponent, appConfig).then();
