import { ProxyController } from '../../../shared/services/proxy-controller';

export function scrollToResultCard(host: HTMLElement, index: number): void {
  if (index < 0) {
    return;
  }
  setTimeout(() => {
    host
      .querySelector<HTMLElement>(`[data-result-index="${index}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}

export function buildGridPlaceholders(count: number, isConsolidatedView: boolean): number[] {
  const remainder = count % 3;
  const placeholders = remainder === 0 ? 0 : 3 - remainder;
  return isConsolidatedView ? [] : Array.from({ length: placeholders }, (_, index) => index);
}

export function openProxiedUrl(proxyController: ProxyController, isMobileDemo: boolean, url?: string | null): void {
  if (!isMobileDemo || !url) {
    return;
  }
  proxyController.open(url);
}
