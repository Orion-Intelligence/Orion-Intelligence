import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { PlatformResult, SocialPost } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers } from '../../../../../shared/utils/formatters';
import type { PostContentTabKey, PostCursorFetchRequest } from '../../models/social-graph.models';

@Component({
  selector: 'app-social-profile-post-content-section',
  templateUrl: './profile-post-content-section.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfilePostContentSectionComponent {
  private postMediaLoading = signal<Record<string, boolean>>({});

  platformData = input.required<PlatformResult>();
  contentType = input.required<PostContentTabKey>();
  isLoading = input(false);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();

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
      const key = post.post_url || JSON.stringify(post);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  fetchNew(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    const [firstPost] = this.getUniquePosts(platformData, tabKey);
    this.cursorFetch.emit({ platformData, tabKey, cursorId: this.getPostCursorId(firstPost), mergeMode: 'prepend' });
  }

  loadMore(platformData: PlatformResult, tabKey: PostContentTabKey): void {
    const posts = this.getUniquePosts(platformData, tabKey);
    this.cursorFetch.emit({ platformData, tabKey, cursorId: this.getPostCursorId(posts[posts.length - 1]), mergeMode: 'append' });
  }

  formatPostMetric(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0';
    }
    const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(value);
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
}
