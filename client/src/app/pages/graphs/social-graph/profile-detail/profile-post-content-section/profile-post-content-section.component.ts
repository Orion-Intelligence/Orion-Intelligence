import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialPost, SocialPostComment } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers } from '../../../../../shared/utils/formatters';
import type { PostContentTabKey, PostCursorFetchRequest, SocialPlatformCapabilityMap } from '../../models/social-graph.models';
import { SocialNormalizationUtil } from '../../utils/social-normalization.util';
import socialPlatformCapabilities from '../../../../../../assets/data/social-graph/platform-capabilities.json';

@Component({
  selector: 'app-social-profile-post-content-section',
  templateUrl: './profile-post-content-section.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfilePostContentSectionComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;
  private postMediaLoading = signal<Record<string, boolean>>({});
  private pendingScrollToBottom = false;
  private sawLoadingForScroll = false;

  platformData = input.required<PlatformResult>();
  contentType = input.required<PostContentTabKey>();
  isLoading = input(false);
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
    return !!post?.media_url;
  }

  isVideoPost(post: SocialPost | null | undefined): boolean {
    const mediaType = (post?.media_type || '').toLowerCase();
    const mediaUrl = (post?.media_url || '').toLowerCase();
    return mediaType.includes('video') || mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.webm');
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

  loadMore(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    const posts = this.getUniquePosts(platformData, tabKey);
    this.prepareScrollAfterFetch();
    this.cursorFetch.emit({ platformData, tabKey, limit: Math.min(posts.length + 5, 100), mergeMode: 'append' });
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
    return !!this.getPostCursorId(post);
  }

  getCommentFetchLabel(post: SocialPost | null | undefined): string {
    return this.getPostComments(post).length > 0 ? 'Load more comments' : 'Load comments';
  }

  loadComments(platformData: PlatformResult, tabKey: PostContentTabKey, post: SocialPost): void {
    const cursorId = this.getPostCursorId(post);
    if (!cursorId) {
      return;
    }
    this.cursorFetch.emit({ platformData, tabKey, cursorId, commentOffset: this.getPostComments(post).length, maxComments: 10, mergeMode: 'update', commentsOnly: true });
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
    return post?.media_url ? `${post.post_url || ''}|${post.media_url}` : '';
  }

  private getPostCursorId(post: SocialPost | null | undefined): string | undefined {
    const cursorId = post?.hash_id || post?.post_url;
    return cursorId ? String(cursorId) : undefined;
  }

  private getPostItemKey(post: SocialPost): string {
    return SocialNormalizationUtil.getPostItemKey(post);
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
