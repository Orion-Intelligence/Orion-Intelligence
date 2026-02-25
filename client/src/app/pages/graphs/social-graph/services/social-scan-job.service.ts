import { DestroyRef, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Job, ScanEvent, TabState, PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../../shared/services/social-scan.service';
import { SocialMapperStateService } from './social-mapper-state.service';
type UpdateStateFn = (updater: (state: TabState) => void, shouldScheduleSave?: boolean) => void;
@Injectable({ providedIn: 'root' })
export class SocialScanJobService {
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

  private getScanObserver(job: Job, isImageScan: boolean, updateState: UpdateStateFn, state: SocialMapperStateService, cancelScanSubjects: Map<string, Subject<void>>) {
    return {
      next: (event: ScanEvent) => {
        if (event.type === 'progress') {
          updateState(tabState => tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, ...event.payload } : j)), false);
          return;
        }
        if (event.type === 'complete') {
          updateState(tabState => {
            tabState.scanResults.update(currentMap => {
              const existing = currentMap.get(job.username);
              const mergedPlatforms = this.mergePlatformsWithExisting(existing, event.payload, job.username);
              return new Map(currentMap).set(job.username, mergedPlatforms);
            });
            tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'completed', progress: 100, step: 'Completed' } : j));
          });
          if (isImageScan) {
            state.openManageProfilesModal(job.username);
          }
        }
      },
      error: () => {
        updateState(tabState => tabState.jobs.update(jobs => jobs.map(j => j.id === job.id ? { ...j, status: 'failed', step: 'Scan failed' } : j)));
        cancelScanSubjects.delete(job.id);
      },
      complete: () => cancelScanSubjects.delete(job.id)
    };
  }

  private runScan(job: Job, scan$: ReturnType<SocialScanService['performScan']>, destroyRef: DestroyRef, updateState: UpdateStateFn, state: SocialMapperStateService, cancelScanSubjects: Map<string, Subject<void>>, isImageScan: boolean): void {
    const cancel$ = new Subject<void>();
    cancelScanSubjects.set(job.id, cancel$);
    scan$
      .pipe(takeUntil(cancel$), takeUntilDestroyed(destroyRef))
      .subscribe(this.getScanObserver(job, isImageScan, updateState, state, cancelScanSubjects));
  }

  initiateScan( username: string, opts: { jobs: () => Job[]; updateState: UpdateStateFn; state: SocialMapperStateService; scanService: SocialScanService; destroyRef: DestroyRef; cancelScanSubjects: Map<string, Subject<void>>; } ): void {
    const normalizedUsername = username.toLowerCase();
    if (opts.jobs().some(job => job.username.toLowerCase() === normalizedUsername && job.status === 'in_progress')) {
      opts.state.showNotification('scanning');
      return;
    }
    opts.updateState(state => state.jobs.update(currentJobs => currentJobs.filter(j => j.username.toLowerCase() !== normalizedUsername)), false);
    const newJob: Job = { id: self.crypto.randomUUID(), username, status: 'in_progress', progress: 5, step: 'Starting' };
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]), false);
    this.runScan(newJob, opts.scanService.performScan(newJob.username), opts.destroyRef, opts.updateState, opts.state, opts.cancelScanSubjects, false);
  }

  initiateImageScan( base64Image: string, fileName: string, opts: { updateState: UpdateStateFn; state: SocialMapperStateService; scanService: SocialScanService; destroyRef: DestroyRef; cancelScanSubjects: Map<string, Subject<void>>; } ): void {
    const displayName = `Image Scan: ${fileName}`;
    const jobName = `${displayName} #${self.crypto.randomUUID().substring(0, 4)}`;
    const newJob: Job = { id: self.crypto.randomUUID(), username: jobName, displayName, status: 'in_progress', progress: 5, step: `Scanning ${fileName}` };
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]), false);
    this.runScan(newJob, opts.scanService.performImageScan(base64Image), opts.destroyRef, opts.updateState, opts.state, opts.cancelScanSubjects, true);
  }

  cancelScan(jobId: string, updateState: UpdateStateFn, cancelScanSubjects: Map<string, Subject<void>>): void {
    cancelScanSubjects.get(jobId)?.next();
    updateState(state => state.jobs.update(currentJobs => currentJobs.filter(job => job.id !== jobId)));
  }

  resumeIncompleteScans( jobs: () => Job[], opts: { updateState: UpdateStateFn; state: SocialMapperStateService; scanService: SocialScanService; destroyRef: DestroyRef; cancelScanSubjects: Map<string, Subject<void>>; } ): void {
    jobs().filter(job => job.status === 'in_progress').forEach(job => {
      if (!opts.cancelScanSubjects.has(job.id)) {
        this.runScan(job, opts.scanService.performScan(job.username), opts.destroyRef, opts.updateState, opts.state, opts.cancelScanSubjects, false);
      }
    });
  }
}
