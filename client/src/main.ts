import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

const PLACEHOLDER_SRC = '/assets/images/shared/placeholder.svg';
const SEARCH_LOGO_SRC = '/assets/images/sidebar/search_nav_logo.png';
const CSS_HREF = '/assets/placeholder.css';
const MANIFEST_URL = 'assets/precache-manifest.json';
const STATS_DIR = '/assets/images/statistics/';
const OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src']
};

const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.prepend(link);
  const img = new Image();
  img.src = src;
  return img;
};

const preloadPlaceholder = preloadImage(PLACEHOLDER_SRC);
const preloadSearchLogo = preloadImage(SEARCH_LOGO_SRC);

const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = CSS_HREF;
document.head.appendChild(cssLink);

const mark = (img: HTMLImageElement) => {
  if (img.dataset['ph'] === '1') return;
  const src = img.getAttribute('src') || '';
  if (!src.includes(STATS_DIR)) return;
  img.dataset['ph'] = '1';
  img.setAttribute('data-ph', '');
  const onload = () => img.removeAttribute('data-ph');
  img.addEventListener('load', onload, { once: true });
};

for (const i of Array.from(document.images)) mark(i as HTMLImageElement);

new MutationObserver(ms => {
  for (const m of ms) {
    if (m.type === 'childList') {
      m.addedNodes.forEach(n => {
        if (n instanceof HTMLImageElement) mark(n);
        else if (n instanceof Element) n.querySelectorAll('img').forEach(i => mark(i as HTMLImageElement));
      });
    } else if (m.type === 'attributes' && m.target instanceof HTMLImageElement && m.attributeName === 'src') {
      mark(m.target);
    }
  }
}).observe(document.documentElement, OBSERVER_OPTIONS);

async function preloadAllImagesFromManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return;
    const list: string[] = await res.json();
    for (const href of list) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = new URL(href, document.baseURI).toString();
      document.head.appendChild(link);
    }
  } catch {}
}

Promise.allSettled([
  preloadPlaceholder.decode(),
  preloadSearchLogo.decode()
]).finally(() => {
  preloadAllImagesFromManifest().then();
  bootstrapApplication(AppComponent, appConfig).then();
});
