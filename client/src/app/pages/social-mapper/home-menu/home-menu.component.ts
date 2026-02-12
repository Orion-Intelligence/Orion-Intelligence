import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job, CustomEntity } from '../../../shared/model/social/social-scan.models';

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
  profileFetchingState = input.required<{ [platformNodeId: string]: boolean }>();
  postFetchingState = input.required<{ [platformNodeId: string]: boolean }>();
  imageFetchingState = input.required<{ [username: string]: boolean }>();

  toggle = output<void>();
  tabSelected = output<'history' | 'entities'>();
  searchChanged = output<string>();
  jobClicked = output<Job>();
  entityClicked = output<string>();
  focusUser = output<string>();
  deleteUser = output<string>();
  cancelScan = output<string>();
  manageProfiles = output<string>();
  cancelAllFetches = output<string>();

  jobsWithFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.jobs().map(job => ({
      ...job,
      matches: !term || job.username.toLowerCase().includes(term)
    }));
  });

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

  trackByJobId(index: number, job: Job): string {
    return job.id;
  }

  isUserBusy(username: string): boolean {
    const profileState = this.profileFetchingState();
    const postState = this.postFetchingState();
    const imageState = this.imageFetchingState();

    if (imageState[username]) {
        return true;
    }

    const userPrefix = `${username}-`;
    const isFetchingProfile = Object.keys(profileState).some(key => key.startsWith(userPrefix) && profileState[key]);
    if (isFetchingProfile) {
        return true;
    }
    
    const isFetchingPosts = Object.keys(postState).some(key => key.startsWith(userPrefix) && postState[key]);
    if (isFetchingPosts) {
        return true;
    }
    
    return false;
  }
}