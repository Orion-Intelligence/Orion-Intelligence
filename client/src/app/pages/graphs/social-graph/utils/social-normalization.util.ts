import { PlatformResult, SocialPost, SocialStoredProfile } from '../../../../shared/model/social/social-scan.models';

export class SocialNormalizationUtil {
  static normalizeIdentity(value: string): string {
    return (value || '').trim().replace(/^@+/, '');
  }

  static normalizeUsername(value: string): string {
    return this.normalizeIdentity(value).toLowerCase();
  }

  static normalizeProfilePathUsername(value: string): string {
    return this.normalizeIdentity(value).replace(/\/+$/, '');
  }

  static normalizeDomain(value: string): string {
    const raw = (value || '').trim().toLowerCase();
    if (!raw) {
      return '';
    }
    const candidate = raw.includes('://') ? raw : `https://${raw}`;
    try {
      const host = new URL(candidate).hostname.replace(/^(www|m)\./, '');
      return host === 'x.com' ? 'twitter.com' : host;
    }
    catch {
      const host = raw.replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/^(www|m)\./, '');
      return host === 'x.com' ? 'twitter.com' : host;
    }
  }

  static normalizeRecordValue(value: any): string {
    if (Array.isArray(value)) {
      return this.normalizeRecordValue(value[0]);
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  }

  static expandRecordValue(value: any): string[] {
    if (Array.isArray(value)) {
      return value.flatMap(item => this.expandRecordValue(item));
    }
    if (value && typeof value === 'object') {
      return Object.values(value).flatMap(item => this.expandRecordValue(item));
    }
    const normalized = this.normalizeRecordValue(value);
    return normalized ? [normalized] : [];
  }

  static firstValue(...values: any[]): string {
    for (const value of values) {
      const normalized = this.normalizeRecordValue(value);
      if (normalized) {
        return normalized;
      }
    }
    return '';
  }

  static normalizeSocialPost(post: any): SocialPost {
    const mediaUrl = this.firstValue(post?.media_url, post?.m_img_src, post?.m_coverpage);
    const commentCount = Array.isArray(post?.m_post_comments_list) && post.m_post_comments_list.length
      ? String(post.m_post_comments_list.length)
      : '';
    return {
      post_url: this.firstValue(post?.post_url, post?.m_url, post?.url, post?.m_message_sharable_link, post?.m_weblink),
      datetime: this.firstValue(post?.datetime, post?.date, post?.m_date, post?.timestamp),
      caption: this.firstValue(post?.caption, post?.m_content, post?.m_title, post?.title),
      likes: this.firstValue(post?.likes, post?.m_post_likes, post?.m_likes),
      comments: this.firstValue(post?.comments, post?.m_post_comments, post?.m_comment_count, commentCount),
      shares: this.firstValue(post?.shares, post?.m_post_shares, post?.m_retweets),
      views: this.firstValue(post?.views, post?.m_post_views, post?.m_views),
      media_type: this.firstValue(post?.media_type, mediaUrl ? 'image' : ''),
      media_url: mediaUrl,
    };
  }

  static recordMatchesIdentity(record: any, identity: string): boolean {
    const normalizedIdentity = this.normalizeUsername(identity);
    if (!normalizedIdentity) {
      return false;
    }
    return this.getIdentityCandidates(record).some(candidate => this.identityAppearsInCandidate(candidate, normalizedIdentity));
  }

  static recordMatchesDomain(record: any, domain: string): boolean {
    const normalizedDomain = this.normalizeDomain(domain);
    if (!normalizedDomain) {
      return true;
    }
    return this.getDomainCandidates(record).some(candidate => this.domainAppearsInCandidate(candidate, normalizedDomain));
  }

  static identityAppearsInCandidate(candidate: string, normalizedIdentity: string): boolean {
    const value = candidate.toLowerCase();
    return value === normalizedIdentity
      || value.startsWith(`${normalizedIdentity}@`)
      || value.split(/[^a-z0-9_.-]+/i).some(token => token === normalizedIdentity || token.startsWith(`${normalizedIdentity}@`));
  }

  static domainAppearsInCandidate(candidate: string, normalizedDomain: string): boolean {
    const candidateDomain = this.normalizeDomain(candidate);
    return candidateDomain === normalizedDomain
      || candidateDomain.endsWith(`.${normalizedDomain}`)
      || candidate.toLowerCase().includes(normalizedDomain);
  }

  static getIdentityCandidates(record: any): string[] {
    return [
      ...this.expandRecordValue(record?.email),
      ...this.expandRecordValue(record?.username),
      ...this.expandRecordValue(record?.user),
      ...this.expandRecordValue(record?.login),
      ...this.expandRecordValue(record?.credential),
      ...this.expandRecordValue(record?.raw),
    ];
  }

  static getDomainCandidates(record: any): string[] {
    return [
      ...this.expandRecordValue(record?.source_domain),
      ...this.expandRecordValue(record?.domain),
      ...this.expandRecordValue(record?.host),
      ...this.expandRecordValue(record?.url),
      ...this.expandRecordValue(record?.base_url),
      ...this.expandRecordValue(record?.raw),
    ];
  }

  static toExportValue(value: unknown, maxLength = 120): string {
    if (Array.isArray(value)) {
      return this.toExportValue(value.join(', '), maxLength);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) {
      return '-';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  static escapeCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  static normalizeDownloadName(value: string): string {
    return (value || 'profile').replace(/^@+/, '').replace(/[^a-z0-9.-]+/gi, '_') || 'profile';
  }

  static normalizeStoredDocument(document: SocialStoredProfile): SocialStoredProfile {
    const source = document as any;
    const profiles = Array.isArray(source.profiles)
      ? source.profiles
      : Array.isArray(source.result)
        ? source.result
        : [];
    return {
      ...document,
      profile_username: this.normalizeUsername(source.profile_username || source.root_username || source.username || ''),
      profiles,
      count: source.count ?? profiles.length,
    };
  }

  static normalizeStoredProfiles(document: SocialStoredProfile): PlatformResult[] {
    return (document.profiles || []).map(profile => ({
      ...profile,
      keyUsername: document.profile_username,
      isSelected: profile.isSelected ?? false,
      allMetadata: profile.allMetadata ?? {},
    }));
  }
}
