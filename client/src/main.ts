import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

const PLACEHOLDER_SRC = '/assets/images/shared/placeholder.svg';

const s = document.createElement('style');
s.textContent = `
@keyframes ph-alpha{0%{opacity:.25}100%{opacity:.5}}
img[data-ph]{
  background:url('${PLACEHOLDER_SRC}') center/cover no-repeat;
  object-fit:cover;
  border-radius:8px;
  color:transparent;
  font-size:0;
  animation:ph-alpha 1.2s ease-in-out infinite alternate;
}
img[data-ph]:not([width]):not([height]){
  aspect-ratio:1/1;
  min-width:24px;
  min-height:24px;
  display:inline-block;
}
`;
document.head.appendChild(s);

const mark = (img: HTMLImageElement) => {
  if (img.dataset['ph'] === '1') return;
  const src = img.getAttribute('src') || '';
  const alt = img.getAttribute('alt') || '';
  if (alt.toLowerCase() === 'background' || src.endsWith('Bg.webp')) return;
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

preloadAllImagesFromManifest().then();
bootstrapApplication(AppComponent, appConfig).then();
