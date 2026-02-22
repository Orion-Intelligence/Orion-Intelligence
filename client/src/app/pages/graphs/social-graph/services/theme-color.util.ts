export function getSocialGraphLabelColor(): string {
  if (typeof document === 'undefined') {
    return '#e5e7eb';
  }

  const root = document.documentElement;
  const fromTheme = getComputedStyle(root).getPropertyValue('--color-text1').trim();
  if (fromTheme) {
    return fromTheme;
  }

  const isLight =
    document.body?.classList.contains('light-theme') ||
    root.classList.contains('light-theme');

  return isLight ? '#1f2937' : '#e5e7eb';
}
