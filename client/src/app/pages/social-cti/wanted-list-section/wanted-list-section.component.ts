import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocialFetchService } from '../services/social-fetch.service';

@Component({
  selector: 'app-social-wanted-list-section',
  standalone: true,
  templateUrl: './wanted-list-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WantedListSectionComponent implements OnDestroy {
  private static readonly profileStates = new Map<string, { query: string; records: any[]; searched: boolean; errorMessage: string }>();
  private readonly fetchService = inject(SocialFetchService);
  private requestId = 0;
  private subscription: Subscription | null = null;

  username = input.required<string>();
  query = signal('');
  records = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searched = signal(false);
  profileKey = computed(() => this.username());
  hasRecords = computed(() => this.records().length > 0);
  visibleRecords = computed(() => this.records().slice(0, 3));

  constructor() {
    effect(() => {
      const profileKey = this.profileKey();
      const savedState = profileKey ? WantedListSectionComponent.profileStates.get(profileKey) : null;
      this.subscription?.unsubscribe();
      this.requestId++;
      this.query.set(savedState?.query ?? '');
      this.records.set(savedState?.records ?? []);
      this.errorMessage.set(savedState?.errorMessage ?? '');
      this.searched.set(savedState?.searched ?? false);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.saveProfileState();
  }

  search(event?: Event): void {
    event?.stopPropagation();
    const query = this.query().trim();
    if (!query || this.isLoading()) {
      return;
    }
    const currentRequestId = ++this.requestId;
    this.subscription?.unsubscribe();
    this.searched.set(true);
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.records.set([]);
    this.saveProfileState();
    this.subscription = this.fetchService.fetchWantedList(query).subscribe({
      next: (records) => {
        if (currentRequestId !== this.requestId) {
          return;
        }
        this.records.set(Array.isArray(records) ? records : []);
        this.isLoading.set(false);
        this.saveProfileState();
      },
      error: () => {
        if (currentRequestId !== this.requestId) {
          return;
        }
        this.records.set([]);
        this.errorMessage.set('Could not search wanted list.');
        this.isLoading.set(false);
        this.saveProfileState();
      }
    });
  }

  private saveProfileState(): void {
    const profileKey = this.profileKey();
    if (!profileKey) {
      return;
    }
    WantedListSectionComponent.profileStates.set(profileKey, {
      query: this.query(),
      records: this.records(),
      searched: this.searched(),
      errorMessage: this.errorMessage()
    });
  }

  getRecordTrackKey(index: number, record: any): string {
    return `${this.getRecordTitle(record)}|${this.getRecordMeta(record)}|${index}`;
  }

  getRecordTitle(record: any): string {
    return record?.name || record?.caption || record?.entity || record?.id || 'Unknown person';
  }

  getRecordMeta(record: any): string {
    return record?.schema || record?.status || record?.authority || record?.program || record?.topics || record?.datasets || '-';
  }

  getRecordSummary(record: any): string {
    return record?.description || record?.summary || record?.notes || record?.source_url || '';
  }
}
