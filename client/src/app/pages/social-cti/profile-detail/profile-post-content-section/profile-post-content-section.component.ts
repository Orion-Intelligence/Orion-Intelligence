import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { PlatformResult, SocialPost, SocialPostComment } from '../../models/social-scan.models';
import { formatFollowers } from '../../../../shared/utils/formatters';
import type { PostContentTabKey } from '../../enums/social-graph.enums';
import type { PostCursorFetchRequest, SocialPlatformCapabilityMap } from '../../models/social-graph.models';
import { applyImageFallback } from '../../utils/image-fallback.util';
import socialPlatformCapabilities from '../../../../../assets/data/social-graph/platform-capabilities.json';

import { ContentModerationBadgeComponent } from '../../../../shared/partials/content-moderation-badge/content-moderation-badge.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-social-profile-post-content-section',
  templateUrl: './profile-post-content-section.component.html',
  standalone: true,
  imports: [ContentModerationBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfilePostContentSectionComponent {
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;
  private postMediaLoading = signal<Record<string, boolean>>({});
  private postCommentsVisible = signal<Record<string, boolean>>({});
  private expandedPostCaptions = signal<Record<string, boolean>>({});

  readonly onImageError = applyImageFallback;
  platformData = input.required<PlatformResult>();
  contentType = input.required<PostContentTabKey>();
  isLoading = input(false);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();

  getPostCaption(post: SocialPost | null | undefined): string {
    return post?.caption?.trim() || '';
  }

  isPostCaptionExpanded(post: SocialPost | null | undefined): boolean {
    const key = this.getPostItemKey(post);
    return !!(key && this.expandedPostCaptions()[key]);
  }

  togglePostCaption(post: SocialPost | null | undefined): void {
    const key = this.getPostItemKey(post);
    if (!key) {
      return;
    }
    this.expandedPostCaptions.update(current => ({ ...current, [key]: !current[key] }));
  }

  shouldShowPostCaptionToggle(post: SocialPost | null | undefined): boolean {
    const caption = this.getPostCaption(post);
    return caption.length > 280 || caption.split(/\r?\n/).length > 4;
  }

  hasPostMedia(post: SocialPost | null | undefined): boolean {
    return !!this.getPostMediaUrl(post);
  }

  isVideoPost(post: SocialPost | null | undefined): boolean {
    const mediaType = (post?.media_type || '').toLowerCase();
    const mediaUrl = this.getPostMediaUrl(post).toLowerCase();
    if (this.platformData().platform.toLowerCase() === 'tiktok' && this.contentType() === 'shorts') {
      return false;
    }
    const isImageThumbnail = /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(mediaUrl)
      || /pbs\.twimg\.com\/(?:media|amplify_video_thumb|ext_tw_video_thumb)\//i.test(mediaUrl);
    if (isImageThumbnail) {
      return false;
    }
    return mediaType.includes('video') || mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.webm');
  }

  getPostUrl(post: SocialPost | null | undefined): string {
    return post?.post_url || '';
  }

  getPostMediaUrl(post: SocialPost | null | undefined): string {
    const url = post?.media_url || '';
    return this.isBlockedInstagramProfileImageUrl(url) ? '' : url;
  }

  getPostMediaTypeLabel(post: SocialPost | null | undefined): string {
    return post?.media_type?.replace(/_/g, ' ') || 'Media';
  }

  isPostMediaLoading(post: SocialPost | null | undefined): boolean {
    return this.hasPostMedia(post) && this.postMediaLoading()[this.getPostMediaKey(post)] !== false;
  }

  markPostMediaLoading(post: SocialPost | null | undefined): void {
    const key = this.getPostMediaKey(post);
    if (!key) {
      return;
    }
    this.postMediaLoading.update(current => ({ ...current, [key]: true }));
  }

  markPostMediaLoaded(post: SocialPost | null | undefined): void {
    const key = this.getPostMediaKey(post);
    if (!key) {
      return;
    }
    this.postMediaLoading.update(current => ({ ...current, [key]: false }));
  }

  getPostContentTabLabel(tabKey: PostContentTabKey): string {
    return tabKey === 'videos' ? 'Videos' : tabKey === 'shorts' ? 'Shorts' : 'Posts';
  }

  getUniquePosts(platformData: PlatformResult, tabKey: PostContentTabKey): SocialPost[] {
    const posts = this.getPostContentItems(platformData, tabKey);
    const seen = new Set<string>();
    return posts.filter(post => {
      if (!post) {
        return false;
      }
      const key = this.getPostItemKey(post);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  fetchNew(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    this.cursorFetch.emit({ platformData, tabKey, mergeMode: 'prepend' });
  }

  formatPostMetric(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0';
    }
    const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(value);
  }

  getPostComments(post: SocialPost | null | undefined): SocialPostComment[] {
    if (post?.comment_details?.length) {
      return post.comment_details;
    }
    return (post?.comment_items || []).map(text => ({ text }));
  }

  areCommentsAllowed(platformData: PlatformResult): boolean {
    return !this.platformCapabilities[platformData.platformKey || platformData.platform]?.disallow?.includes('comments');
  }

  getCommentTrackKey(index: number, comment: SocialPostComment): string {
    return `${comment.sender_name || ''}|${comment.date || ''}|${comment.text}|${index}`;
  }

  canLoadComments(post: SocialPost | null | undefined): boolean {
    return this.platformData().resultSource !== 'darkweb' && !!this.getPostCursorId(post);
  }

  shouldShowCommentAction(platformData: PlatformResult, post: SocialPost | null | undefined): boolean {
    return this.areCommentsAllowed(platformData) && (this.canLoadComments(post) || this.getPostComments(post).length > 0);
  }

  arePostCommentsVisible(post: SocialPost | null | undefined): boolean {
    const key = this.getPostCommentStateKey(post);
    if (!key) {
      return false;
    }
    const visibility = this.postCommentsVisible();
    if (Object.prototype.hasOwnProperty.call(visibility, key)) {
      return visibility[key];
    }
    return false;
  }

  getCommentFetchLabel(post: SocialPost | null | undefined): string {
    return this.arePostCommentsVisible(post) ? 'Hide comments' : 'Show comments';
  }

  handleCommentAction(platformData: PlatformResult, tabKey: PostContentTabKey, post: SocialPost): void {
    if (!this.arePostCommentsVisible(post)) {
      this.setPostCommentsVisible(post, true);
      if (this.getPostComments(post).length === 0 && this.canLoadComments(post)) {
        this.loadComments(platformData, tabKey, post);
      }
      return;
    }
    this.setPostCommentsVisible(post, false);
  }

  private loadComments(platformData: PlatformResult, tabKey: PostContentTabKey, post: SocialPost): void {
    const cursorId = this.getPostCursorId(post);
    if (!cursorId) {
      return;
    }
    this.cursorFetch.emit({ platformData, tabKey, cursorId, commentOffset: this.getPostComments(post).length, maxComments: 10, mergeMode: 'update', commentsOnly: true });
  }

  canFetchRemote(platformData: PlatformResult): boolean {
    return platformData.resultSource !== 'darkweb';
  }

  private getPostContentItems(platformData: PlatformResult, tabKey: PostContentTabKey): SocialPost[] {
    if (tabKey === 'videos') {
      return platformData.videos || [];
    }
    if (tabKey === 'shorts') {
      return platformData.shorts || [];
    }
    return platformData.posts || [];
  }

  private getPostMediaKey(post: SocialPost | null | undefined): string {
    const mediaUrl = this.getPostMediaUrl(post);
    return mediaUrl ? `${this.getPostUrl(post)}|${mediaUrl}` : '';
  }

  private setPostCommentsVisible(post: SocialPost | null | undefined, visible: boolean): void {
    const key = this.getPostCommentStateKey(post);
    if (!key) {
      return;
    }
    this.postCommentsVisible.update(current => ({ ...current, [key]: visible }));
  }

  private getPostCommentStateKey(post: SocialPost | null | undefined): string {
    return this.getPostCursorId(post) || this.getPostUrl(post) || this.getPostMediaUrl(post) || this.getPostCaption(post);
  }

  private getPostCursorId(post: SocialPost | null | undefined): string | undefined {
    const cursorId = post?.hash_id || post?.post_url;
    return cursorId ? String(cursorId) : undefined;
  }

  private getPostItemKey(post: SocialPost | null | undefined): string {
    return post ? String(post.hash_id || post.post_url || post.media_url || post.caption || '') : '';
  }

  private isBlockedInstagramProfileImageUrl(url: string): boolean {
    return /\/t51\.[^/]+-19\//i.test(url)
      || /[?&]efg=[^&]*profile/i.test(url)
      || /profile_pic/i.test(url);
  }

}
