import { SocialNormalizationUtil } from './social-normalization.util';

export function buildSocialProfileUrl(platformName: string, username: string, fallbackUrl: string = ''): string {
  const normalizedUsername = SocialNormalizationUtil.normalizeProfilePathUsername(username);
  if (!normalizedUsername) {
    return fallbackUrl || '#';
  }
  const platform = (platformName || '').trim().toLowerCase();
  const known = buildKnownPlatformUrl(platform, normalizedUsername, fallbackUrl);
  if (known) {
    return known;
  }
  if (fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const hasUsernameInPath = pathSegments.some(segment => {
        const normalizedSegment = SocialNormalizationUtil.normalizeProfilePathUsername(segment);
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

function buildKnownPlatformUrl(platform: string, username: string, fallbackUrl: string = ''): string {
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
    const cleanUsername = username.replace(/^\/+|\/+$/g, '');
    const lowerUsername = cleanUsername.toLowerCase();
    if (lowerUsername.startsWith('r/')) {
      return `https://www.reddit.com/r/${cleanUsername.slice(2)}`;
    }
    if (lowerUsername.startsWith('u/')) {
      return `https://www.reddit.com/user/${cleanUsername.slice(2)}`;
    }
    if (lowerUsername.startsWith('user/')) {
      return `https://www.reddit.com/user/${cleanUsername.slice(5)}`;
    }
    try {
      const parsed = new URL(fallbackUrl);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const accountType = pathSegments[0]?.toLowerCase();
      if (accountType === 'r') {
        return `https://www.reddit.com/r/${cleanUsername}`;
      }
      if (accountType === 'u' || accountType === 'user') {
        return `https://www.reddit.com/user/${cleanUsername}`;
      }
    }
    catch {
      // Fall through to Reddit user URLs for plain handles.
    }
    return `https://www.reddit.com/user/${cleanUsername}`;
  }
  return '';
}
