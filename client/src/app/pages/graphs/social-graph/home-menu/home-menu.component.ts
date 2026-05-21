import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject, effect, OnDestroy } from '@angular/core';

import { Job, CustomEntity } from '../../../../shared/model/social/social-scan.models';
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
  activeTab = input.required<'history' | 'entities'>();
  searchTerm = input.required<string>();
  jobs = input.required<Job[]>();
  customEntities = input.required<CustomEntity[]>();
  activeUsernames = input.required<Set<string>>();
  isSmallScreen = input.required<boolean>();
  toggle = output<undefined>();
  tabSelected = output<'history' | 'entities'>();
  searchChanged = output<string>();
  jobClicked = output<Job>();
  entityClicked = output<string>();
  deleteEntity = output<string>();
  cancelEntityScan = output<string>();
  cancelScan = output<string>();
  cancelAllFetches = output<string>();
  public state = inject(SocialMapperStateService);
  visibleJobsCount = signal(10);
  visibleEntitiesCount = signal(10);
  animatedProgressByJobId = signal<Record<string, number>>({});
  animatedProgressByEntityId = signal<Record<string, number>>({});
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
    effect(() => {
      const entities = this.customEntities();
      this.pruneAnimatedEntityProgress(entities);
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
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchChanged.emit(nextValue);
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

  getEntityClasses(entity: CustomEntity): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-all duration-200';
    if (entity.status === 'in_progress' || entity.status === 'pending') {
      return `${baseClasses} border-indigo-500/50`;
    }
    if (entity.status === 'failed') {
      return `${baseClasses} border-red-500/50`;
    }
    return `${baseClasses} border-slate-700 cursor-pointer hover:border-indigo-500 hover:bg-slate-800`;
  }

  getEntityProgress(entity: CustomEntity): number {
    const value = entity.progress ?? (entity.status === 'added' ? 100 : 0);
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  getAnimatedEntityProgress(entity: CustomEntity): number {
    const current = this.animatedProgressByEntityId()[entity.id];
    if (current !== undefined) {
      return Math.round(current);
    }
    return this.getEntityProgress(entity);
  }

  showEntityProgress(entity: CustomEntity): boolean {
    return entity.status === 'in_progress' || entity.status === 'pending' || entity.status === 'failed' || this.getAnimatedEntityProgress(entity) > 0;
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
    const next = this.socialEntityUiService.pruneAnimatedProgressMap(jobs, this.animatedProgressByJobId());
    if (next) {
      this.animatedProgressByJobId.set(next);
    }
  }

  private pruneAnimatedEntityProgress(entities: CustomEntity[]) {
    const next = this.socialEntityUiService.pruneAnimatedProgressMap(entities, this.animatedProgressByEntityId());
    if (next) {
      this.animatedProgressByEntityId.set(next);
    }
  }

  private startProgressAnimation() {
    if (this.animationFrameId !== null) {
      return;
    }
    const tick = () => {
      const jobs = this.jobs();
      const currentMap = this.animatedProgressByJobId();
      const currentEntityMap = this.animatedProgressByEntityId();
      const nextMap: Record<string, number> = { ...currentMap };
      const nextEntityMap: Record<string, number> = { ...currentEntityMap };
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
      for (const entity of this.customEntities()) {
        if (entity.status === 'failed') {
          continue;
        }
        const target = this.getEntityProgress(entity);
        const current = nextEntityMap[entity.id] ?? target;
        const diff = target - current;
        if (Math.abs(diff) < 0.2) {
          if (nextEntityMap[entity.id] !== target) {
            nextEntityMap[entity.id] = target;
            hasChanges = true;
          }
        }
        else {
          const easedStep = diff * 0.16;
          nextEntityMap[entity.id] = current + easedStep;
          hasPendingAnimation = true;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this.animatedProgressByJobId.set(nextMap);
        this.animatedProgressByEntityId.set(nextEntityMap);
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
