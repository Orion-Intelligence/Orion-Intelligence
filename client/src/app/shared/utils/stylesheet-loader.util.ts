export interface StylesheetHandle {
  linkEl: HTMLLinkElement;
  ownsLink: boolean;
}

function onStylesheetReady(linkEl: HTMLLinkElement, onReady?: () => void): void {
  if (!onReady) {
    return;
  }

  if (linkEl.sheet) {
    onReady();
    return;
  }

  const handleLoad = () => {
    linkEl.removeEventListener('load', handleLoad);
    onReady();
  };

  linkEl.addEventListener('load', handleLoad);
}

export function ensureStylesheet(
  id: string,
  href: string,
  onReady?: () => void
): StylesheetHandle {
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  if (existing) {
    onStylesheetReady(existing, onReady);
    return { linkEl: existing, ownsLink: false };
  }

  const linkEl = document.createElement('link');
  linkEl.id = id;
  linkEl.rel = 'stylesheet';
  linkEl.href = href;

  onStylesheetReady(linkEl, onReady);

  document.head.appendChild(linkEl);

  return { linkEl, ownsLink: true };
}
