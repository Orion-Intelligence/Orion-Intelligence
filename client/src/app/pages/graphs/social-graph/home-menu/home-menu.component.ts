import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject, effect, OnDestroy } from '@angular/core';

import { Job } from '../../../../shared/model/social/social-scan.models';
import { FetchingStateService } from '../services/fetching-state.service';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { SocialEntityUiService } from '../services/social-entity-ui.service';
import { SidebarShellComponent } from '../../shared/sidebar-shell/sidebar-shell.component';
@Component({
  selector: 'app-home-menu',
  templateUrl: './home-menu.component.html',
  standalone: true,
  imports: [SidebarShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMenuComponent implements OnDestroy {
  private fetchingState = inject(FetchingStateService);
  private animationFrameId: number | null = null;

  readonly socialEntityUiService = inject(SocialEntityUiService);
  isCollapsed = input.required<boolean>();
  activeTab = signal<'history'>('history');
  searchTerm = input.required<string>();
  jobs = input.required<Job[]>();
  activeUsernames = input.required<Set<string>>();
  isSmallScreen = input.required<boolean>();
  toggle = output<void>();
  historyTabClicked = output<void>();
  searchChanged = output<string>();
  scanRequested = output<void>();
  imageUploadRequested = output<void>();
  jobClicked = output<Job>();
  cancelScan = output<string>();
  cancelAllFetches = output<string>();
  public state = inject(SocialMapperStateService);
  visibleJobsCount = signal(10);
  animatedProgressByJobId = signal<Record<string, number>>({});
  jobsWithFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.jobs().map(job => ({
      ...job,
      matches: !term || job.username.toLowerCase().includes(term)
    }));
  });
  displayJobs = computed(() => this.jobsWithFilter().slice(0, this.visibleJobsCount()));
  hasJobMatches = computed(() => {
    return this.jobsWithFilter().some(j => j.matches);
  });

  constructor() {
    effect(() => {
      const jobs = this.jobs();
      this.pruneAnimatedProgress(jobs);
      this.startProgressAnimation();
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  loadMoreJobs() {
    this.visibleJobsCount.update(c => c + 10);
  }

  onSearchInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchChanged.emit(nextValue);
  }

  onSearchChanged(event: Event) {
    this.onSearchInput(event);
  }

  triggerScan() {
    this.scanRequested.emit();
  }

  triggerImageUpload() {
    this.imageUploadRequested.emit();
  }

  getJobClasses(job: Job): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-all duration-200';
    if (job.status === 'completed') {
      return `${baseClasses} border-slate-700 cursor-pointer hover:border-indigo-500 hover:bg-slate-800`;
    }
    if (job.status === 'in_progress' || job.status === 'queued') {
      return `${baseClasses} border-indigo-500/50`;
    }
    if (job.status === 'failed') {
      return `${baseClasses} border-red-500/50`;
    }
    return baseClasses;
  }

  getAnimatedProgress(job: Job): number {
    const current = this.animatedProgressByJobId()[job.id];
    if (current !== undefined) {
      return Math.round(current);
    }
    if (job.status === 'completed') {
      return 100;
    }
    return job.progress;
  }

  shouldShowCompletionProgress(job: Job): boolean {
    if (job.status !== 'completed') {
      return false;
    }
    return this.getAnimatedProgress(job) < 100;
  }

  isUserBusy(username: string): boolean {
    return this.fetchingState.isUserBusy(username);
  }

  private pruneAnimatedProgress(jobs: Job[]) {
    const next = this.socialEntityUiService.pruneAnimatedProgressMap(jobs, this.animatedProgressByJobId());
    if (next) {
      this.animatedProgressByJobId.set(next);
    }
  }

  private startProgressAnimation() {
    if (this.animationFrameId !== null) {
      return;
    }
    const tick = () => {
      const jobs = this.jobs();
      const currentMap = this.animatedProgressByJobId();
      const nextMap: Record<string, number> = { ...currentMap };
      let hasPendingAnimation = false;
      let hasChanges = false;
      for (const job of jobs) {
        let target = -1;
        if (job.status === 'in_progress' || job.status === 'queued') {
          target = Math.max(0, Math.min(100, job.progress));
        }
        else if (job.status === 'completed') {
          target = 100;
        }
        else {
          continue;
        }
        const current = nextMap[job.id] ?? target;
        const diff = target - current;
        if (Math.abs(diff) < 0.2) {
          if (nextMap[job.id] !== target) {
            nextMap[job.id] = target;
            hasChanges = true;
          }
        }
        else {
          const easedStep = diff * 0.16;
          nextMap[job.id] = current + easedStep;
          hasPendingAnimation = true;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this.animatedProgressByJobId.set(nextMap);
      }
      if (hasPendingAnimation) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
      else {
        this.animationFrameId = null;
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }
}
