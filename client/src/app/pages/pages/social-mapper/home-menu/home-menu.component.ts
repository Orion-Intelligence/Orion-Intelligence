import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job, CustomEntity } from '../../../shared/model/social/social-scan.models';
import { FetchingStateService } from '../fetching-state.service';
import { SocialMapperStateService } from '../social-mapper-state.service';

@Component({
  selector: 'app-home-menu',
  templateUrl: './home-menu.component.html',
  styleUrls: ['./home-menu.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMenuComponent {
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
  private fetchingState = inject(FetchingStateService);
  visibleJobsCount = signal(10);
  visibleEntitiesCount = signal(10);

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
    if (!term) return this.customEntities();
    return this.customEntities().filter(entity => 
      entity.label.toLowerCase().includes(term) ||
      entity.type.toLowerCase().includes(term)
    );
  });

  displayEntities = computed(() => this.filteredEntities().slice(0, this.visibleEntitiesCount()));

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
    if (job.status === 'in_progress') return `${baseClasses} border-indigo-500/50`;
    if (job.status === 'failed') return `${baseClasses} border-red-500/50`;
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
  isUserBusy(username: string): boolean {
    return this.fetchingState.isUserBusy(username);
  }
}