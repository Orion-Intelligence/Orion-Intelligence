import { DestroyRef, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Job, ScanEvent, TabState, PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../../shared/services/social-scan.service';
import { SocialMapperStateService } from './social-mapper-state.service';

type UpdateStateFn = (updater: (state: TabState) => void, shouldScheduleSave?: boolean) => void;

type ScanJobOptions = {
  jobs: () => Job[];
  updateState: UpdateStateFn;
  state: SocialMapperStateService;
  scanService: SocialScanService;
  destroyRef: DestroyRef;
  cancelScanSubjects: Map<string, Subject<void>>;
};

@Injectable({ providedIn: 'root' })
export class SocialScanJobService {
  private hasRunningJob(jobs: Job[]): boolean {
    return jobs.some(job => job.status === 'in_progress');
  }

  private getQueuedJob(jobs: Job[]): Job | undefined {
    return jobs.find(job => job.status === 'queued');
  }

  private getPlatformIdentityKey(platform: PlatformResult): string {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}`;
  }

  private mergePlatformsWithExisting(existing: PlatformResult[] | undefined, incoming: PlatformResult[], username: string): PlatformResult[] {
    const existingMap = new Map<string, PlatformResult>();
    (existing || []).forEach(platform => {
      existingMap.set(this.getPlatformIdentityKey(platform), platform);
    });
    return incoming.map(platform => {
      const next = { ...platform, keyUsername: username };
      const key = this.getPlatformIdentityKey(next);
      const previous = existingMap.get(key);
      if (!previous) {
        return next;
      }
      return {
        ...previous,
        ...next,
        keyUsername: username,
        isSelected: previous.isSelected ?? next.isSelected,
        posts: previous.posts ?? next.posts,
        post_connections: previous.post_connections ?? next.post_connections,
        images: previous.images ?? next.images,
        followers_list: previous.followers_list ?? next.followers_list,
        following_list: previous.following_list ?? next.following_list,
        profileDetails: previous.profileDetails ?? next.profileDetails,
        allMetadata: next.allMetadata ?? previous.allMetadata,
      };
    });
  }

  private startNextQueuedScan(opts: ScanJobOptions): void {
    if (this.hasRunningJob(opts.jobs())) {
      return;
    }
    const nextJob = this.getQueuedJob(opts.jobs());
    if (!nextJob) {
      return;
    }
    opts.updateState(tabState => tabState.jobs.update(jobs => jobs.map(job => (
      job.id === nextJob.id
        ? { ...job, status: 'in_progress', progress: Math.max(job.progress, 5), step: 'Starting' }
        : job
    ))));
    this.runScan(nextJob, opts.scanService.performScan(nextJob.username), opts, false);
  }

  private getScanObserver(job: Job, isImageScan: boolean, opts: ScanJobOptions) {
    return {
      next: (event: ScanEvent) => {
        if (event.type === 'progress') {
          opts.updateState(tabState => tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, ...event.payload } : j)), false);
          return;
        }
        if (event.type === 'complete') {
          opts.updateState(tabState => {
            tabState.scanResults.update(currentMap => {
              const existing = currentMap.get(job.username);
              const mergedPlatforms = this.mergePlatformsWithExisting(existing, event.payload, job.username);
              return new Map(currentMap).set(job.username, mergedPlatforms);
            });
            tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'completed', progress: 100, step: 'Completed' } : j));
          });
          if (isImageScan) {
            opts.state.openManageProfilesModal(job.username);
          }
          this.startNextQueuedScan(opts);
        }
      },
      error: () => {
        opts.updateState(tabState => tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'failed', step: 'Scan failed' } : j)));
        opts.cancelScanSubjects.delete(job.id);
        this.startNextQueuedScan(opts);
      },
      complete: () => opts.cancelScanSubjects.delete(job.id)
    };
  }

  private runScan(job: Job, scan$: ReturnType<SocialScanService['performScan']>, opts: ScanJobOptions, isImageScan: boolean): void {
    const cancel$ = new Subject<void>();
    opts.cancelScanSubjects.set(job.id, cancel$);
    scan$
      .pipe(takeUntil(cancel$), takeUntilDestroyed(opts.destroyRef))
      .subscribe(this.getScanObserver(job, isImageScan, opts));
  }

  initiateScan(username: string, opts: ScanJobOptions): void {
    const normalizedUsername = username.toLowerCase();
    if (opts.jobs().some(job => job.username.toLowerCase() === normalizedUsername && (job.status === 'in_progress' || job.status === 'queued'))) {
      opts.state.showNotification('scanning');
      return;
    }
    const shouldQueue = this.hasRunningJob(opts.jobs());
    const newJob: Job = {
      id: self.crypto.randomUUID(),
      username,
      status: shouldQueue ? 'queued' : 'in_progress',
      progress: shouldQueue ? 0 : 5,
      step: shouldQueue ? 'Queued' : 'Starting'
    };
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs.filter(job => job.username.toLowerCase() !== normalizedUsername)]));
    if (!shouldQueue) {
      this.runScan(newJob, opts.scanService.performScan(newJob.username), opts, false);
    }
  }

  initiateImageScan(base64Image: string, fileName: string, opts: ScanJobOptions): void {
    const displayName = `Image Scan: ${fileName}`;
    const jobName = `${displayName} #${self.crypto.randomUUID().substring(0, 4)}`;
    const newJob: Job = { id: self.crypto.randomUUID(), username: jobName, displayName, status: 'in_progress', progress: 5, step: `Scanning ${fileName}` };
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]));
    this.runScan(newJob, opts.scanService.performImageScan(base64Image), opts, true);
  }

  cancelScan(jobId: string, opts: ScanJobOptions): void {
    const cancelledJob = opts.jobs().find(job => job.id === jobId);
    opts.cancelScanSubjects.get(jobId)?.next();
    opts.cancelScanSubjects.delete(jobId);
    opts.updateState(state => state.jobs.update(currentJobs => currentJobs.filter(job => job.id !== jobId)));
    if (cancelledJob?.status === 'in_progress') {
      this.startNextQueuedScan(opts);
    }
  }

  resumeIncompleteScans(jobs: () => Job[], opts: Omit<ScanJobOptions, 'jobs'>): void {
    const inProgressJobs = jobs().filter(job => job.status === 'in_progress');
    if (inProgressJobs.length > 1) {
      const [activeJob, ...queuedJobs] = inProgressJobs;
      opts.updateState(tabState => tabState.jobs.update(currentJobs => currentJobs.map(job => {
        if (job.id === activeJob.id) {
          return job;
        }
        if (queuedJobs.some(queuedJob => queuedJob.id === job.id)) {
          return { ...job, status: 'queued', progress: 0, step: 'Queued' };
        }
        return job;
      })));
    }
    const nextOpts = { jobs, ...opts };
    const activeJob = jobs().find(job => job.status === 'in_progress');
    if (activeJob && !opts.cancelScanSubjects.has(activeJob.id)) {
      this.runScan(activeJob, opts.scanService.performScan(activeJob.username), nextOpts, false);
      return;
    }
    this.startNextQueuedScan(nextOpts);
  }
}
