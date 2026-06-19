import { Injectable, signal } from '@angular/core';
import { Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ScanJob, ScanJobApiItem, ScanJobCountResponse, ScanJobCreateResponse, ScanJobIncompleteResponse, ScanJobListResponse, ScanJobNotificationResponse, ScanJobPollResponse, ScanJobSeenResponse, ScanJobStartRequest, ScanJobStatus } from '../model/scan-jobs/scan-job.model';

@Injectable({ providedIn: 'root' })
export class ScanNotificationService {
  private readonly defaultPollDelayMs = 4000;
  private readonly pageSize = 8;
  private readonly pollers = new Map<string, Subscription>();
  private readonly jobUpdates$ = new Subject<ScanJob>();
  private readonly queuedPollIds = new Set<string>();
  private readonly pollDelayByJob = new Map<string, number>();
  private readonly jobCache = new Map<string, ScanJob>();
  private bootstrapped = false;
  private currentPage = 0;
  private activePollerId: string | null = null;
  private loadingNextActive = false;
  private panelOpen = false;

  readonly jobs = signal<ScanJob[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(false);
  readonly totalScanCount = signal(0);

  constructor(private api: ApiService) {}

  startPendingScans(): void {
    if (this.bootstrapped) {
      return;
    }
    this.bootstrapped = true;
    this.refreshCounts();
    this.resumeNextIncompleteJob();
  }

  openPanel(): void {
    this.panelOpen = true;
    this.refreshJobs(true);
    this.resumeNextIncompleteJob();
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  resumeNextIncompleteJob(): void {
    if (this.activePollerId || this.queuedPollIds.size > 0 || this.loadingNextActive) {
      return;
    }
    this.loadingNextActive = true;
    this.api.get<ScanJobListResponse<ScanJobIncompleteResponse>>('scan-jobs/incomplete?limit=1').subscribe({
      next: response => {
        const job = (response?.items || [])[0];
        if (job) {
          const normalizedJob = this.normalizeJobView(job);
          this.cacheJob(normalizedJob);
          this.ensurePolling(normalizedJob);
        }
        this.loadingNextActive = false;
      },
      error: () => {
        this.loadingNextActive = false;
      },
    });
  }

  refreshCounts(): void {
    this.api.get<ScanJobCountResponse>('scan-jobs/count').subscribe({
      next: response => {
        this.totalScanCount.set(Number(response?.total || 0));
      },
      error: () => void 0,
    });
  }

  refreshJobs(reset = true): void {
    if (!this.panelOpen && reset) {
      return;
    }
    if (this.isLoading()) {
      return;
    }
    const nextPage = reset ? 1 : this.currentPage + 1;
    this.isLoading.set(true);
    this.api.get<ScanJobListResponse<ScanJobNotificationResponse>>(`scan-jobs/notifications?page=${nextPage}&limit=${this.pageSize}`).subscribe({
      next: response => {
        const items = response?.items || [];
        this.currentPage = response?.page || nextPage;
        this.hasMore.set(!!response?.has_more);
        if (reset) {
          const normalizedItems = items.map(job => this.normalizeJobView(job));
          normalizedItems.forEach(job => this.cacheJob(job, false));
          this.jobs.set(normalizedItems);
        }
        else {
          items.forEach(job => this.upsertVisibleJob(this.normalizeJobView(job)));
        }
        items.map(job => this.normalizeJobView(job)).filter(job => this.isIncomplete(job)).forEach(job => this.ensurePolling(job));
        this.refreshCounts();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  loadMore(): void {
    if (!this.hasMore()) {
      return;
    }
    this.refreshJobs(false);
  }

  stopAll(): void {
    this.pollers.forEach(sub => sub.unsubscribe());
    this.pollers.clear();
    this.queuedPollIds.clear();
    this.pollDelayByJob.clear();
    this.bootstrapped = false;
    this.currentPage = 0;
    this.activePollerId = null;
    this.loadingNextActive = false;
    this.panelOpen = false;
    this.jobCache.clear();
    this.totalScanCount.set(0);
    this.hasMore.set(false);
    this.jobs.set([]);
  }

  createJob(request: ScanJobStartRequest): Observable<ScanJob> {
    return this.api.post<ScanJobCreateResponse>('scan-jobs/create', {
      api_reference: request.apiReference,
      payload: request.payload,
      metadata: request.metadata || {},
    }).pipe(map(job => this.normalizeJobView(job)), tap(job => {
      this.cacheJob(job);
      this.totalScanCount.update(value => value + 1);
      this.ensurePolling(job, request.pollDelayMs);
    }));
  }

  runScanAsResponse<T>(request: ScanJobStartRequest): Observable<T> {
    return this.createJob(request).pipe(switchMap(job =>
      this.watchJob(job.id).pipe(map(updated => this.toScanResponse<T>(updated)),
        takeWhile(response => this.isPendingResponse(response), true),)));
  }

  markSeen(job: ScanJob): void {
    this.api.post<ScanJobSeenResponse>(`scan-jobs/${job.id}/seen`, {}).subscribe({
      next: () => {
        this.upsertVisibleJob({ ...job, seen: true });
        this.refreshCounts();
      },
      error: () => void 0,
    });
  }

  private watchJob(scanId: string): Observable<ScanJob> {
    return new Observable<ScanJob>(observer => {
      const current = this.jobCache.get(scanId) || this.jobs().find(job => job.id === scanId);
      if (current) {
        observer.next(current);
      }
      const sub = this.jobUpdates$
        .pipe(filter(job => job.id === scanId))
        .subscribe(job => observer.next(job));
      return () => sub.unsubscribe();
    });
  }

  private ensurePolling(job: ScanJob, pollDelayMs = this.defaultPollDelayMs): void {
    if (!job?.id || this.pollers.has(job.id) || this.activePollerId === job.id || !this.isIncomplete(job)) {
      return;
    }
    this.pollDelayByJob.set(job.id, pollDelayMs);
    this.queuedPollIds.add(job.id);
    this.runNextQueuedJob();
  }

  private runNextQueuedJob(): void {
    if (this.activePollerId) {
      return;
    }
    const nextId = this.queuedPollIds.values().next().value as string | undefined;
    if (!nextId) {
      this.resumeNextIncompleteJob();
      return;
    }
    const job = this.jobCache.get(nextId) || this.jobs().find(item => item.id === nextId);
    this.queuedPollIds.delete(nextId);
    if (!job || !this.isIncomplete(job)) {
      this.runNextQueuedJob();
      return;
    }
    this.startPolling(job, this.pollDelayByJob.get(job.id) || this.defaultPollDelayMs);
  }

  private startPolling(job: ScanJob, pollDelayMs: number): void {
    if (this.activePollerId || this.pollers.has(job.id)) {
      this.ensurePolling(job, pollDelayMs);
      return;
    }
    this.activePollerId = job.id;
    const sub = timer(0, pollDelayMs).pipe(switchMap(() => this.api.post<ScanJobPollResponse>(`scan-jobs/${job.id}/poll`, {}).pipe(map(response => this.mergePollResponse(job, response)),
      catchError(error => of(this.mergePollResponse(job, {
        response: {
          status: 'error',
          detail: error?.error?.detail || error?.message || 'Scan polling failed',
          step: 'failed',
        },
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }))),)),
    tap(updated => this.cacheJob(updated)),
    takeWhile(updated => this.isIncomplete(updated), true),
    finalize(() => {
      this.pollers.delete(job.id);
      this.pollDelayByJob.delete(job.id);
      if (this.activePollerId === job.id) {
        this.activePollerId = null;
      }
      this.refreshCounts();
      this.runNextQueuedJob();
    }),).subscribe();
    this.pollers.set(job.id, sub);
  }

  private mergePollResponse(job: ScanJob, poll: ScanJobPollResponse): ScanJob {
    const current = this.jobCache.get(job.id) || this.jobs().find(item => item.id === job.id) || job;
    const response = poll?.response ?? current.response ?? {};

    return {
      ...current,
      response,
      seen: poll?.seen ?? current.seen,
      updated_at: poll?.updated_at ?? current.updated_at,
      completed_at: poll?.completed_at ?? current.completed_at,
    };
  }

  private normalizeJobView(job: ScanJobApiItem): ScanJob {
    const id = job.id || job.scan_id || '';
    const response = job.response ?? (job.status ? { status: job.status } : {});

    return {
      id,
      title: job.title,
      target: job.target,
      payload: job.payload ?? {},
      response,
      seen: job.seen ?? false,
      created_at: job.created_at,
      updated_at: job.updated_at,
      completed_at: job.completed_at,
    };
  }

  getStatus(job: ScanJob): ScanJobStatus {
    return this.statusFromResponse(job.response ?? {});
  }

  getProgress(job: ScanJob): number {
    return this.progressFromResponse(job.response ?? {}, this.getStatus(job), 5);
  }

  getStep(job: ScanJob): string {
    return this.stepFromResponse(job.response ?? {}, this.getStatus(job));
  }

  getResult(job: ScanJob): any {
    const response = job.response ?? {};
    return response && Object.keys(response).length > 0 ? (response.result ?? response) : undefined;
  }

  getError(job: ScanJob): string {
    const response = job.response ?? {};
    return this.getStatus(job) === 'error'
      ? String(response?.message || response?.detail || 'Scan failed')
      : '';
  }

  private statusFromResponse(response: any): ScanJobStatus {
    const raw = String(response?.result?.status || response?.status || '').toLowerCase();
    const progress = Number(response?.result?.progress ?? response?.progress);
    const step = String(response?.result?.step || response?.step || '').toLowerCase();
    if (raw === 'error' || raw === 'failed' || raw === 'failure') {
      return 'error';
    }
    if (raw === 'done' || raw === 'success' || raw === 'completed' || raw === 'complete') {
      return 'done';
    }
    if (raw === 'queued') {
      return 'queued';
    }
    if (raw === 'pending' || raw === 'busy' || raw === 'running' || raw === 'started') {
      if (progress >= 100 && (step.includes('done') || step.includes('complete') || step.includes('success'))) {
        return 'done';
      }
      return 'running';
    }
    if (response?.error || response?.detail) {
      return 'error';
    }
    return response && Object.keys(response).length > 0 ? 'done' : 'queued';
  }

  private progressFromResponse(response: any, status: ScanJobStatus, fallback = 5): number {
    if (status === 'done') {
      return 100;
    }
    const raw = response?.result?.progress ?? response?.progress;
    const value = Number(raw);
    if (Number.isFinite(value)) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    return Math.max(0, Math.min(100, fallback || 5));
  }

  private stepFromResponse(response: any, status: ScanJobStatus): string {
    return String(response?.result?.step || response?.step || status);
  }

  private cacheJob(job: ScanJob, emit = true): void {
    this.jobCache.set(job.id, job);
    this.updateVisibleJobIfPresent(job);
    if (emit) {
      this.jobUpdates$.next(job);
    }
  }

  private upsertVisibleJob(job: ScanJob): void {
    this.jobCache.set(job.id, job);
    const current = this.jobs();
    const index = current.findIndex(item => item.id === job.id);
    const next = index >= 0
      ? current.map(item => item.id === job.id ? job : item)
      : [job, ...current];
    next.sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());
    this.jobs.set(next);
    this.jobUpdates$.next(job);
  }

  private updateVisibleJobIfPresent(job: ScanJob): void {
    const current = this.jobs();
    const index = current.findIndex(item => item.id === job.id);
    if (index < 0) {
      return;
    }
    this.jobs.set(current.map(item => item.id === job.id ? job : item));
  }

  private isIncomplete(job: ScanJob): boolean {
    return !this.isTerminal(job);
  }

  private isTerminal(job: ScanJob): boolean {
    return ['done', 'error', 'cancelled', 'expired'].includes(this.getStatus(job));
  }

  private toScanResponse<T>(job: ScanJob): T {
    const status = this.getStatus(job);
    if (job.response && Object.keys(job.response).length > 0 && status !== 'queued') {
      return job.response as T;
    }
    return {
      status: status === 'queued' || status === 'running' ? 'pending' : status,
      progress: this.getProgress(job),
      step: this.getStep(job),
      result: this.getResult(job),
      error: this.getError(job),
    } as T;
  }

  private isPendingResponse(response: any): boolean {
    const status = String(response?.result?.status || response?.status || '').toLowerCase();
    const progress = Number(response?.result?.progress ?? response?.progress);
    const step = String(response?.result?.step || response?.step || '').toLowerCase();
    if (progress >= 100 && (step.includes('done') || step.includes('complete') || step.includes('success'))) {
      return false;
    }
    return status === 'pending' || status === 'busy' || status === 'queued' || status === 'running';
  }
}
