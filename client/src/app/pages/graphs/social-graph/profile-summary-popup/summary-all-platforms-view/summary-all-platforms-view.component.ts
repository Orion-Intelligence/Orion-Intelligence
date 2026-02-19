import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
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
    filteredPlatformsForDetails = computed(() => this.filterPlatforms(this.detailsSearchTerm(), p => p.profileDetails !== undefined));
    filteredPlatformsForPosts = computed(() => this.filterPlatforms(this.postsSearchTerm(), p => p.posts !== undefined));
    filteredPlatformsForImages = computed(() => this.filterPlatforms(this.imagesSearchTerm(), p => p.images !== undefined));
    displayPlatformsForDetails = computed(() => this.filteredPlatformsForDetails().slice(0, this.visibleDetailsPlatformsCount()));
    displayPlatformsForPosts = computed(() => this.filteredPlatformsForPosts().slice(0, this.visiblePostsPlatformsCount()));
    displayPlatformsForImages = computed(() => this.filteredPlatformsForImages().slice(0, this.visibleImagesPlatformsCount()));
    loadMoreDetailsPlatforms() { this.incrementVisible(this.visibleDetailsPlatformsCount); }
    loadMorePostsPlatforms() { this.incrementVisible(this.visiblePostsPlatformsCount); }
    loadMoreImagesPlatforms() { this.incrementVisible(this.visibleImagesPlatformsCount); }
    onDetailsSearch(event: Event) { this.onSearch(event, this.detailsSearchTerm, this.visibleDetailsPlatformsCount); }
    onPostsSearch(event: Event) { this.onSearch(event, this.postsSearchTerm, this.visiblePostsPlatformsCount); }
    onImagesSearch(event: Event) { this.onSearch(event, this.imagesSearchTerm, this.visibleImagesPlatformsCount); }
    clearDetailsSearch() { this.clearSearch(this.detailsSearchTerm, this.visibleDetailsPlatformsCount); }
    clearPostsSearch() { this.clearSearch(this.postsSearchTerm, this.visiblePostsPlatformsCount); }
    clearImagesSearch() { this.clearSearch(this.imagesSearchTerm, this.visibleImagesPlatformsCount); }
    getProfileDetailEntries(platform: PlatformResult | null): {
        key: string;
        value: any;
    }[] {
        return getProfileDetailEntries(platform);
    }
    getPlatformUniqueKey(platform: PlatformResult): string {
        return `platform-${platform.keyUsername}|${platform.platform}|${platform.username}`;
    }
    private filterPlatforms(term: string, hasData: (platform: PlatformResult) => boolean): PlatformResult[] {
        const normalizedTerm = term.toLowerCase();
        const allPlatforms = [...this.platforms()];
        allPlatforms.sort((a, b) => {
            const aHasData = hasData(a);
            const bHasData = hasData(b);
            if (aHasData && !bHasData) {
                return -1;
            }
            if (!aHasData && bHasData) {
                return 1;
            }
            return a.platform.localeCompare(b.platform);
        });
        if (!normalizedTerm) {
            return allPlatforms;
        }
        return allPlatforms.filter(platform => platform.platform.toLowerCase().includes(normalizedTerm));
    }
    private incrementVisible(target: WritableSignal<number>): void {
        target.update(count => count + 5);
    }
    private onSearch(event: Event, termSignal: WritableSignal<string>, visibleSignal: WritableSignal<number>): void {
        termSignal.set((event.target as HTMLInputElement).value);
        visibleSignal.set(5);
    }
    private clearSearch(termSignal: WritableSignal<string>, visibleSignal: WritableSignal<number>): void {
        termSignal.set('');
        visibleSignal.set(5);
    }
}
