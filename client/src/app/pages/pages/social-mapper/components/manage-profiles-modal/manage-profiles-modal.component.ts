import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { getPlatformColor } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';

type ManagedPlatform = PlatformResult & { stableKey: string; matches: boolean; };

export interface ManageProfilesModalData {
    username: string;
    platforms: PlatformResult[];
}

@Component({
  selector: 'app-manage-profiles-modal',
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
  templateUrl: './manage-profiles-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageProfilesModalComponent {
  data = input.required<ManageProfilesModalData | null>();
  
  close = output<void>();
  updateGraph = output<PlatformResult[]>();

  platforms = signal<ManagedPlatform[]>([]);
  searchTerm = signal('');
  visibleCount = signal(20);

  public getPlatformColor = getPlatformColor;
  
  constructor() {
    effect(() => {
      const modalData = this.data();
      if (modalData) {
        this.platforms.set(modalData.platforms.map(p => ({
          ...p,
          stableKey: `${p.platform}|${p.username}`,
          matches: true,
        })).sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return a.platform.localeCompare(b.platform);
        }));
        this.searchTerm.set('');
        this.visibleCount.set(20);
      }
    });
  }

  platformsWithFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allPlatforms = this.platforms();
    if (!term) return allPlatforms.map(p => ({ ...p, matches: true }));
    
    return allPlatforms.map(p => ({
        ...p,
        matches: p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term)
    }));
  });

  displayPlatforms = computed(() => {
    const filtered = this.platformsWithFilter().filter(p => p.matches);
    if (this.searchTerm()) return filtered;
    return filtered.slice(0, this.visibleCount());
  });

  hasMatches = computed(() => this.platformsWithFilter().some(p => p.matches));

  areAllVisibleSelected = computed(() => {
    const visible = this.platformsWithFilter().filter(p => p.matches);
    if (visible.length === 0) return false;
    return visible.every(p => p.isSelected);
  });

  areAllVisibleDeselected = computed(() => {
    const visible = this.platformsWithFilter().filter(p => p.matches);
    if (visible.length === 0) return true;
    return visible.every(p => !p.isSelected);
  });

  onSearchChanged(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  loadMore() {
    this.visibleCount.update(c => c + 20);
  }

  toggleSelection(platformToToggle: ManagedPlatform) {
    this.platforms.update(current => 
      current.map(p => 
        p.stableKey === platformToToggle.stableKey 
          ? { ...p, isSelected: !p.isSelected } 
          : p
      )
    );
  }

  selectAllVisible() {
    const term = this.searchTerm().toLowerCase();
    this.platforms.update(current => 
      current.map(p => {
        const isVisible = !term || p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term);
        return isVisible ? { ...p, isSelected: true } : p;
      })
    );
  }

  deselectAllVisible() {
    const term = this.searchTerm().toLowerCase();
    this.platforms.update(current => 
      current.map(p => {
        const isVisible = !term || p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term);
        return isVisible ? { ...p, isSelected: false } : p;
      })
    );
  }

  onUpdateGraph(): void {
    this.updateGraph.emit(this.platforms().filter(p => p.isSelected));
  }
}