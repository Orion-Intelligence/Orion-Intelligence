import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/components/social-icon/social-icon.component';

@Component({
  selector: 'app-follower-scan-popup',
  templateUrl: './follower-scan-popup.component.html',
  styleUrls: ['./follower-scan-popup.component.css'],
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
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
    // Effect to reset displayed items when platform or search term changes
    effect(() => {
        this.displayFollowers.set(this.filteredFollowers().slice(0, this.initialLoadCount));
    });
    effect(() => {
        this.displayFollowing.set(this.filteredFollowing().slice(0, this.initialLoadCount));
    });
    
    // Effect to set initial tab based on data availability
    effect(() => {
      const platform = this.platform();
      if ((platform.followers_list?.length ?? 0) > 0) {
        this.activeTab.set('followers');
      } else if ((platform.following_list?.length ?? 0) > 0) {
        this.activeTab.set('following');
      } else {
        this.activeTab.set('followers');
      }
    }, { allowSignalWrites: true });
  }
  
  // Full lists from input
  followers = computed(() => this.platform().followers_list || []);
  following = computed(() => this.platform().following_list || []);

  // Full filtered lists
  filteredFollowers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.followers();
    return this.followers().filter(u => u.toLowerCase().includes(term));
  });
  filteredFollowing = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.following();
    return this.following().filter(u => u.toLowerCase().includes(term));
  });
  
  public getPlatformColor = getPlatformColor;

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

  loadMoreFollowers() {
    this._loadMore(this.isLoadingMoreFollowers, this.displayFollowers, this.filteredFollowers(), this.increment);
  }
  loadMoreFollowing() {
      this._loadMore(this.isLoadingMoreFollowing, this.displayFollowing, this.filteredFollowing(), this.increment);
  }

  private addItemsIncrementally(displaySignal: WritableSignal<string[]>, itemsToAdd: string[], onComplete: () => void) {
      if (itemsToAdd.length === 0) {
          onComplete();
          return;
      }
      let i = 0;
      const intervalId = setInterval(() => {
          if (i < itemsToAdd.length) {
              displaySignal.update(current => [...current, itemsToAdd[i]]);
              i++;
          } else {
              clearInterval(intervalId);
              onComplete();
          }
      }, 20);
  }

  private _loadMore(
      isLoadingSignal: WritableSignal<boolean>,
      displaySignal: WritableSignal<string[]>,
      allItems: string[],
      increment: number
  ) {
      if (isLoadingSignal()) return;
      isLoadingSignal.set(true);

      const currentCount = displaySignal().length;
      const nextItems = allItems.slice(currentCount, currentCount + increment);
      
      setTimeout(() => {
          this.addItemsIncrementally(displaySignal, nextItems, () => isLoadingSignal.set(false));
      }, 100);
  }
}
