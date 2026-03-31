export function ensureStylesheet(href: string, id: string): HTMLLinkElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const existing = document.getElementById(id);
  if (existing instanceof HTMLLinkElement) {
    return existing;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  return link;
}
