import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, WritableSignal } from '@angular/core';

import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { PlatformIconBgDirective } from '../directives/platform-icon-bg.directive';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-follower-scan-popup',
  templateUrl: './follower-scan-popup.component.html',
  standalone: true,
  imports: [SocialIconComponent, PlatformIconBgDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowerScanPopupComponent {
  private readonly initialLoadCount = 30;
  private readonly increment = 30;

  platform = input.required<PlatformResult>();
  isFetchingFollowers = input<boolean>(false);
  isFetchingFollowing = input<boolean>(false);
  close = output<undefined>();
  scan = output<string[]>();
  fetchFollowers = output<undefined>();
  fetchFollowing = output<undefined>();
  activeTab = signal<'followers' | 'following' | 'connections'>('followers');
  searchTerm = signal('');
  selectedUsernames = signal(new Set<string>());
  displayFollowers = signal<string[]>([]);
  displayFollowing = signal<string[]>([]);
  displayConnections = signal<string[]>([]);
  isLoadingMoreFollowers = signal(false);
  isLoadingMoreFollowing = signal(false);
  isLoadingMoreConnections = signal(false);
  readonly MAX_SELECTION = 3;
  followers = computed(() => this.platform().followers_list || []);
  following = computed(() => this.platform().following_list || []);
  connections = computed(() => this.platform().post_connections || []);
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
  filteredConnections = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.connections();
    }
    return this.connections().filter(u => u.toLowerCase().includes(term));
  });

  constructor() {
    effect(() => {
      this.displayFollowers.set(this.filteredFollowers().slice(0, this.initialLoadCount));
    });
    effect(() => {
      this.displayFollowing.set(this.filteredFollowing().slice(0, this.initialLoadCount));
    });
    effect(() => {
      this.displayConnections.set(this.filteredConnections().slice(0, this.initialLoadCount));
    });
    effect(() => {
      const platform = this.platform();
      if ((platform.followers_list?.length ?? 0) > 0) {
        this.activeTab.set('followers');
      }
      else if ((platform.following_list?.length ?? 0) > 0) {
        this.activeTab.set('following');
      }
      else if ((platform.post_connections?.length ?? 0) > 0) {
        this.activeTab.set('connections');
      }
      else {
        this.activeTab.set('followers');
      }
    });
  }

  onSearchInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(nextValue);
  }

  toggleSelection(username: string) {
    this.selectedUsernames.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(username)) {
        newSet.delete(username);
      }
      else {
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
    this.close.emit(undefined);
  }

  scanSingle(username: string) {
    this.scan.emit([username]);
    this.close.emit(undefined);
  }

  loadMoreFollowers() {
    this._loadMore(this.isLoadingMoreFollowers, this.displayFollowers, this.filteredFollowers(), this.increment);
  }

  loadMoreFollowing() {
    this._loadMore(this.isLoadingMoreFollowing, this.displayFollowing, this.filteredFollowing(), this.increment);
  }

  loadMoreConnections() {
    this._loadMore(this.isLoadingMoreConnections, this.displayConnections, this.filteredConnections(), this.increment);
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  getProfileUrl(username: string): string {
    const platform = this.platform();
    return buildSocialProfileUrl(platform.platform, username, platform.url);
  }

  getCurrentAccountUrl(): string {
    const platform = this.platform();
    return buildSocialProfileUrl(platform.platform, platform.username, platform.url);
  }

  private addItems<T>(displaySignal: WritableSignal<T[]>, itemsToAdd: T[], onComplete: () => void) {
    if (itemsToAdd.length === 0) {
      onComplete();
      return;
    }
    displaySignal.update(current => [...current, ...itemsToAdd]);
    onComplete();
  }

  private _loadMore<T>(isLoadingSignal: WritableSignal<boolean>, displaySignal: WritableSignal<T[]>, allItems: T[], increment: number) {
    if (isLoadingSignal()) {
      return;
    }
    isLoadingSignal.set(true);
    const currentCount = displaySignal().length;
    const nextItems = allItems.slice(currentCount, currentCount + increment);
    this.addItems(displaySignal, nextItems, () => isLoadingSignal.set(false));
  }
}
