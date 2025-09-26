import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/pages/app/app.component';
import '@angular/localize/init';

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

    console.log(`✅ Preloaded ${list.length} images from image-manifest.json`);
  } catch (err) {
    console.error('❌ Image preloading failed:', err);
  }
}

preloadAllImagesFromManifest();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
