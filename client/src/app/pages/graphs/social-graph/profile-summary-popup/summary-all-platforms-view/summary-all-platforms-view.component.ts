import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { SocialScanService } from '../../../shared/services/social-scan.service';
import { catchError, finalize, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
@Component({
  selector: 'app-summary-all-platforms-view',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
  templateUrl: './summary-all-platforms-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryAllPlatformsViewComponent {
  private socialScanService = inject(SocialScanService);

  username = input.required<string>();
  email = input<string | undefined>();
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
  profileLeaksLoading = signal(false);
  profileLeaksLoaded = signal(false);
  profileLeaksError = signal('');
  profileBreachCards = signal<any[]>([]);
  profileStealerRows = signal<any[]>([]);
  profileMetadataTokenInput = signal('');
  profileMetadataTokens = signal<string[]>([]);
  profileMetadataLoading = signal(false);
  profileMetadataLoaded = signal(false);
  profileMetadataError = signal('');
  profileMetadataResult = signal<{
        query: string;
        total_found: number;
        timestamp?: string;
        results: any[];
    } | null>(null);
  filteredPlatformsForDetails = computed(() => this.filterPlatforms(this.detailsSearchTerm(), p => p.profileDetails !== undefined));
  filteredPlatformsForPosts = computed(() => this.filterPlatforms(this.postsSearchTerm(), p => p.posts !== undefined));
  filteredPlatformsForImages = computed(() => this.filterPlatforms(this.imagesSearchTerm(), p => p.images !== undefined));
  displayPlatformsForDetails = computed(() => this.filteredPlatformsForDetails().slice(0, this.visibleDetailsPlatformsCount()));
  displayPlatformsForPosts = computed(() => this.filteredPlatformsForPosts().slice(0, this.visiblePostsPlatformsCount()));
  displayPlatformsForImages = computed(() => this.filteredPlatformsForImages().slice(0, this.visibleImagesPlatformsCount()));

  loadMoreDetailsPlatforms() {
    this.incrementVisible(this.visibleDetailsPlatformsCount); 
  }

  loadMorePostsPlatforms() {
    this.incrementVisible(this.visiblePostsPlatformsCount); 
  }

  loadMoreImagesPlatforms() {
    this.incrementVisible(this.visibleImagesPlatformsCount); 
  }

  onDetailsSearch(event: Event) {
    this.onSearch(event, this.detailsSearchTerm, this.visibleDetailsPlatformsCount); 
  }

  onPostsSearch(event: Event) {
    this.onSearch(event, this.postsSearchTerm, this.visiblePostsPlatformsCount); 
  }

  onImagesSearch(event: Event) {
    this.onSearch(event, this.imagesSearchTerm, this.visibleImagesPlatformsCount); 
  }

  clearDetailsSearch() {
    this.clearSearch(this.detailsSearchTerm, this.visibleDetailsPlatformsCount); 
  }

  clearPostsSearch() {
    this.clearSearch(this.postsSearchTerm, this.visiblePostsPlatformsCount); 
  }

  clearImagesSearch() {
    this.clearSearch(this.imagesSearchTerm, this.visibleImagesPlatformsCount); 
  }

  getProfileDetailEntries(platform: PlatformResult | null): {
        key: string;
        value: any;
    }[] {
    return getProfileDetailEntries(platform);
  }

  getPlatformUniqueKey(platform: PlatformResult): string {
    return `platform-${platform.keyUsername}|${platform.platform}|${platform.username}`;
  }

  fetchProfileLeaks(): void {
    const username = (this.username() || '').trim();
    const email = (this.email() || '').trim();
    const stealerQueries = Array.from(new Set([username, email].filter(v => !!v)));
    if (!username && !email) {
      this.profileLeaksError.set('No username or email found for this profile.');
      this.profileLeaksLoaded.set(true);
      this.profileBreachCards.set([]);
      this.profileStealerRows.set([]);
      return;
    }
    this.profileLeaksLoading.set(true);
    this.profileLeaksLoaded.set(false);
    this.profileLeaksError.set('');
    forkJoin({
      breach: this.socialScanService.fetchProfileBreachData(username, email).pipe(catchError(() => of({ cards_data: [] }))),
      stealer: stealerQueries.length > 0
        ? forkJoin(stealerQueries.map((query) => this.socialScanService.fetchStealerLogsByIdentity(query).pipe(catchError(() => of([]))))).pipe(map((groups: any[][]) => this.dedupeStealerRows(groups.flat())))
        : of([])
    }).pipe(finalize(() => {
      this.profileLeaksLoading.set(false);
      this.profileLeaksLoaded.set(true);
    })).subscribe({
      next: ({ breach, stealer }) => {
        this.profileBreachCards.set(Array.isArray(breach?.cards_data) ? breach.cards_data : []);
        this.profileStealerRows.set(Array.isArray(stealer) ? stealer : []);
      },
      error: () => {
        this.profileLeaksError.set('Failed to fetch profile leak data.');
        this.profileBreachCards.set([]);
        this.profileStealerRows.set([]);
      }
    });
  }

  fetchProfileMetadata(): void {
    const username = (this.username() || '').trim();
    if (!username) {
      this.profileMetadataError.set('No username found for this profile.');
      this.profileMetadataLoaded.set(true);
      this.profileMetadataResult.set(null);
      return;
    }
    this.addTokensFromInput();
    const tokens = this.profileMetadataTokens();
    if (!tokens.length) {
      this.profileMetadataError.set('Enter at least one token to search.');
      this.profileMetadataLoaded.set(true);
      this.profileMetadataResult.set(null);
      return;
    }
    this.profileMetadataLoading.set(true);
    this.profileMetadataLoaded.set(false);
    this.profileMetadataError.set('');
    this.socialScanService.fetchProfileMetadataTokens(tokens, username).pipe(finalize(() => {
      this.profileMetadataLoading.set(false);
      this.profileMetadataLoaded.set(true);
    })).subscribe({
      next: (res) => {
        this.profileMetadataResult.set(res || null);
      },
      error: () => {
        this.profileMetadataError.set('Failed to fetch profile metadata results.');
        this.profileMetadataResult.set(null);
      }
    });
  }

  onMetadataTokenKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTokensFromInput();
    }
  }

  addTokensFromInput(): void {
    const input = this.profileMetadataTokenInput();
    const tokens = this.parseTokens(input);
    if (!tokens.length) {
      return;
    }
    const next = [...this.profileMetadataTokens()];
    for (const token of tokens) {
      if (!next.includes(token)) {
        next.push(token);
      }
    }
    this.profileMetadataTokens.set(next);
    this.profileMetadataTokenInput.set('');
  }

  removeMetadataToken(token: string): void {
    this.profileMetadataTokens.set(this.profileMetadataTokens().filter(t => t !== token));
  }

  getObjectEntries(item: any): Array<{
        key: string;
        value: any;
    }> {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    return Object.entries(item).map(([key, value]) => ({ key, value }));
  }

  isArrayValue(value: any): boolean {
    return Array.isArray(value);
  }

  isObjectValue(value: any): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  stringifyPrimitive(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'not available';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
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

  private dedupeStealerRows(rows: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const row of rows || []) {
      const key = `${row?.domain || ''}|${row?.username || ''}|${row?.channel || ''}|${row?.timestamp || ''}|${row?.raw || ''}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(row);
    }
    return unique;
  }

  private parseTokens(input: string): string[] {
    return String(input || '')
      .split(/[,\n\r\t]+|\s+/)
      .map(token => token.trim())
      .filter(Boolean);
  }
}
