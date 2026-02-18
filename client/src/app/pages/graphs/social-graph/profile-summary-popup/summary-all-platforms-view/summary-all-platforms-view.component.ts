import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';

@Component({
  selector: 'app-summary-all-platforms-view',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
  templateUrl: './summary-all-platforms-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryAllPlatformsViewComponent {
  username = input.required<string>();
  platforms = input.required<PlatformResult[]>();
  isScanInProgress = input<boolean>(false);

  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchPlatformImages = output<PlatformResult>();

  detailsSearchTerm = signal('');
  postsSearchTerm = signal('');
  imagesSearchTerm = signal('');

  visibleDetailsPlatformsCount = signal(5);
  visiblePostsPlatformsCount = signal(5);
  visibleImagesPlatformsCount = signal(5);

  public fetchingState = inject(FetchingStateService);
  public formatKey = formatKey;

  filteredPlatformsForDetails = computed(() => {
    const term = this.detailsSearchTerm().toLowerCase();
    const allPlatforms = [...this.platforms()];

    allPlatforms.sort((a, b) => {
        const aHasData = a.profileDetails !== undefined;
        const bHasData = b.profileDetails !== undefined;
        if (aHasData && !bHasData) {
	return -1;
}
        if (!aHasData && bHasData) {
	return 1;
}
        return a.platform.localeCompare(b.platform);
    });

    if (!term) {
	return allPlatforms;
}
    return allPlatforms.filter(p => p.platform.toLowerCase().includes(term));
  });

  filteredPlatformsForPosts = computed(() => {
    const term = this.postsSearchTerm().toLowerCase();
    const allPlatforms = [...this.platforms()];

    allPlatforms.sort((a, b) => {
        const aHasData = a.posts !== undefined;
        const bHasData = b.posts !== undefined;
        if (aHasData && !bHasData) {
	return -1;
}
        if (!aHasData && bHasData) {
	return 1;
}
        return a.platform.localeCompare(b.platform);
    });

    if (!term) {
	return allPlatforms;
}
    return allPlatforms.filter(p => p.platform.toLowerCase().includes(term));
  });

  filteredPlatformsForImages = computed(() => {
    const term = this.imagesSearchTerm().toLowerCase();
    const allPlatforms = [...this.platforms()];

    allPlatforms.sort((a, b) => {
        const aHasData = a.images !== undefined;
        const bHasData = b.images !== undefined;
        if (aHasData && !bHasData) {
	return -1;
}
        if (!aHasData && bHasData) {
	return 1;
}
        return a.platform.localeCompare(b.platform);
    });

    if (!term) {
	return allPlatforms;
}
    return allPlatforms.filter(p => p.platform.toLowerCase().includes(term));
  });

  displayPlatformsForDetails = computed(() => this.filteredPlatformsForDetails().slice(0, this.visibleDetailsPlatformsCount()));
  displayPlatformsForPosts = computed(() => this.filteredPlatformsForPosts().slice(0, this.visiblePostsPlatformsCount()));
  displayPlatformsForImages = computed(() => this.filteredPlatformsForImages().slice(0, this.visibleImagesPlatformsCount()));

  loadMoreDetailsPlatforms() { this.visibleDetailsPlatformsCount.update(c => c + 5); }
  loadMorePostsPlatforms() { this.visiblePostsPlatformsCount.update(c => c + 5); }
  loadMoreImagesPlatforms() { this.visibleImagesPlatformsCount.update(c => c + 5); }

  onDetailsSearch(event: Event) { this.detailsSearchTerm.set((event.target as HTMLInputElement).value); this.visibleDetailsPlatformsCount.set(5); }
  onPostsSearch(event: Event) { this.postsSearchTerm.set((event.target as HTMLInputElement).value); this.visiblePostsPlatformsCount.set(5); }
  onImagesSearch(event: Event) { this.imagesSearchTerm.set((event.target as HTMLInputElement).value); this.visibleImagesPlatformsCount.set(5); }

  clearDetailsSearch() { this.detailsSearchTerm.set(''); this.visibleDetailsPlatformsCount.set(5); }
  clearPostsSearch() { this.postsSearchTerm.set(''); this.visiblePostsPlatformsCount.set(5); }
  clearImagesSearch() { this.imagesSearchTerm.set(''); this.visibleImagesPlatformsCount.set(5); }

  getProfileDetailEntries(platform: PlatformResult | null): { key: string, value: any }[] {
    if (!platform) {
	return [];
}
    const details = platform.profileDetails;
    if (!details) {
	return [];
}
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }

  getPlatformUniqueKey(platform: PlatformResult): string {
    return `platform-${platform.keyUsername}|${platform.platform}|${platform.username}`;
  }
}
