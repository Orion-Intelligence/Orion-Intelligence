export function normalizeRedditClearnetUrl(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('.onion')) {
      return raw;
    }
    const clearnetHost = redditClearnetHost(host);
    if (!clearnetHost) {
      return raw;
    }
    parsed.protocol = 'https:';
    parsed.hostname = clearnetHost;
    parsed.port = '';
    return parsed.toString();
  }
  catch {
    return raw;
  }
}

function redditClearnetHost(host: string): string {
  const normalizedHost = host.startsWith('www.') ? host.slice(4) : host;
  if (host.startsWith('styles.reddit')) {
    return 'styles.redditmedia.com';
  }
  if (host.startsWith('preview.redditdot') || host.startsWith('preview.reddit')) {
    return 'preview.redd.it';
  }
  if (host.startsWith('external-preview.reddit')) {
    return 'external-preview.redd.it';
  }
  if (host.startsWith('i.reddit')) {
    return 'i.redd.it';
  }
  if (host.startsWith('v.reddit')) {
    return 'v.redd.it';
  }
  if (normalizedHost.startsWith('reddittic')) {
    return 'www.redditstatic.com';
  }
  if (normalizedHost.startsWith('reddittor')) {
    return 'www.reddit.com';
  }
  return '';
}
