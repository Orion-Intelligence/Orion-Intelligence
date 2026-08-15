import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';

import { Job } from '../models/social-scan.models';
import { SidebarShellComponent } from '../../../shared/partials/sidebar-shell/sidebar-shell.component';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home-menu',
  templateUrl: './home-menu.component.html',
  standalone: true,
  imports: [SidebarShellComponent, TooltipDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMenuComponent {
  isCollapsed = input.required<boolean>();
  searchTerm = input.required<string>();
  jobs = input.required<Job[]>();
  resultUsernames = input.required<Set<string>>();
  activeUsername = input<string | null>(null);
  toggle = output<undefined>();
  jobClicked = output<Job>();
  cancelScan = output<string>();
  retryScan = output<Job>();
  deleteRequested = output<string>();
  visibleJobsCount = signal(10);
  jobsWithFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.jobs().filter(job => !term || job.username.toLowerCase().includes(term));
  });
  displayJobs = computed(() => this.jobsWithFilter().slice(0, this.visibleJobsCount()));

  loadMoreJobs(): void {
    this.visibleJobsCount.update(c => c + 10);
  }

  hasResults(username: string): boolean {
    return this.resultUsernames().has(username);
  }

  getJobInitial(job: Job): string {
    const label = (job.displayName || job.username || '').trim();
    return (label.charAt(0) || '?').toUpperCase();
  }

  getJobTooltip(job: Job): string {
    return job.displayName && job.displayName !== job.username
      ? `${job.displayName} (${job.username})`
      : job.username;
  }

  isJobSelected(job: Job): boolean {
    return this.activeUsername()?.toLowerCase() === job.username.toLowerCase();
  }
}
