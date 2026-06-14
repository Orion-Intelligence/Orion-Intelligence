import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { ManagedPlatform, ManageProfilesModalData, PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';

type ManagedPlatformRow = ManagedPlatform & {
  draftUsername: string;
  initialUsername: string;
};

@Component({
  selector: 'app-manage-profiles-modal',
  standalone: true,
  imports: [SocialIconComponent, PlatformIconBgDirective],
  templateUrl: './manage-profiles-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageProfilesModalComponent {
  data = input.required<ManageProfilesModalData | null>();
  close = output<undefined>();
  updateGraph = output<PlatformResult[]>();
  searchUsername = output<string>();
  platforms = signal<ManagedPlatformRow[]>([]);
  searchTerm = signal('');
  visibleCount = signal(20);
  filteredPlatforms = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filtered = !term
      ? this.platforms()
      : this.platforms().filter(p => p.platform.toLowerCase().includes(term) || p.draftUsername.toLowerCase().includes(term) || p.username.toLowerCase().includes(term));
    if (term) {
      return filtered;
    }
    const informational = filtered.filter(p => p.status === 'informational');
    const suggested = filtered.filter(p => p.status !== 'active' && p.status !== 'informational');
    const active = filtered.filter(p => p.status === 'active');
    const topSuggested = suggested.slice(0, 3);
    const remainingSuggested = suggested.slice(3);
    return [...topSuggested, ...active, ...remainingSuggested, ...informational];
  });
  displayPlatforms = computed(() => {
    const filtered = this.filteredPlatforms();
    if (this.searchTerm()) {
      return filtered;
    }
    return filtered.slice(0, this.visibleCount());
  });
  hasMatches = computed(() => this.filteredPlatforms().length > 0);
  areAllVisibleSelected = computed(() => {
    const filtered = this.filteredPlatforms();
    return filtered.length > 0 && filtered.every(p => p.isSelected);
  });
  areAllVisibleDeselected = computed(() => this.filteredPlatforms().every(p => !p.isSelected));

  constructor() {
    effect(() => {
      const modalData = this.data();
      if (!modalData) {
        return;
      }
      const isImageFlow = this.isImageFlowUsername(modalData.username);
      this.platforms.set(modalData.platforms.map((p, index) => ({
        ...p,
        stableKey: `${index}|${p.platform}|${p.url}`,
        draftUsername: (p.username || '').trim(),
        initialUsername: (p.username || '').trim(),
        matches: !isImageFlow,
        isSelected: isImageFlow ? false : p.isSelected,
      })).sort((a, b) => {
        const weight = (status?: string) => {
          if (status === 'active') {
            return 0;
          }
          if (status === 'informational') {
            return 2;
          }
          return 1;
        };
        const weightDelta = weight(a.status) - weight(b.status);
        if (weightDelta !== 0) {
          return weightDelta;
        }
        return a.platform.localeCompare(b.platform);
      }));
      this.searchTerm.set('');
      this.visibleCount.set(20);
    });
  }

  onSearchChanged(event: Event): void {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(nextValue);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private isImageFlowUsername(username: string): boolean {
    return username.toLowerCase().startsWith('image scan:');
  }

  isImageExtractedFlow(): boolean {
    const modalData = this.data();
    return !!modalData && this.isImageFlowUsername(modalData.username);
  }

  isInformational(platform: ManagedPlatformRow): boolean {
    return platform.status === 'informational';
  }

  loadMore(): void {
    this.visibleCount.update(c => c + 20);
  }

  hasValidDraftUsername(platform: ManagedPlatformRow): boolean {
    return (platform.draftUsername || '').trim().length > 0;
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
          }
          catch {
            resolvedUrl = rawUrl.endsWith('/') ? `${rawUrl}${rawDraftUsername}` : `${rawUrl}/${rawDraftUsername}`;
          }
        }
        return resolvedUrl;
      }
      return rawUrl.split(rawInitialUsername).join(rawDraftUsername);
    }
    const username = rawDraftUsername;
    const platformName = (platform.platform || '').trim().toLowerCase();
    if (username.length === 0 || platformName.length === 0) {
      return '#';
    }
    return `https://${platformName}.com/${username}`;
  }

  isProfileUrlDisabled(platform: ManagedPlatformRow): boolean {
    return this.getProfileUrl(platform) === '#';
  }

  onOpenProfileClick(event: Event): void {
    event.stopPropagation();
  }

  onUsernameChanged(platformToUpdate: ManagedPlatformRow, event: Event): void {
    if (!this.isImageExtractedFlow()) {
      return;
    }
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.platforms.update(current => current.map(p => p.stableKey === platformToUpdate.stableKey ? { ...p, draftUsername: nextValue } : p));
  }

  onSearchUsernameClick(event: Event, platformToSearch: ManagedPlatformRow): void {
    event.stopPropagation();
    if (!this.isImageExtractedFlow() || this.isInformational(platformToSearch)) {
      return;
    }
    const username = (platformToSearch.draftUsername || '').trim();
    if (username) {
      this.searchUsername.emit(username);
    }
  }

  onPlatformCardClick(event: Event, platformToToggle: ManagedPlatformRow): void {
    event.stopPropagation();
    if (!this.isImageExtractedFlow()) {
      this.toggleSelection(platformToToggle);
    }
  }

  toggleSelection(platformToToggle: ManagedPlatformRow): void {
    if (this.isImageExtractedFlow()) {
      return;
    }
    this.platforms.update(current => current.map(p => p.stableKey === platformToToggle.stableKey ? { ...p, isSelected: !p.isSelected } : p));
  }

  onUsernameInputClick(event: Event): void {
    event.stopPropagation();
  }

  onSelectionSwitchClick(event: Event, platformToToggle: ManagedPlatformRow): void {
    event.stopPropagation();
    this.toggleSelection(platformToToggle);
  }

  private visiblePlatformKeys(): Set<string> {
    return new Set(this.filteredPlatforms().map(p => p.stableKey));
  }

  private updateVisiblePlatforms(updater: (platform: ManagedPlatformRow) => ManagedPlatformRow): void {
    const visibleKeys = this.visiblePlatformKeys();
    this.platforms.update(current => current.map(p => visibleKeys.has(p.stableKey) ? updater(p) : p));
  }

  selectAllVisible(): void {
    this.updateVisiblePlatforms(p => this.isInformational(p) ? { ...p, isSelected: false } : { ...p, isSelected: true });
  }

  deselectAllVisible(): void {
    this.updateVisiblePlatforms(p => ({ ...p, isSelected: false }));
  }

  trackByPlatformKey(_index: number, platform: ManagedPlatformRow): string {
    return platform.stableKey;
  }

  onUpdateGraph(): void {
    this.updateGraph.emit(this.platforms().filter(p => p.isSelected && !this.isInformational(p)));
  }
}
