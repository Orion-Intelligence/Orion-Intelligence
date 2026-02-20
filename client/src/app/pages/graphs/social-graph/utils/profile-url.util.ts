export function buildSocialProfileUrl(platformName: string, username: string, fallbackUrl: string = ''): string {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return fallbackUrl || '#';
  }
  const platform = (platformName || '').trim().toLowerCase();
  const known = buildKnownPlatformUrl(platform, normalizedUsername);
  if (known) {
    return known;
  }
  if (fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const hasUsernameInPath = pathSegments.some(segment => {
        const normalizedSegment = normalizeUsername(segment);
        return normalizedSegment === normalizedUsername;
      });
      if (hasUsernameInPath) {
        return parsed.toString();
      }
      if (pathSegments.length === 0) {
        parsed.pathname = `/${normalizedUsername}`;
        return parsed.toString();
      }
      parsed.pathname = `${parsed.pathname.replace(/\/+$/, '')}/${normalizedUsername}`;
      return parsed.toString();
    }
    catch {
      return fallbackUrl;
    }
  }
  return '#';
}
function normalizeUsername(value: string): string {
  return (value || '').trim().replace(/^@+/, '').replace(/\/+$/, '');
}
function buildKnownPlatformUrl(platform: string, username: string): string {
  if (platform === 'twitter' || platform === 'x') {
    return `https://x.com/${username}`;
  }
  if (platform === 'instagram') {
    return `https://www.instagram.com/${username}`;
  }
  if (platform === 'facebook') {
    return `https://www.facebook.com/${username}`;
  }
  if (platform === 'tiktok') {
    return `https://www.tiktok.com/@${username}`;
  }
  if (platform === 'youtube') {
    return `https://www.youtube.com/@${username}`;
  }
  if (platform === 'github') {
    return `https://github.com/${username}`;
  }
  if (platform === 'gitlab') {
    return `https://gitlab.com/${username}`;
  }
  if (platform === 'bitbucket') {
    return `https://bitbucket.org/${username}`;
  }
  if (platform === 'linkedin') {
    return `https://www.linkedin.com/in/${username}`;
  }
  if (platform === 'reddit') {
    return `https://www.reddit.com/user/${username}`;
  }
  return '';
}
