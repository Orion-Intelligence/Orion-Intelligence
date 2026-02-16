import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, ManagedPlatform, ManageProfilesModalData } from '../../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';

type ManagedPlatformRow = ManagedPlatform & {
  draftUsername: string;
  initialUsername: string;
};

@Component({
  selector: 'app-manage-profiles-modal',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
  templateUrl: './manage-profiles-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageProfilesModalComponent {
  data = input.required<ManageProfilesModalData | null>();

  close = output<void>();
  updateGraph = output<PlatformResult[]>();

  platforms = signal<ManagedPlatformRow[]>([]);
  searchTerm = signal('');
  visibleCount = signal(20);

  constructor() {
    effect(() => {
      const modalData = this.data();
      if (modalData) {
        const isImageFlow = this.isImageFlowUsername(modalData.username);
        this.platforms.set(modalData.platforms.map((p, index) => ({
          ...p,
          stableKey: `${index}|${p.platform}|${p.url}`,
          draftUsername: (p.username || '').trim(),
          initialUsername: (p.username || '').trim(),
          matches: isImageFlow ? false : true,
          isSelected: isImageFlow ? false : p.isSelected,
        })).sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') {
            return -1;
          }
          if (a.status !== 'active' && b.status === 'active') {
            return 1;
          }
          return a.platform.localeCompare(b.platform);
        }));
        this.searchTerm.set('');
        this.visibleCount.set(20);
      }
    });
  }

  filteredPlatforms = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filtered = !term
      ? this.platforms()
      : this.platforms().filter(p => p.platform.toLowerCase().includes(term) || p.draftUsername.toLowerCase().includes(term) || p.username.toLowerCase().includes(term));

    if (term) {
      return filtered;
    }

    const suggested = filtered.filter(p => p.status !== 'active');
    const active = filtered.filter(p => p.status === 'active');
    const topSuggested = suggested.slice(0, 3);
    const remainingSuggested = suggested.slice(3);

    return [...topSuggested, ...active, ...remainingSuggested];
  });

  displayPlatforms = computed(() => {
    const filtered = this.filteredPlatforms();
    if (this.searchTerm()) {
      return filtered;
    }
    return filtered.slice(0, this.visibleCount());
  });

  hasMatches = computed(() => this.filteredPlatforms().length > 0);
  pendingConfirmationCount = computed(() => this.platforms().filter(p => !p.matches || !this.hasValidDraftUsername(p)).length);

  areAllVisibleSelected = computed(() => {
    const filtered = this.filteredPlatforms();
    if (filtered.length === 0) {
      return false;
    }
    return filtered.every(p => p.isSelected);
  });

  areAllVisibleDeselected = computed(() => {
    const filtered = this.filteredPlatforms();
    if (filtered.length === 0) {
      return true;
    }
    return filtered.every(p => !p.isSelected);
  });

  onSearchChanged(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  private isImageFlowUsername(username: string): boolean {
    return username.toLowerCase().startsWith('image scan:');
  }

  isImageExtractedFlow(): boolean {
    const modalData = this.data();
    if (!modalData) {
      return false;
    }
    return this.isImageFlowUsername(modalData.username);
  }

  loadMore() {
    this.visibleCount.update(c => c + 20);
  }

  allProfilesConfirmed = computed(() => this.platforms().every(p => p.matches && this.hasValidDraftUsername(p)));

  hasValidDraftUsername(platform: ManagedPlatformRow): boolean {
    return (platform.draftUsername || '').trim().length > 0;
  }

  onUsernameChanged(platformToUpdate: ManagedPlatformRow, event: Event) {
    if (!this.isImageExtractedFlow()) {
      return;
    }
    const value = (event.target as HTMLInputElement).value;
    this.platforms.update(current =>
      current.map(p => {
        if (p.stableKey !== platformToUpdate.stableKey) {
          return p;
        }
        return { ...p, draftUsername: value, matches: false, isSelected: false };
      })
    );
  }

  confirmUsername(platformToUpdate: ManagedPlatformRow) {
    const isImageFlow = this.isImageExtractedFlow();
    if (!isImageFlow) {
      return;
    }
    this.platforms.update(current =>
      current.map(p => {
        if (p.stableKey !== platformToUpdate.stableKey) {
          return p;
        }
        const normalizedUsername = (p.draftUsername || '').trim();
        if (normalizedUsername.length === 0) {
          return { ...p, matches: false, isSelected: false };
        }
        return { ...p, username: normalizedUsername, matches: true, isSelected: isImageFlow ? true : p.isSelected };
      })
    );
  }

  unconfirmUsername(platformToUpdate: ManagedPlatformRow) {
    if (!this.isImageExtractedFlow()) {
      return;
    }
    this.platforms.update(current =>
      current.map(p => {
        if (p.stableKey !== platformToUpdate.stableKey) {
          return p;
        }
        return { ...p, matches: false, isSelected: false };
      })
    );
  }

  toggleSelection(platformToToggle: ManagedPlatformRow) {
    const isImageFlow = this.isImageExtractedFlow();
    this.platforms.update(current =>
      current.map(p => {
        if (p.stableKey !== platformToToggle.stableKey) {
          return p;
        }
        if (isImageFlow && (!p.matches || !this.hasValidDraftUsername(p))) {
          return { ...p, isSelected: false, matches: false };
        }
        return { ...p, isSelected: !p.isSelected };
      })
    );
  }

  isSelectionDisabled(platform: ManagedPlatformRow): boolean {
    if (!this.isImageExtractedFlow()) {
      return false;
    }
    if (platform.matches && this.hasValidDraftUsername(platform)) {
      return false;
    }
    return true;
  }

  private extractMatchedPageUrl(platform: ManagedPlatformRow): string {
    const metadata = (platform.allMetadata || {}) as any;
    const directMatch = metadata.matched_page;
    if (typeof directMatch === 'string' && directMatch.trim().length > 0) {
      return directMatch.trim();
    }
    const dataMatch = metadata.data?.matched_page;
    if (typeof dataMatch === 'string' && dataMatch.trim().length > 0) {
      return dataMatch.trim();
    }
    const nestedDataMatch = metadata.result?.matched_page;
    if (typeof nestedDataMatch === 'string' && nestedDataMatch.trim().length > 0) {
      return nestedDataMatch.trim();
    }
    return '';
  }

  getProfileUrl(platform: ManagedPlatformRow): string {
    const matchedPageUrl = this.extractMatchedPageUrl(platform);
    const rawUrl = (matchedPageUrl || platform.url || '').trim();
    const rawDraftUsername = (platform.draftUsername || '').trim();
    const rawInitialUsername = (platform.initialUsername || '').trim();
    if (rawUrl.length > 0) {
      let resolvedUrl = rawUrl;
      if (rawDraftUsername.length === 0 || rawInitialUsername.length === 0 || rawDraftUsername === rawInitialUsername) {
        if (rawDraftUsername.length > 0 && rawInitialUsername.length === 0) {
          try {
            const parsedUrl = new URL(rawUrl);
            const normalizedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
            if (normalizedPath.length === 0) {
              parsedUrl.pathname = `/${rawDraftUsername}`;
              resolvedUrl = parsedUrl.toString();
            }
          } catch {
            if (rawUrl.endsWith('/')) {
              resolvedUrl = `${rawUrl}${rawDraftUsername}`;
            } else {
              resolvedUrl = `${rawUrl}/${rawDraftUsername}`;
            }
          }
        }
        return resolvedUrl;
      }
      resolvedUrl = rawUrl.split(rawInitialUsername).join(rawDraftUsername);
      return resolvedUrl;
    }
    const username = rawDraftUsername;
    const platformName = (platform.platform || '').trim().toLowerCase();
    if (username.length === 0 || platformName.length === 0) {
      return '#';
    }
    return `https://${platformName}.com/${username}`;
  }

  isProfileUrlDisabled(platform: ManagedPlatformRow): boolean {
    if (this.getProfileUrl(platform) === '#') {
      return true;
    }
    return false;
  }

  onOpenProfileClick(event: Event) {
    event.stopPropagation();
  }

  onUsernameInputClick(event: Event) {
    event.stopPropagation();
  }

  onToggleConfirmUsernameClick(event: Event, platformToUpdate: ManagedPlatformRow) {
    event.stopPropagation();
    if (platformToUpdate.matches) {
      this.unconfirmUsername(platformToUpdate);
      return;
    }
    this.confirmUsername(platformToUpdate);
  }

  onSelectionSwitchClick(event: Event, platformToToggle: ManagedPlatformRow) {
    event.stopPropagation();
    if (this.isSelectionDisabled(platformToToggle)) {
      return;
    }
    this.toggleSelection(platformToToggle);
  }

  selectAllVisible() {
    const isImageFlow = this.isImageExtractedFlow();
    const visibleKeys = new Set(this.filteredPlatforms().map(p => p.stableKey));
    this.platforms.update(current =>
      current.map(p => {
        if (!visibleKeys.has(p.stableKey)) {
          return p;
        }
        if (isImageFlow && (!p.matches || !this.hasValidDraftUsername(p))) {
          return { ...p, isSelected: false, matches: false };
        }
        return { ...p, isSelected: true };
      })
    );
  }

  deselectAllVisible() {
    const visibleKeys = new Set(this.filteredPlatforms().map(p => p.stableKey));
    this.platforms.update(current =>
      current.map(p => {
        if (!visibleKeys.has(p.stableKey)) {
          return p;
        }
        return { ...p, isSelected: false };
      })
    );
  }

  usernameStatusLabel(platform: ManagedPlatformRow): string {
    if (!this.hasValidDraftUsername(platform)) {
      return 'Username required';
    }
    if (platform.matches) {
      return 'Confirmed';
    }
    return 'Needs confirmation';
  }

  usernameStatusClass(platform: ManagedPlatformRow): string {
    if (!this.hasValidDraftUsername(platform)) {
      return 'text-red-400 bg-red-500/10';
    }
    if (platform.matches) {
      return 'text-green-400 bg-green-500/10';
    }
    return 'text-yellow-400 bg-yellow-500/10';
  }

  isConfirmDisabled(platform: ManagedPlatformRow): boolean {
    if (platform.matches) {
      return false;
    }
    if (!this.hasValidDraftUsername(platform)) {
      return true;
    }
    return false;
  }

  confirmButtonLabel(platform: ManagedPlatformRow): string {
    if (platform.matches) {
      return 'Unconfirm';
    }
    return 'Confirm now';
  }

  trackByPlatformKey(_index: number, platform: ManagedPlatformRow): string {
    return platform.stableKey;
  }

  onUpdateGraph(): void {
    if (this.isImageExtractedFlow() && !this.allProfilesConfirmed()) {
      return;
    }
    this.updateGraph.emit(this.platforms().filter(p => p.isSelected));
  }
}
