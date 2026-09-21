import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { Subscription, finalize, interval } from 'rxjs';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { ManageProfilesService } from '../manage-profiles.service';
import { PlatformEntry, SocialPersona, SocialProfile } from '../model/manage-profiles.model';
import { ManageProfilePostRow, ManageProfileResultRow, ManageProfileResultsView } from '../model/manage-profiles.interfaces.model';
import { RESULTS_DEFAULT_VIEW, RESULTS_REFRESH_INTERVAL_MS, RESULTS_VIEW_OPTIONS, SHIMMER_ROWS } from '../constants/manage-profiles.constants';
import { buildResultRows, flattenPostRows, platformLabel, profileOptionLabel, safePlatform } from '../manage-profiles.util';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../../shared/partials/ui-dropdown/ui-dropdown.component';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { SocialIconComponent } from '../../../shared/partials/social-icon/social-icon.component';

@Component({
  selector: 'app-manage-profile-results',
  standalone: true,
  imports: [DatePipe, NgClass, TranslatePipe, UiDropdownComponent, ConfirmationPopupComponent, SocialIconComponent],
  templateUrl: './manage-profile-results.component.html',
})
export class ManageProfileResultsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private pending: Subscription | null = null;

  readonly profiles = input<SocialProfile[]>([]);
  readonly platforms = input<PlatformEntry[]>([]);
  readonly personas = input<SocialPersona[]>([]);
  readonly resultsLoading = signal(false);
  readonly rows = signal<ManageProfileResultRow[]>([]);
  readonly runningCount = signal(0);
  readonly expandedResults = signal<Set<string>>(new Set<string>());
  readonly stoppingRuns = signal<Set<string>>(new Set<string>());
  readonly selectedProfileId = signal('');
  readonly view = signal<ManageProfileResultsView>(RESULTS_DEFAULT_VIEW);
  readonly viewOptions: UiDropdownOption[] = RESULTS_VIEW_OPTIONS;
  readonly clearing = signal(false);
  readonly confirmClear = signal(false);
  readonly deletingKeys = signal<Set<string>>(new Set<string>());
  readonly profileOptions = computed<UiDropdownOption[]>(() => this.profiles().map(profile => ({ key: profile.profile_id, label: profileOptionLabel(this.platforms(), profile) })));
  readonly profileRows = computed(() => {
    const profileId = this.selectedProfileId();
    return profileId ? this.rows().filter(row => row.profileId === profileId) : this.rows();
  });
  readonly visibleRows = computed(() => {
    const view = this.view();
    if (view === 'ads') {
      return this.profileRows().filter(row => row.activity === 'ad_detection');
    }
    if (view === 'hate_speech') {
      return this.profileRows().filter(row => row.activity === 'hate_speech');
    }
    return this.profileRows().filter(row => row.activity === 'posting' && (row.running || row.error));
  });
  readonly visiblePosts = computed<ManageProfilePostRow[]>(() => this.view() === 'posts' ? flattenPostRows(this.profileRows(), this.profiles()).filter(post => post.source === 'published') : []);
  readonly hasClearableResults = computed(() => {
    const view = this.view();
    const activity = view === 'ads' ? 'ad_detection' : view === 'hate_speech' ? 'hate_speech' : 'posting';
    return this.profileRows().some(row => !row.running && row.activity === activity);
  });
  readonly shimmerRows = SHIMMER_ROWS;

  constructor(private service: ManageProfilesService, private notification: MessageNotificationService) {}

  ngOnInit(): void {
    this.loadResults(true);
    interval(RESULTS_REFRESH_INTERVAL_MS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadResults(false);
    });
  }

  toggleResult(key: string): void {
    this.expandedResults.update(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      }
      else {
        next.add(key);
      }
      return next;
    });
  }

  isResultExpanded(key: string): boolean {
    return this.expandedResults().has(key);
  }

  selectProfile(profileId: string | null): void {
    this.selectedProfileId.set(profileId ?? '');
  }

  selectView(view: string | null): void {
    this.view.set(view === 'posts' || view === 'hate_speech' ? view : RESULTS_DEFAULT_VIEW);
  }

  selectedProfileLabel(): string {
    const profile = this.profiles().find(entry => entry.profile_id === this.selectedProfileId());
    return profile ? profileOptionLabel(this.platforms(), profile) : '';
  }

  safePlatform(platform: string): string {
    return safePlatform(platform ?? '');
  }

  platformLabel(platform: string): string {
    return platformLabel(this.platforms(), platform ?? '');
  }

  personaName(profileId: string): string {
    const personaId = this.profiles().find(entry => entry.profile_id === profileId)?.assigned_persona_id;
    if (!personaId) {
      return '';
    }
    return this.personas().find(entry => entry.persona_id === personaId)?.name ?? '';
  }

  clearConfirmationMessage(): string {
    const kind = this.view() === 'ads' ? 'ad' : this.view() === 'hate_speech' ? 'profile monitoring' : 'post';
    const label = this.selectedProfileLabel();
    return label ? `Clear all ${kind} results for "${label}"? This cannot be undone.` : `Clear all ${kind} results for every profile? This cannot be undone.`;
  }

  clearLabel(): string {
    const kind = this.view() === 'ads' ? 'Ads' : this.view() === 'hate_speech' ? 'Profile Monitoring' : 'Posts';
    return this.selectedProfileId() ? `Clear Profile ${kind}` : `Clear All ${kind}`;
  }

  requestClear(): void {
    if (this.clearing() || !this.hasClearableResults()) {
      return;
    }
    this.confirmClear.set(true);
  }

  handleClearConfirmation(confirmed: boolean): void {
    this.confirmClear.set(false);
    if (!confirmed) {
      return;
    }
    this.clearing.set(true);
    this.service.clearResults(this.selectedProfileId(), this.view()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.clearing.set(false);
    })).subscribe({
      next: () => {
        this.notification.show('Results cleared', 'success');
        this.pending?.unsubscribe();
        this.loadResults(false);
      },
      error: (error) => {
        this.notification.show(error?.error?.detail ?? 'Failed to clear results', 'fail');
      },
    });
  }

  isDeleting(key: string): boolean {
    return this.deletingKeys().has(key);
  }

  deleteRecord(key: string, activity: string, profileId: string, dateTime: string, event: Event): void {
    event.stopPropagation();
    if (this.deletingKeys().has(key)) {
      return;
    }
    this.deletingKeys.update(current => new Set(current).add(key));
    this.service.deleteResultItem(activity, profileId, dateTime).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.deletingKeys.update(current => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    })).subscribe({
      next: () => {
        this.notification.show('Record removed', 'success');
        this.pending?.unsubscribe();
        this.loadResults(false);
      },
      error: (error) => {
        this.notification.show(error?.error?.detail ?? 'Failed to remove record', 'fail');
      },
    });
  }

  isRunStopping(runId: string): boolean {
    return this.stoppingRuns().has(runId);
  }

  stopRun(row: ManageProfileResultRow, event: Event): void {
    event.stopPropagation();
    if (!row.runId || this.isRunStopping(row.runId)) {
      return;
    }
    this.stoppingRuns.update(current => new Set(current).add(row.runId));
    this.service.stopRun(row.runId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notification.show('Run is stopping', 'success');
        this.loadResults(false);
      },
      error: (error) => {
        this.releaseStopping(row.runId);
        this.notification.show(error?.error?.detail ?? 'Failed to stop this run', 'fail');
      },
    });
  }

  private releaseStopping(runId: string): void {
    this.stoppingRuns.update(current => {
      const next = new Set(current);
      next.delete(runId);
      return next;
    });
  }

  private loadResults(showLoader: boolean): void {
    if (this.pending && !this.pending.closed) {
      return;
    }
    if (showLoader) {
      this.resultsLoading.set(true);
    }
    this.pending = this.service.getResultsOverview().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.resultsLoading.set(false);
    })).subscribe({
      next: (response) => {
        const { running, finished } = buildResultRows(response, this.profiles(), this.platforms());
        this.runningCount.set(running.length);
        this.rows.set([...running, ...finished]);
        const liveIds = new Set(running.map(row => row.runId));
        this.stoppingRuns.update(current => new Set([...current].filter(runId => liveIds.has(runId))));
      },
      error: (error) => {
        if (showLoader) {
          this.notification.show(error?.error?.detail ?? 'Failed to load results');
        }
      },
    });
  }
}
