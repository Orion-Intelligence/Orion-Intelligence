import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

const PLACEHOLDER_SRC = '/assets/images/shared/placeholder.svg';
const CSS_HREF = '/assets/placeholder.css';
const MANIFEST_URL = 'assets/precache-manifest.json';
const STATS_DIR = '/assets/images/statistics/';
const OBSERVER_OPTIONS: MutationObserverInit = { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] };

const preloadLink = document.createElement('link');
const cssLink = document.createElement('link');
const placeholderImg = new Image();

preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = PLACEHOLDER_SRC;

cssLink.rel = 'stylesheet';
cssLink.href = CSS_HREF;

document.head.prepend(preloadLink);
document.head.appendChild(cssLink);

placeholderImg.src = PLACEHOLDER_SRC;

const mark = (img: HTMLImageElement) => {
  if (img.dataset['ph'] === '1') return;
  const src = img.getAttribute('src') || '';
  if (!src.includes(STATS_DIR)) return;
  img.dataset['ph'] = '1';
  img.setAttribute('data-ph', '');
  const onload = () => { img.removeAttribute('data-ph'); };
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

Promise.allSettled([placeholderImg.decode()]).finally(() => {
  preloadAllImagesFromManifest().then();
  bootstrapApplication(AppComponent, appConfig).then();
});
