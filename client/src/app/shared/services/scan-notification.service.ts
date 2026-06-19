import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ScanJob, ScanJobApiItem, ScanJobCountResponse, ScanJobCreateApiResponse, ScanJobCreateResponse, ScanJobDeleteResponse, ScanJobDuplicateChoiceResponse, ScanJobIncompleteResponse, ScanJobListResponse, ScanJobNotificationResponse, ScanJobPollResponse, ScanJobSeenResponse, ScanJobStartRequest, ScanJobStatus } from '../model/scan-jobs/scan-job.model';

type DuplicateScanChoice = 'previous' | 'new' | 'cancel';

interface DuplicateScanPrompt {
  message: string;
  previousScan: ScanJob;
}

@Injectable({ providedIn: 'root' })
export class ScanNotificationService {
  private readonly defaultPollDelayMs = 4000;
  private readonly pageSize = 8;
  private readonly pollers = new Map<string, Subscription>();
  private readonly jobUpdates$ = new Subject<ScanJob>();
  private readonly queuedPollIds = new Set<string>();
  private readonly pollDelayByJob = new Map<string, number>();
  private readonly jobCache = new Map<string, ScanJob>();
  private isPendingScanning = false;
  private currentPage = 0;
  private activePollerId: string | null = null;
  private loadingNextActive = false;
  private panelOpen = false;

  readonly jobs = signal<ScanJob[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(false);
  readonly totalScanCount = signal(0);
  readonly duplicateScanPrompt = signal<DuplicateScanPrompt | null>(null);
  private duplicateScanChoice$?: Subject<DuplicateScanChoice>;

  constructor(private api: ApiService) {}

  startPendingScans(): void {
    if (this.isPendingScanning) {
      return;
    }
    this.isPendingScanning = true;
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
    this.api.get<ScanJobListResponse<ScanJobIncompleteResponse>>('scan-jobs/incomplete?limit=4').subscribe({
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
    this.isPendingScanning = false;
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
    return this.createJobRequest(request).pipe(switchMap(response => this.resolveCreateResponse(response, request)), map(job => this.normalizeJobView(job)), tap(job => {
      const alreadyCached = this.jobCache.has(job.id);
      this.cacheJob(job);
      if (!alreadyCached) {
        this.upsertVisibleJob(job);
      }
      this.refreshCounts();
      this.ensurePolling(job, request.pollDelayMs);
    }));
  }

  private createJobRequest(request: ScanJobStartRequest): Observable<ScanJobCreateApiResponse> {
    return this.api.post<ScanJobCreateApiResponse>('scan-jobs/create', {
      api_reference: request.apiReference,
      payload: request.payload,
      metadata: request.metadata || {},
      force_new: !!request.forceNew,
    });
  }

  private resolveCreateResponse(response: ScanJobCreateApiResponse, request: ScanJobStartRequest): Observable<ScanJobCreateResponse> {
    if (!this.isDuplicateChoiceResponse(response)) {
      return of(response);
    }
    return this.askDuplicateScanChoice(response).pipe(switchMap(choice => {
      if (choice === 'previous') {
        return of(response.previous_scan);
      }
      if (choice === 'new') {
        return this.createJobRequest({ ...request, forceNew: true }).pipe(switchMap(nextResponse => this.resolveCreateResponse(nextResponse, { ...request, forceNew: true })));
      }
      return EMPTY;
    }));
  }

  private isDuplicateChoiceResponse(response: ScanJobCreateApiResponse): response is ScanJobDuplicateChoiceResponse {
    return !!(response as ScanJobDuplicateChoiceResponse)?.requires_confirmation;
  }

  private askDuplicateScanChoice(response: ScanJobDuplicateChoiceResponse): Observable<DuplicateScanChoice> {
    this.duplicateScanChoice$?.complete();
    this.duplicateScanChoice$ = new Subject<DuplicateScanChoice>();
    this.duplicateScanPrompt.set({
      message: response.message,
      previousScan: this.normalizeJobView(response.previous_scan),
    });
    return this.duplicateScanChoice$.asObservable();
  }

  resolveDuplicateScanChoice(choice: DuplicateScanChoice): void {
    this.duplicateScanPrompt.set(null);
    this.duplicateScanChoice$?.next(choice);
    this.duplicateScanChoice$?.complete();
    this.duplicateScanChoice$ = undefined;
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

  deleteScan(job: ScanJob): Observable<ScanJobDeleteResponse> {
    return this.api.delete<ScanJobDeleteResponse>(`scan-jobs/delete/${job.id}`).pipe(tap(() => {
      this.removeJob(job.id);
      this.refreshCounts();
      this.resumeNextIncompleteJob();
    }));
  }

  clearCompletedScans(): Observable<ScanJobDeleteResponse> {
    return this.api.delete<ScanJobDeleteResponse>('scan-jobs/clear-all').pipe(tap(() => {
      const runningJobs = this.jobs().filter(job => this.isIncomplete(job));
      this.jobCache.clear();
      runningJobs.forEach(job => this.jobCache.set(job.id, job));
      this.jobs.set(runningJobs);
      this.refreshCounts();
      this.resumeNextIncompleteJob();
    }));
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

  private removeJob(scanId: string): void {
    this.pollers.get(scanId)?.unsubscribe();
    this.pollers.delete(scanId);
    this.queuedPollIds.delete(scanId);
    this.pollDelayByJob.delete(scanId);
    if (this.activePollerId === scanId) {
      this.activePollerId = null;
    }
    this.jobCache.delete(scanId);
    this.jobs.set(this.jobs().filter(job => job.id !== scanId));
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
