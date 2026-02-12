import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job, CustomEntity } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-sidebar-left',
  templateUrl: './sidebar-left.component.html',
  styleUrls: ['./sidebar-left.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLeftComponent {
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
  focusUser = output<string>();
  deleteUser = output<string>();

  filteredJobs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.jobs();
    return this.jobs().filter(job => job.username.toLowerCase().includes(term));
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
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-colors';
    if (job.status === 'completed') {
      const isActive = this.activeUsernames().has(job.username);
       return `${baseClasses} border-slate-700 ${!isActive ? 'cursor-pointer hover:border-indigo-500' : ''}`;
    }
    if (job.status === 'in_progress') return `${baseClasses} border-indigo-500/50`;
    if (job.status === 'failed') return `${baseClasses} border-red-500/50`;
    return baseClasses;
  }
  
  getEntityClasses(entity: CustomEntity): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-colors';
    const canInteract = !entity.onGraph && entity.status === 'added';
    return `${baseClasses} border-slate-700 ${canInteract ? 'cursor-pointer hover:border-green-500' : ''}`;
  }

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
    }
  }
}
