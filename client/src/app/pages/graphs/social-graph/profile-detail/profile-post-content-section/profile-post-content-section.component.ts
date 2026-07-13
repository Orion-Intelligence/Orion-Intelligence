import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { PlatformResult, SocialPost, SocialPostComment } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers } from '../../../../../shared/utils/formatters';
import type { PostContentTabKey, PostCursorFetchRequest, SocialPlatformCapabilityMap } from '../../models/social-graph.models';
import { SocialNormalizationUtil } from '../../utils/social-normalization.util';
import { normalizeRedditClearnetUrl } from '../../utils/reddit-url.util';
import socialPlatformCapabilities from '../../../../../../assets/data/social-graph/platform-capabilities.json';

@Component({
  selector: 'app-social-profile-post-content-section',
  templateUrl: './profile-post-content-section.component.html',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfilePostContentSectionComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;
  private postMediaLoading = signal<Record<string, boolean>>({});
  private postCommentsVisible = signal<Record<string, boolean>>({});
  private pendingScrollToBottom = false;
  private sawLoadingForScroll = false;

  platformData = input.required<PlatformResult>();
  contentType = input.required<PostContentTabKey>();
  isLoading = input(false);
  showFetchLatest = input(true);
  showLoadMoreWhenDone = input(false);
  showHeader = input(true);
  compactMedia = input(false);
  displayLimit = input<number | null>(null);
  allowCommentFetch = input(true);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      this.platformData();
      this.contentType();
      if (!this.pendingScrollToBottom) {
        return;
      }
      if (loading) {
        this.sawLoadingForScroll = true;
        return;
      }
      if (!this.sawLoadingForScroll) {
        return;
      }
      this.pendingScrollToBottom = false;
      this.sawLoadingForScroll = false;
      setTimeout(() => this.scrollToPostBottom(), 0);
    });
  }

  getPostCaption(post: SocialPost | null | undefined): string {
    return post?.caption?.trim() || '';
  }

  hasPostMedia(post: SocialPost | null | undefined): boolean {
    return !!this.getPostMediaUrl(post);
  }

  isVideoPost(post: SocialPost | null | undefined): boolean {
    const mediaType = (post?.media_type || '').toLowerCase();
    const mediaUrl = this.getPostMediaUrl(post).toLowerCase();
    return mediaType.includes('video') || mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.webm');
  }

  getPostUrl(post: SocialPost | null | undefined): string {
    return normalizeRedditClearnetUrl(post?.post_url || '');
  }

  getPostMediaUrl(post: SocialPost | null | undefined): string {
    const url = normalizeRedditClearnetUrl(post?.media_url || '');
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
      if (!post || !SocialNormalizationUtil.isUsableSocialPost(post)) {
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

  getVisiblePosts(platformData: PlatformResult, tabKey: PostContentTabKey): SocialPost[] {
    const posts = this.getUniquePosts(platformData, tabKey);
    const limit = this.displayLimit();
    return limit === null ? posts : posts.slice(0, Math.max(0, limit));
  }

  canLoadMorePosts(platformData: PlatformResult, tabKey: PostContentTabKey): boolean {
    return this.canRevealCachedPosts(platformData, tabKey) || this.canRequestRemoteMorePosts(platformData, tabKey);
  }

  canRevealCachedPosts(platformData: PlatformResult, tabKey: PostContentTabKey): boolean {
    const limit = this.displayLimit();
    if (limit === null) {
      return true;
    }
    return this.getUniquePosts(platformData, tabKey).length > limit;
  }

  canRequestRemoteMorePosts(platformData: PlatformResult, tabKey: PostContentTabKey): boolean {
    return this.showLoadMoreWhenDone() && this.getUniquePosts(platformData, tabKey).length > 0 && !this.canRevealCachedPosts(platformData, tabKey);
  }

  shouldShowLoadMorePosts(platformData: PlatformResult, tabKey: PostContentTabKey): boolean {
    return this.canLoadMorePosts(platformData, tabKey);
  }

  fetchNew(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    this.cursorFetch.emit({ platformData, tabKey, mergeMode: 'prepend' });
  }

  loadMore(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    if (!this.canLoadMorePosts(platformData, tabKey)) {
      return;
    }
    const posts = this.getUniquePosts(platformData, tabKey);
    this.prepareScrollAfterFetch();
    const visibleCount = this.displayLimit() ?? posts.length;
    if (this.canRevealCachedPosts(platformData, tabKey)) {
      this.cursorFetch.emit({ platformData, tabKey, limit: Math.min(visibleCount + 5, 100), mergeMode: 'append' });
      return;
    }
    this.cursorFetch.emit({ platformData, tabKey, limit: 5, mergeMode: 'append', remoteFetch: true });
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
    return !this.platformCapabilities[platformData.platform.toLowerCase()]?.disallow?.includes('comments');
  }

  getCommentTrackKey(index: number, comment: SocialPostComment): string {
    return `${comment.sender_name || ''}|${comment.date || ''}|${comment.text}|${index}`;
  }

  canLoadComments(post: SocialPost | null | undefined): boolean {
    return this.allowCommentFetch() && this.platformData().resultSource !== 'darkweb' && !!this.getPostCursorId(post);
  }

  shouldShowCommentAction(platformData: PlatformResult, post: SocialPost | null | undefined): boolean {
    return this.areCommentsAllowed(platformData) && (this.canLoadComments(post) || this.getPostComments(post).length > 0);
  }

  arePostCommentsVisible(post: SocialPost | null | undefined): boolean {
    const key = this.getPostCommentStateKey(post);
    return !!key && !!this.postCommentsVisible()[key];
  }

  getCommentFetchLabel(post: SocialPost | null | undefined): string {
    if (!this.arePostCommentsVisible(post)) {
      return this.getPostComments(post).length > 0 ? 'Show comments' : 'Load comments';
    }
    return this.canLoadComments(post) ? 'Load more comments' : 'Hide comments';
  }

  handleCommentAction(platformData: PlatformResult, tabKey: PostContentTabKey, post: SocialPost): void {
    if (!this.arePostCommentsVisible(post)) {
      this.setPostCommentsVisible(post, true);
      if (this.getPostComments(post).length === 0 && this.canLoadComments(post)) {
        this.loadComments(platformData, tabKey, post);
      }
      return;
    }
    if (this.canLoadComments(post)) {
      this.loadComments(platformData, tabKey, post);
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

  private getPostItemKey(post: SocialPost): string {
    return SocialNormalizationUtil.getPostItemKey(post);
  }

  private isBlockedInstagramProfileImageUrl(url: string): boolean {
    return /\/t51\.[^/]+-19\//i.test(url)
      || /[?&]efg=[^&]*profile/i.test(url)
      || /profile_pic/i.test(url);
  }

  private prepareScrollAfterFetch(): void {
    this.pendingScrollToBottom = true;
    this.sawLoadingForScroll = false;
  }

  private scrollToPostBottom(): void {
    requestAnimationFrame(() => {
      const rows = this.elementRef.nativeElement.querySelectorAll('[data-testid="social-post-row"]') as NodeListOf<HTMLElement>;
      rows[rows.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
