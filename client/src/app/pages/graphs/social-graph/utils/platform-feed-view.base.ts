import { signal } from '@angular/core';
import { SocialImage, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { loadMoreIncrementally } from './summary-view.util';

export abstract class PlatformFeedViewBase {
    displayPosts = signal<SocialPost[]>([]);
    displayImages = signal<SocialImage[]>([]);
    displayFollowers = signal<string[]>([]);
    displayFollowing = signal<string[]>([]);
    isLoadingMorePosts = signal(false);
    isLoadingMoreImages = signal(false);
    isLoadingMoreFollowers = signal(false);
    isLoadingMoreFollowing = signal(false);
    protected readonly initialPosts = 3;
    protected readonly initialImages = 8;
    protected readonly initialFollowers = 10;
    protected readonly initialFollowing = 10;
    protected readonly postsIncrement = 3;
    protected readonly imagesIncrement = 4;
    protected readonly followersIncrement = 10;
    protected readonly followingIncrement = 10;
    protected resetFeedState(posts: SocialPost[] | undefined | null, images: SocialImage[] | undefined | null, followers: string[] | undefined | null, following: string[] | undefined | null): void {
        this.displayPosts.set((posts || []).slice(0, this.initialPosts));
        this.displayImages.set((images || []).slice(0, this.initialImages));
        this.displayFollowers.set((followers || []).slice(0, this.initialFollowers));
        this.displayFollowing.set((following || []).slice(0, this.initialFollowing));
    }
    protected loadMorePosts(items: SocialPost[] | undefined | null): void {
        loadMoreIncrementally(this.isLoadingMorePosts, this.displayPosts, items, this.postsIncrement);
    }
    protected loadMoreImages(items: SocialImage[] | undefined | null): void {
        loadMoreIncrementally(this.isLoadingMoreImages, this.displayImages, items, this.imagesIncrement);
    }
    protected loadMoreFollowers(items: string[] | undefined | null): void {
        loadMoreIncrementally(this.isLoadingMoreFollowers, this.displayFollowers, items, this.followersIncrement);
    }
    protected loadMoreFollowing(items: string[] | undefined | null): void {
        loadMoreIncrementally(this.isLoadingMoreFollowing, this.displayFollowing, items, this.followingIncrement);
    }
}
