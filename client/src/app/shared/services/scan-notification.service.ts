import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DuplicateScanChoice, DuplicateScanPrompt, ScanJob, ScanJobCreateApiResponse, ScanJobDetailResponse, ScanJobDuplicateChoiceResponse, ScanJobIncompleteResponse, ScanJobListResponse, ScanJobNotificationResponse, ScanJobPollResponse, ScanJobStartRequest, ScanJobStatus } from '../model/scan-jobs/scan-job.model';

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
  private duplicateScanChoice$?: Subject<DuplicateScanChoice>;

  readonly jobs = signal<ScanJob[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(false);
  readonly totalScanCount = signal(0);
  readonly duplicateScanPrompt = signal<DuplicateScanPrompt | null>(null);

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
        if (job?.scan_id) {
          const queuedJob = this.createQueuedJob(job);
          this.cacheJob(queuedJob);
          this.ensurePolling(queuedJob);
        }
        this.loadingNextActive = false;
      },
      error: () => {
        this.loadingNextActive = false;
      },
    });
  }

  refreshCounts(): void {
    this.api.get<any>('scan-jobs/count').subscribe({
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
        const items = (response?.items || []) as ScanJob[];
        this.currentPage = response?.page || nextPage;
        this.hasMore.set(!!response?.has_more);
        if (reset) {
          items.forEach(job => this.cacheJob(job, false));
          this.jobs.set(items);
        }
        else {
          items.forEach(job => this.upsertVisibleJob(job));
        }
        items.filter(job => this.isIncomplete(job)).forEach(job => this.ensurePolling(job));
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
    return this.createJobRequest(request).pipe(switchMap(response => this.resolveCreateResponse(response, request)), tap(job => {
      const alreadyCached = this.jobCache.has(job.scan_id);
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

  private resolveCreateResponse(response: ScanJobCreateApiResponse, request: ScanJobStartRequest): Observable<ScanJob> {
    if (!this.isDuplicateChoiceResponse(response)) {
      return of(response);
    }
    return this.askDuplicateScanChoice(response).pipe(switchMap(choice => {
      if (choice === 'previous') {
        return this.getScanDetail(response.previous_scan.scan_id);
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
      previousScan: response.previous_scan,
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
    return this.createJob(request).pipe(switchMap(job => this.watchJob(job.scan_id).pipe(map(updated => this.toScanResponse<T>(updated)), takeWhile(response => this.isPendingResponse(response), true))));
  }

  runApiScanAsResponse<T>(request: ScanJobStartRequest): Observable<T> {
    return this.createApiScanRequest<T>(request).pipe(switchMap(response => this.resolveApiScanResponse<T>(response, request)));
  }

  private createApiScanRequest<T>(request: ScanJobStartRequest): Observable<T | ScanJobDuplicateChoiceResponse> {
    const endpoint = request.forceNew ? this.withForceNew(request.apiReference) : request.apiReference;
    return this.api.post<T | ScanJobDuplicateChoiceResponse>(endpoint, request.payload);
  }

  private resolveApiScanResponse<T>(response: T | ScanJobDuplicateChoiceResponse, request: ScanJobStartRequest): Observable<T> {
    if (this.isDuplicateChoiceResponse(response as ScanJobCreateApiResponse)) {
      return this.askDuplicateScanChoice(response as ScanJobDuplicateChoiceResponse).pipe(switchMap(choice => {
        if (choice === 'previous') {
          return this.getScanDetail((response as ScanJobDuplicateChoiceResponse).previous_scan.scan_id).pipe(switchMap(job => this.watchTrackedJob<T>(job, request.pollDelayMs)));
        }
        if (choice === 'new') {
          return this.createApiScanRequest<T>({ ...request, forceNew: true }).pipe(switchMap(nextResponse => this.resolveApiScanResponse<T>(nextResponse, { ...request, forceNew: true })));
        }
        return EMPTY;
      }));
    }

    const job = this.trackApiScanResponse(response, request);
    if (!job) {
      return of(response as T);
    }
    return this.watchTrackedJob<T>(job, request.pollDelayMs);
  }

  private watchTrackedJob<T>(job: ScanJob, pollDelayMs = this.defaultPollDelayMs): Observable<T> {
    this.ensurePolling(job, pollDelayMs);
    return this.watchJob(job.scan_id).pipe(map(updated => this.toScanResponse<T>(updated)), takeWhile(response => this.isPendingResponse(response), true), tap(response => {
      const scanId = (response as any)?.scan_id;
      if (scanId) {
        this.refreshCounts();
      }
    }));
  }

  private trackApiScanResponse<T>(response: T | any, request: ScanJobStartRequest): ScanJob | null {
    const scanId = response?.scan_id;
    if (!scanId) {
      return null;
    }
    const job: ScanJob = {
      scan_id: String(scanId),
      title: response?.scan_title || request.metadata?.title || 'Scan',
      target: response?.scan_target || request.metadata?.target || '',
      api_reference: request.apiReference,
      payload: request.payload,
      response,
      status: response?.scan_status || this.statusFromResponse(response),
      seen: response?.scan_seen ?? false,
      created_at: response?.scan_created_at,
      updated_at: response?.scan_updated_at,
      completed_at: response?.scan_completed_at,
    };
    const alreadyCached = this.jobCache.has(job.scan_id);
    this.cacheJob(job);
    if (!alreadyCached) {
      this.upsertVisibleJob(job);
    }
    this.refreshCounts();
    this.ensurePolling(job, request.pollDelayMs);
    return job;
  }

  private withForceNew(endpoint: string): string {
    return `${endpoint}${endpoint.includes('?') ? '&' : '?'}force_new=true`;
  }

  markSeen(job: ScanJob): void {
    this.api.post<any>('scan-jobs/seen', { scan_id: job.scan_id }).subscribe({
      next: () => {
        this.upsertVisibleJob({ ...job, seen: true });
        this.refreshCounts();
      },
      error: () => void 0,
    });
  }

  markCompletedScansSeen(): Observable<any> {
    return this.api.post<any>('scan-jobs/seen', { seen_all: true }).pipe(tap(() => {
      const nextJobs = this.jobs().map(job => this.isTerminal(job) ? { ...job, seen: true } : job);
      this.jobs.set(this.sortJobs(nextJobs));
      nextJobs.forEach(job => this.jobCache.set(job.scan_id, job));
      this.refreshCounts();
    }));
  }

  getScanDetail(scanId: string): Observable<ScanJobDetailResponse> {
    return this.api.get<ScanJobDetailResponse>(`scan-jobs/${scanId}`).pipe(tap(job => this.cacheJob(job, false)));
  }

  deleteScan(job: ScanJob): Observable<any> {
    return this.api.delete<any>(`scan-jobs/delete/${job.scan_id}`).pipe(tap(() => {
      this.removeJob(job.scan_id);
      this.refreshCounts();
      this.resumeNextIncompleteJob();
    }));
  }

  deleteAllScans(): Observable<any> {
    return this.api.delete<any>('scan-jobs/clear-all').pipe(tap(() => {
      const runningJobs = this.jobs().filter(job => this.isIncomplete(job));
      this.jobCache.clear();
      runningJobs.forEach(job => this.jobCache.set(job.scan_id, job));
      this.jobs.set(this.sortJobs(runningJobs));
      this.refreshCounts();
      this.resumeNextIncompleteJob();
    }));
  }

  private watchJob(scanId: string): Observable<ScanJob> {
    return new Observable<ScanJob>(observer => {
      const current = this.jobCache.get(scanId) || this.jobs().find(job => job.scan_id === scanId);
      if (current) {
        observer.next(current);
      }
      const sub = this.jobUpdates$
        .pipe(filter(job => job.scan_id === scanId))
        .subscribe(job => observer.next(job));
      return () => sub.unsubscribe();
    });
  }

  private ensurePolling(job: ScanJob, pollDelayMs = this.defaultPollDelayMs): void {
    if (!job?.scan_id || this.pollers.has(job.scan_id) || this.activePollerId === job.scan_id || !this.isIncomplete(job)) {
      return;
    }
    this.pollDelayByJob.set(job.scan_id, pollDelayMs);
    this.queuedPollIds.add(job.scan_id);
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
    const job = this.jobCache.get(nextId) || this.jobs().find(item => item.scan_id === nextId);
    this.queuedPollIds.delete(nextId);
    if (!job || !this.isIncomplete(job)) {
      this.runNextQueuedJob();
      return;
    }
    this.startPolling(job, this.pollDelayByJob.get(job.scan_id) || this.defaultPollDelayMs);
  }

  private startPolling(job: ScanJob, pollDelayMs: number): void {
    if (this.activePollerId || this.pollers.has(job.scan_id)) {
      this.ensurePolling(job, pollDelayMs);
      return;
    }
    this.activePollerId = job.scan_id;
    const sub = timer(0, pollDelayMs).pipe(switchMap(() => this.api.post<ScanJobPollResponse>(`scan-jobs/${job.scan_id}/poll`, {}).pipe(map(response => this.mergePollResponse(job, response)),
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
      this.pollers.delete(job.scan_id);
      this.pollDelayByJob.delete(job.scan_id);
      if (this.activePollerId === job.scan_id) {
        this.activePollerId = null;
      }
      this.refreshCounts();
      this.runNextQueuedJob();
    }),).subscribe();
    this.pollers.set(job.scan_id, sub);
  }

  private mergePollResponse(job: ScanJob, poll: ScanJobPollResponse): ScanJob {
    const current = this.jobCache.get(job.scan_id) || this.jobs().find(item => item.scan_id === job.scan_id) || job;
    const response = poll?.response ?? current.response ?? {};

    return {
      ...current,
      response,
      status: this.statusFromResponse(response),
      seen: poll?.seen ?? current.seen,
      updated_at: poll?.updated_at ?? current.updated_at,
      completed_at: poll?.completed_at ?? current.completed_at,
    };
  }

  getStatus(job: ScanJob): ScanJobStatus {
    const response = job.response ?? {};
    return response && Object.keys(response).length > 0 ? this.statusFromResponse(response) : (job.status || 'queued');
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
    this.jobCache.set(job.scan_id, job);
    this.updateVisibleJobIfPresent(job);
    if (emit) {
      this.jobUpdates$.next(job);
    }
  }

  private upsertVisibleJob(job: ScanJob): void {
    this.jobCache.set(job.scan_id, job);
    const current = this.jobs();
    const index = current.findIndex(item => item.scan_id === job.scan_id);
    const next = index >= 0
      ? current.map(item => item.scan_id === job.scan_id ? job : item)
      : [job, ...current];
    this.jobs.set(this.sortJobs(next));
    this.jobUpdates$.next(job);
  }

  private updateVisibleJobIfPresent(job: ScanJob): void {
    const current = this.jobs();
    const index = current.findIndex(item => item.scan_id === job.scan_id);
    if (index < 0) {
      return;
    }
    this.jobs.set(this.sortJobs(current.map(item => item.scan_id === job.scan_id ? job : item)));
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
    this.jobs.set(this.jobs().filter(job => job.scan_id !== scanId));
  }

  private isIncomplete(job: ScanJob): boolean {
    return !this.isTerminal(job);
  }

  private isTerminal(job: ScanJob): boolean {
    return ['done', 'error', 'cancelled', 'expired'].includes(this.getStatus(job));
  }

  private sortJobs(jobs: ScanJob[]): ScanJob[] {
    return [...jobs].sort((a, b) => {
      const priorityA = (!a.seen || this.isIncomplete(a)) ? 0 : 1;
      const priorityB = (!b.seen || this.isIncomplete(b)) ? 0 : 1;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
    });
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

  private createQueuedJob(job: ScanJobIncompleteResponse): ScanJob {
    return {
      scan_id: job.scan_id,
      title: 'Scan',
      target: '',
      status: 'queued',
      payload: job.payload ?? {},
      response: {},
      seen: false,
    };
  }
}
