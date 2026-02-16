import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../shared/components/social-icon/social-icon.component';
import { PlatformIconBgDirective } from '../directives/platform-icon-bg.directive';

@Component({
  selector: 'app-follower-scan-popup',
  templateUrl: './follower-scan-popup.component.html',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowerScanPopupComponent {
  platform = input.required<PlatformResult>();
  isFetchingFollowers = input<boolean>(false);
  isFetchingFollowing = input<boolean>(false);

  close = output<void>();
  scan = output<string[]>();
  fetchFollowers = output<void>();
  fetchFollowing = output<void>();

  activeTab = signal<'followers' | 'following'>('followers');
  searchTerm = signal('');
  selectedUsernames = signal(new Set<string>());

  displayFollowers = signal<string[]>([]);
  displayFollowing = signal<string[]>([]);
  isLoadingMoreFollowers = signal(false);
  isLoadingMoreFollowing = signal(false);

  private readonly initialLoadCount = 30;
  private readonly increment = 30;
  readonly MAX_SELECTION = 3;

  constructor() {
    effect(() => {
      this.displayFollowers.set(this.filteredFollowers().slice(0, this.initialLoadCount));
    });
    effect(() => {
      this.displayFollowing.set(this.filteredFollowing().slice(0, this.initialLoadCount));
    });

    effect(() => {
      const platform = this.platform();
      if ((platform.followers_list?.length ?? 0) > 0) {
        this.activeTab.set('followers');
      } else if ((platform.following_list?.length ?? 0) > 0) {
        this.activeTab.set('following');
      } else {
        this.activeTab.set('followers');
      }
    });
  }

  followers = computed(() => this.platform().followers_list || []);
  following = computed(() => this.platform().following_list || []);

  filteredFollowers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.followers();
    }
    return this.followers().filter(u => u.toLowerCase().includes(term));
  });
  filteredFollowing = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.following();
    }
    return this.following().filter(u => u.toLowerCase().includes(term));
  });

  onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleSelection(username: string) {
    this.selectedUsernames.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        if (newSet.size < this.MAX_SELECTION) {
          newSet.add(username);
        }
      }
      return newSet;
    });
  }

  isSelected(username: string): boolean {
    return this.selectedUsernames().has(username);
  }

  confirmScan() {
    this.scan.emit(Array.from(this.selectedUsernames()));
  }

  scanSingle(username: string) {
    this.scan.emit([username]);
  }

  loadMoreFollowers() {
    this._loadMore(this.isLoadingMoreFollowers, this.displayFollowers, this.filteredFollowers(), this.increment);
  }

  loadMoreFollowing() {
    this._loadMore(this.isLoadingMoreFollowing, this.displayFollowing, this.filteredFollowing(), this.increment);
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  getProfileUrl(username: string): string {
    let normalizedUsername = username.trim();
    const platform = this.platform().platform.toLowerCase();
    if (normalizedUsername.startsWith('@')) {
      normalizedUsername = normalizedUsername.substring(1);
    }
    if (platform === 'twitter' || platform === 'x') {
      return `https://x.com/${normalizedUsername}`;
    }
    if (platform === 'instagram') {
      return `https://www.instagram.com/${normalizedUsername}`;
    }
    if (platform === 'tiktok') {
      return `https://www.tiktok.com/@${normalizedUsername}`;
    }
    if (platform === 'facebook') {
      return `https://www.facebook.com/${normalizedUsername}`;
    }
    if (platform === 'youtube') {
      return `https://www.youtube.com/@${normalizedUsername}`;
    }
    const baseUrl = this.platform().url?.trim();
    if (!baseUrl) {
      return '#';
    }
    try {
      const parsedUrl = new URL(baseUrl);
      const hasTrailingSlash = parsedUrl.pathname.endsWith('/');
      parsedUrl.pathname = hasTrailingSlash ? `${parsedUrl.pathname}${normalizedUsername}` : `${parsedUrl.pathname}/${normalizedUsername}`;
      return parsedUrl.toString();
    } catch {
      return baseUrl;
    }
  }

  getCurrentAccountUrl(): string {
    return this.platform().url || '#';
  }

  private addItems(displaySignal: WritableSignal<string[]>, itemsToAdd: string[], onComplete: () => void) {
    if (itemsToAdd.length === 0) {
      onComplete();
      return;
    }
    displaySignal.update(current => [...current, ...itemsToAdd]);
    onComplete();
  }

  private _loadMore(isLoadingSignal: WritableSignal<boolean>, displaySignal: WritableSignal<string[]>, allItems: string[], increment: number) {
    if (isLoadingSignal()) {
      return;
    }
    isLoadingSignal.set(true);

    const currentCount = displaySignal().length;
    const nextItems = allItems.slice(currentCount, currentCount + increment);

    this.addItems(displaySignal, nextItems, () => isLoadingSignal.set(false));
  }
}
