import { PlatformResult, SocialPost, SocialPostComment, SocialStoredProfile } from '../../../../shared/model/social/social-scan.models';

const PLATFORM_KEY_ALIASES: Record<string, string> = {
  dev_to: 'devto',
  micro_blog: 'microblog',
  stack_overflow: 'stackoverflow',
  x: 'twitter',
  youtube_user: 'youtube',
};

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

  static normalizePlatformKey(platformName?: string): string {
    return (platformName || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  static canonicalPlatformKey(platformName?: string): string {
    const key = this.normalizePlatformKey(platformName);
    return PLATFORM_KEY_ALIASES[key] || key;
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

  static firstArrayCount(...values: any[]): string {
    for (const value of values) {
      if (Array.isArray(value)) {
        return String(value.length);
      }
    }
    return '';
  }

  static normalizeCommentItems(...values: any[]): string[] {
    const seen = new Set<string>();
    return values
      .flatMap(value => this.normalizeCommentSource(value))
      .map(value => this.normalizeCommentItem(value))
      .filter(value => {
        if (!value || seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
  }

  static normalizeCommentDetails(...values: any[]): SocialPostComment[] {
    const exactSeen = new Set<string>();
    const plainByText = new Map<string, number>();
    const richTextSeen = new Set<string>();
    const result: SocialPostComment[] = [];
    const comments = values
      .flatMap(value => this.normalizeCommentSource(value))
      .map(value => this.normalizeCommentDetail(value))
      .filter((value): value is SocialPostComment => !!value);

    for (const comment of comments) {
      const exactKey = [comment.sender_name, comment.date, comment.likes, comment.text].join('|');
      if (exactSeen.has(exactKey)) {
        continue;
      }
      const textKey = this.normalizeCommentTextKey(comment.text);
      const hasMetadata = this.hasCommentMetadata(comment);
      if (textKey && hasMetadata) {
        const plainIndex = plainByText.get(textKey);
        if (plainIndex !== undefined) {
          result[plainIndex] = comment;
          plainByText.delete(textKey);
        }
        else {
          result.push(comment);
        }
        richTextSeen.add(textKey);
        exactSeen.add(exactKey);
        continue;
      }
      if (textKey && (richTextSeen.has(textKey) || plainByText.has(textKey))) {
        continue;
      }
      if (textKey) {
        plainByText.set(textKey, result.length);
      }
      exactSeen.add(exactKey);
      result.push(comment);
    }
    return result;
  }

  private static hasCommentMetadata(comment: SocialPostComment): boolean {
    return !!(comment.sender_name || comment.date || comment.likes);
  }

  private static normalizeCommentTextKey(value: string): string {
    return this.normalizeRecordValue(value).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  static normalizeCommentSource(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(/\r?\n/);
    }
    return [];
  }

  static normalizeCommentItem(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      const parsed = this.tryParseJsonObject(value);
      return parsed ? this.normalizeCommentItem(parsed) : this.normalizeRecordValue(value);
    }
    if (typeof value === 'object') {
      const author = this.firstValue(value.sender_name, value.username, value.user, value.author, value.m_username, value.m_sender_name, value.name);
      const time = this.firstValue(value.time, value.m_time, value.datetime, value.date, value.m_date);
      const likes = this.firstValue(value.likes, value.m_likes);
      const text = this.firstValue(value.text, value.comment, value.content, value.m_text, value.m_content, value.message, value.body);
      const meta = [author, time, likes ? `${likes} likes` : ''].filter(Boolean).join(' · ');
      if (meta && text) {
        return `${meta}: ${text}`;
      }
      return text || meta || JSON.stringify(value);
    }
    return this.normalizeRecordValue(value);
  }

  static normalizeCommentDetail(value: any): SocialPostComment | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      const parsed = this.tryParseJsonObject(value);
      return parsed ? this.normalizeCommentDetail(parsed) : { text: this.normalizeRecordValue(value) };
    }
    if (typeof value !== 'object') {
      return { text: this.normalizeRecordValue(value) };
    }
    const comment = {
      sender_name: this.firstValue(value.sender_name, value.username, value.user, value.author, value.m_username, value.m_sender_name, value.name),
      date: this.firstValue(value.time, value.m_time, value.datetime, value.date, value.m_date),
      likes: this.firstValue(value.likes, value.m_likes),
      text: this.firstValue(value.text, value.comment, value.content, value.m_text, value.m_content, value.message, value.body),
    };
    return comment.text || comment.sender_name || comment.date ? comment : null;
  }

  static tryParseJsonObject(value: string): any | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    }
    catch {
      return null;
    }
  }

  static getPostItemKey(post: any): string {
    const url = String(post?.post_url || post?.m_url || post?.url || post?.m_message_sharable_link || '').trim();
    const youtubeId = url.match(/(?:[?&]v=|\/shorts\/|\/post\/)([^?&#/]+)/)?.[1];
    return String(youtubeId || url || post?.hash_id || post?.m_hash_id || JSON.stringify(post)).trim();
  }

  static isUsableSocialPost(post: any): boolean {
    const url = this.firstValue(post?.post_url, post?.m_url, post?.url, post?.m_message_sharable_link, post?.m_weblink);
    if (url) {
      return true;
    }
    const caption = this.firstValue(post?.caption, post?.m_content, post?.m_title, post?.title).trim();
    const normalizedCaption = caption.toLowerCase();
    if (!caption || normalizedCaption === 'no title') {
      return false;
    }
    const hashId = this.firstValue(post?.hash_id, post?.m_hash_id, post?.id, post?.m_message_id);
    const mediaUrl = this.firstValue(post?.media_url, post?.image_url, post?.thumbnail, post?.video_url, post?.m_img_src, post?.m_coverpage);
    return !!mediaUrl || (!!hashId && hashId !== 'menu');
  }

  static normalizeSocialPost(post: any): SocialPost {
    const mediaUrl = this.firstValue(post?.media_url, post?.image_url, post?.thumbnail, post?.video_url, post?.m_img_src, post?.m_coverpage);
    const directComments = Array.isArray(post?.comments) ? '' : post?.comments;
    const arrayCommentCount = this.firstArrayCount(post?.comment_details, post?.comment_items, post?.comments, post?.m_post_comments_list, post?.m_comments, post?.comments_list, post?.post_comments_list);
    const commentCount = this.firstValue(directComments, post?.comments_count, post?.comment_count, post?.m_post_comments_count, post?.m_comment_count, post?.m_comments_count, arrayCommentCount);
    const commentSources = [post?.comment_details, post?.comment_items, Array.isArray(post?.comments) ? post.comments : [], post?.m_post_comments_list, post?.m_comments, post?.comments_list, post?.post_comments_list, post?.m_post_comments];
    const commentItems = this.normalizeCommentItems(...commentSources);
    const commentDetails = this.normalizeCommentDetails(...commentSources);
    return {
      hash_id: this.firstValue(post?.hash_id, post?.m_hash_id, post?.id, post?.m_message_id),
      post_url: this.firstValue(post?.post_url, post?.m_url, post?.url, post?.source_url, post?.m_message_sharable_link, post?.m_weblink),
      datetime: this.firstValue(post?.datetime, post?.created_at, post?.date, post?.m_date, post?.timestamp),
      caption: this.firstValue(post?.caption, post?.text, post?.m_content, post?.m_title, post?.title),
      author: this.firstValue(post?.author, post?.m_author, post?.m_sender_name),
      source: this.firstValue(post?.source, post?.m_domain, post?.m_platform, post?.m_scrap_file),
      likes: this.firstValue(post?.likes, post?.likes_count, post?.m_post_likes, post?.m_likes),
      comments: commentCount,
      collected_comments_count: this.firstValue(post?.collected_comments_count, arrayCommentCount),
      comment_items: commentItems,
      comment_details: commentDetails,
      shares: this.firstValue(post?.shares, post?.retweets, post?.m_post_shares, post?.m_retweets),
      views: this.firstValue(post?.views, post?.views_count, post?.m_post_views, post?.m_views),
      media_type: this.firstValue(post?.media_type, post?.video_url ? 'video' : mediaUrl ? 'image' : ''),
      media_url: mediaUrl,
      hate_speech: post?.hate_speech || post?.m_hate_speech || null,
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
      ...this.expandRecordValue(record?.m_email),
      ...this.expandRecordValue(record?.username),
      ...this.expandRecordValue(record?.m_username),
      ...this.expandRecordValue(record?.user),
      ...this.expandRecordValue(record?.m_user),
      ...this.expandRecordValue(record?.login),
      ...this.expandRecordValue(record?.m_login),
      ...this.expandRecordValue(record?.credential),
      ...this.expandRecordValue(record?.m_credential),
      ...this.expandRecordValue(record?.raw),
    ];
  }

  static getDomainCandidates(record: any): string[] {
    return [
      ...this.expandRecordValue(record?.source_domain),
      ...this.expandRecordValue(record?.m_source_domain),
      ...this.expandRecordValue(record?.domain),
      ...this.expandRecordValue(record?.m_domain),
      ...this.expandRecordValue(record?.host),
      ...this.expandRecordValue(record?.m_host),
      ...this.expandRecordValue(record?.url),
      ...this.expandRecordValue(record?.m_url),
      ...this.expandRecordValue(record?.base_url),
      ...this.expandRecordValue(record?.m_base_url),
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
      resultSource: profile.resultSource ?? 'normal',
      allMetadata: profile.allMetadata ?? {},
    }));
  }
}
