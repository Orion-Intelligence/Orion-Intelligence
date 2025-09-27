import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

const PLACEHOLDER_SRC = '/assets/images/shared/placeholder.svg';

const preload = document.createElement('link');
preload.rel = 'preload';
preload.as = 'image';
preload.href = PLACEHOLDER_SRC;
document.head.prepend(preload);

const preloadPlaceholder = new Image();
preloadPlaceholder.src = PLACEHOLDER_SRC;

const css = document.createElement('link');
css.rel = 'stylesheet';
document.head.appendChild(css);

const mark = (img: HTMLImageElement) => {
  if (img.dataset['ph'] === '1') return;
  const src = img.getAttribute('src') || '';
  const alt = (img.getAttribute('alt') || '').toLowerCase();
  if (alt === 'background' || src.endsWith('Bg.webp')) return;
  img.removeAttribute('alt');
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
        if (n instanceof HTMLImageElement) mark(n);
        else if (n instanceof Element) n.querySelectorAll('img').forEach(i => mark(i as HTMLImageElement));
      });
    } else if (m.type === 'attributes' && m.target instanceof HTMLImageElement && m.attributeName === 'src') {
      mark(m.target);
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

async function preloadAllImagesFromManifest() {
  try {
    const res = await fetch('assets/image-manifest.json', { cache: 'no-cache' });
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

preloadPlaceholder.decode().catch(() => {}).finally(() => {
  preloadAllImagesFromManifest().then();
  bootstrapApplication(AppComponent, appConfig).then();
});
