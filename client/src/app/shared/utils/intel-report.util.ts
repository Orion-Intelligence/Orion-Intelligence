export function isWithinDays(dateString = '', days: number): boolean {
  if (!dateString) {
    return false;
  }
  const createdDate = new Date(dateString);
  const today = new Date();
  const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays <= days;
}

export function getStatusText(dateString?: string): 'Active' | 'Idle' | 'Inactive' {
  if (!dateString) {
    return 'Inactive';
  }
  const createdDate = new Date(dateString);
  const today = new Date();
  const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays <= 5) {
    return 'Active';
  }
  if (diffInDays <= 10) {
    return 'Idle';
  }
  return 'Inactive';
}

export function getStatusFlag(dateString?: string): boolean {
  if (!dateString) {
    return false;
  }
  const createdDate = new Date(dateString);
  const today = new Date();
  const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays <= 5) {
    return true;
  }
  return diffInDays <= 10;
}

export function formatKeyLabel(key: string): string {
  const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
  return cleaned.length < 4
    ? cleaned.toUpperCase()
    : cleaned.toLowerCase().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

export function isLikelyUrl(value: string): boolean {
  const v = value.trim();
  return /^(https?:\/\/|www\.)/i.test(v) || /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(v);
}

export function formatTitleUrl(url?: string | null, fallback = ''): string {
  if (!url) {
    return fallback;
  }
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./i, '') || fallback;
  }
  catch {
    return url
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0] || fallback;
  }
}

export function getDisplayTitle(rawTitle?: string | null, fallbackUrl?: string | null, emptyFallback = '-'): string {
  const title = (rawTitle || '').trim();
  if (title) {
    return isLikelyUrl(title) ? formatTitleUrl(title, '') : title;
  }
  const cleanUrl = formatTitleUrl(fallbackUrl || '', '');
  return cleanUrl || emptyFallback;
}

export function normalizeDisplayUrl(url?: string | null, fallback = '-'): string {
  if (!url) {
    return fallback;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }
  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./i, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}` || host || fallback;
  }
  catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '') || fallback;
  }
}
