import { NetworkIntelSeoRepoScanCategory } from './seo-repo-scan-section/model/seo-repo-scan-section.model';
import { UrlScanProofItem, UrlScanThreatItem } from '../../../shared/model/security-scan/security.scan.results.model';

export function formatElapsedClock(elapsedSeconds: number): string {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours ? `${String(hours).padStart(2, '0')}:${clock}` : clock;
}

export function shouldActivateOnKeydown(event: KeyboardEvent): boolean {
  if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
    return false;
  }
  event.preventDefault();
  return true;
}

export function buildScanThreatCategories(threats: Record<string, UrlScanThreatItem[]> | undefined, proofs: Record<string, UrlScanProofItem[]> | undefined): NetworkIntelSeoRepoScanCategory[] {
  const proofMap = new Map<string, string>();
  Object.entries(proofs ?? {}).forEach(([category, items]) => {
    items.forEach((item) => {
      const key = `${category}|${String(item?.header || '').trim().toLowerCase()}`;
      if (item?.proof && !proofMap.has(key)) {
        proofMap.set(key, item.proof);
      }
    });
  });

  return Object.entries(threats ?? {})
    .map(([name, items]) => {
      const list = Array.isArray(items) ? items : [];
      const seen = new Set<string>();
      const uniqueItems = list
        .filter((item) => {
          const key = String(item?.header || '').trim().toLowerCase();
          if (!key || seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        })
        .map((item) => {
          const key = String(item?.header || '').trim().toLowerCase();
          const proof = proofMap.get(`${name}|${key}`);
          return proof ? { ...item, proof } : item;
        });
      return { name, total: list.length, items: uniqueItems };
    })
    .filter((category) => category.items.length > 0);
}
