import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job, CustomEntity } from '../../../../shared/model/social/social-scan.models';
import { FetchingStateService } from '../services/fetching-state.service';
import { SocialMapperStateService } from '../services/social-mapper-state.service';
import { SidebarShellComponent } from '../../shared/sidebar-shell/sidebar-shell.component';
@Component({
  selector: 'app-home-menu',
  templateUrl: './home-menu.component.html',
  standalone: true,
  imports: [CommonModule, SidebarShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMenuComponent implements OnDestroy {
  private fetchingState = inject(FetchingStateService);
  private animationFrameId: number | null = null;

  isCollapsed = input.required<boolean>();
  activeTab = input.required<'history' | 'entities'>();
  searchTerm = input.required<string>();
  jobs = input.required<Job[]>();
  customEntities = input.required<CustomEntity[]>();
  activeUsernames = input.required<Set<string>>();
  viewMode = input.required<'graph' | 'list'>();
  isSmallScreen = input.required<boolean>();
  toggle = output<void>();
  tabSelected = output<'history' | 'entities'>();
  searchChanged = output<string>();
  jobClicked = output<Job>();
  entityClicked = output<string>();
  cancelScan = output<string>();
  cancelAllFetches = output<string>();
  public state = inject(SocialMapperStateService);
  visibleJobsCount = signal(10);
  visibleEntitiesCount = signal(10);
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
  filteredEntities = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.customEntities();
    }
    return this.customEntities().filter(entity => entity.label.toLowerCase().includes(term) ||
            entity.type.toLowerCase().includes(term));
  });
  displayEntities = computed(() => this.filteredEntities().slice(0, this.visibleEntitiesCount()));

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

  loadMoreEntities() {
    this.visibleEntitiesCount.update(c => c + 10);
  }

  onSearchInput(event: Event) {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  getJobClasses(job: Job): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-all duration-200';
    if (job.status === 'completed') {
      return `${baseClasses} border-slate-700 cursor-pointer hover:border-indigo-500 hover:bg-slate-800`;
    }
    if (job.status === 'in_progress') {
      return `${baseClasses} border-indigo-500/50`;
    }
    if (job.status === 'failed') {
      return `${baseClasses} border-red-500/50`;
    }
    return baseClasses;
  }

  getEntityClasses(entity: CustomEntity): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-all duration-200';
    const canInteract = !entity.onGraph && entity.status === 'added';
    return `${baseClasses} border-slate-700 ${canInteract ? 'cursor-pointer hover:border-green-500 hover:bg-slate-800' : ''}`;
  }

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
    }
  }

  trackByJobId(_index: number, job: Job): string {
    return job.id;
  }

  trackByEntityId(_index: number, entity: CustomEntity): string {
    return entity.id;
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
    const activeIds = new Set(jobs.map(job => job.id));
    const current = this.animatedProgressByJobId();
    const next: Record<string, number> = {};
    let changed = false;
    for (const key of Object.keys(current)) {
      if (activeIds.has(key)) {
        next[key] = current[key];
      }
      else {
        changed = true;
      }
    }
    if (changed) {
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
        if (job.status === 'in_progress') {
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
