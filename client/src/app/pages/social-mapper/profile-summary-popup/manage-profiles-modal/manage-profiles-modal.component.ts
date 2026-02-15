import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, ManagedPlatform, ManageProfilesModalData } from '../../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';

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

  platforms = signal<ManagedPlatform[]>([]);
  searchTerm = signal('');
  visibleCount = signal(20);

  
  constructor() {
    effect(() => {
      const modalData = this.data();
      if (modalData) {
        this.platforms.set(modalData.platforms.map(p => ({
          ...p,
          stableKey: `${p.platform}|${p.username}`,
          matches: true,
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
    if (!term) {
      return this.platforms();
    }
    return this.platforms().filter(p => p.platform.toLowerCase().includes(term) || p.username.toLowerCase().includes(term));
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
    const visible = this.displayPlatforms();
    if (visible.length === 0) {
      return false;
    }
    return visible.every(p => p.isSelected);
  });

  areAllVisibleDeselected = computed(() => {
    const visible = this.displayPlatforms();
    if (visible.length === 0) {
      return true;
    }
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
    const visibleKeys = new Set(this.displayPlatforms().map(p => p.stableKey));
    this.platforms.update(current => 
      current.map(p => {
        const isVisible = visibleKeys.has(p.stableKey);
        return isVisible ? { ...p, isSelected: true } : p;
      })
    );
  }

  deselectAllVisible() {
    const visibleKeys = new Set(this.displayPlatforms().map(p => p.stableKey));
    this.platforms.update(current => 
      current.map(p => {
        const isVisible = visibleKeys.has(p.stableKey);
        return isVisible ? { ...p, isSelected: false } : p;
      })
    );
  }

  trackByPlatformKey(_index: number, platform: ManagedPlatform): string {
    return platform.stableKey;
  }

  onUpdateGraph(): void {
    this.updateGraph.emit(this.platforms().filter(p => p.isSelected));
  }
}
