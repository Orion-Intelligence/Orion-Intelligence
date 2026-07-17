import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { Job, PlatformResult, ScanEvent, SocialExtensionFetchError } from '../../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../../shared/services/social-scan.service';
import type { FetchMergeMode, FetchStateKey, FetchTabKey, NotificationType, ScanJobOptions, UpdateStateFn } from '../models/social-graph.models';
import { SocialNormalizationUtil } from '../utils/social-normalization.util';
import { SocialStateService } from './social-state.service';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly scanService = inject(SocialScanService);
  private readonly stateStore = inject(SocialStateService);

  readonly graphState = this.stateStore.graphState;
  readonly notification = this.stateStore.notification;
  readonly deleteConfirmationData = this.stateStore.deleteConfirmationData;
  readonly deleteUsername = this.stateStore.deleteUsername;
  readonly manageProfilesModalData = this.stateStore.manageProfilesModalData;
  readonly activeUsername = this.stateStore.activeUsername;
  readonly highlightedNodeId = this.stateStore.highlightedNodeId;

  setActiveUserIndex(index: number): void {
    this.stateStore.setActiveUserIndex(index);
  }

  isActiveUser(username: string): boolean {
    return this.stateStore.isActiveUser(username);
  }

  isUserBusy(username: string): boolean {
    return this.stateStore.isUserBusy(username);
  }

  isTabLoading(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    return this.stateStore.isTabLoading(platformData, tabKey);
  }

  getPlatformUniqueKey(platformData: PlatformResult): string {
    return this.stateStore.getPlatformUniqueKey(platformData);
  }

  openDeleteConfirmation(username: string): void {
    this.stateStore.openDeleteConfirmation(username);
  }

  closeDeleteConfirmation(): void {
    this.stateStore.closeDeleteConfirmation();
  }

  openManageProfilesModal(username: string): void {
    this.stateStore.openManageProfilesModal(username);
  }

  closeManageProfilesModal(): void {
    this.stateStore.closeManageProfilesModal();
  }

  showNotification(type: NotificationType): void {
    this.stateStore.showNotification(type);
  }

  loadStoredSocialProfiles(): Observable<void> {
    return this.scanService.fetchStoredSocialProfiles().pipe(tap(documents => this.stateStore.applyStoredSocialProfiles(documents)), map(() => undefined));
  }

  loadStoredSocialProfile(profileUsername: string): Observable<PlatformResult[]> {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(profileUsername);
    const cachedProfiles = this.stateStore.getStoredProfiles(normalizedUsername);
    if (cachedProfiles) {
      this.stateStore.setProfilesForUsername(normalizedUsername, cachedProfiles);
      return of(cachedProfiles);
    }
    return this.scanService.fetchStoredSocialProfile(normalizedUsername).pipe(map(document => {
      const normalizedDocument = SocialNormalizationUtil.normalizeStoredDocument(document);
      return SocialNormalizationUtil.normalizeStoredProfiles(normalizedDocument);
    }), tap(profiles => {
      this.stateStore.setStoredProfiles(normalizedUsername, profiles);
      this.stateStore.setProfilesForUsername(normalizedUsername, profiles);
    }));
  }

  saveSocialProfiles(profileUsername: string, profiles: PlatformResult[], replace = false): Observable<any> {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(profileUsername);
    return this.scanService.saveSocialProfiles(normalizedUsername, profiles, replace).pipe(tap(() => {
      this.stateStore.cacheCurrentProfiles(normalizedUsername, profiles);
    }));
  }

  deleteStoredSocialProfiles(profileUsername: string): Observable<any> {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(profileUsername);
    return this.scanService.deleteStoredSocialProfiles(normalizedUsername).pipe(tap(() => {
      this.stateStore.deleteStoredProfiles(normalizedUsername);
    }));
  }

  fetchProfileInfo(platform: string, username: string): ReturnType<SocialScanService['fetchProfileInfo']> {
    return this.scanService.fetchProfileInfo(platform, username);
  }

  fetchExtensionBundle(platform: string, username: string): ReturnType<SocialScanService['fetchExtensionBundle']> {
    return this.scanService.fetchExtensionBundle(platform, username);
  }

  fetchPlatformImages(platform: string, username: string, maxImages?: number): ReturnType<SocialScanService['fetchPlatformImages']> {
    return this.scanService.fetchPlatformImages(platform, username, maxImages);
  }

  fetchSocialPosts(platform: string, username: string, hashId?: string, maxPosts?: number): ReturnType<SocialScanService['fetchSocialPosts']> {
    return this.scanService.fetchSocialPosts(platform, username, hashId, maxPosts);
  }

  fetchExtensionSocialPosts(platform: string, username: string, hashId?: string, maxPosts = 20, postOffset = 0, existingPostUrls: string[] = [], existingPostsCount = 0, socialDataType = 'posts', maxComments = 25, commentOffset = 0): ReturnType<SocialScanService['fetchExtensionSocialPosts']> {
    return this.scanService.fetchExtensionSocialPosts(platform, username, hashId, maxPosts, socialDataType, maxComments, commentOffset, postOffset, existingPostUrls, existingPostsCount);
  }

  fetchSocialVideos(platform: string, username: string, hashId?: string, maxVideos?: number): ReturnType<SocialScanService['fetchSocialVideos']> {
    return this.scanService.fetchSocialVideos(platform, username, hashId, maxVideos);
  }

  fetchSocialShorts(platform: string, username: string, hashId?: string, maxShorts?: number): ReturnType<SocialScanService['fetchSocialShorts']> {
    return this.scanService.fetchSocialShorts(platform, username, hashId, maxShorts);
  }

  fetchSocialPostComments(platform: string, username: string, tabKey: 'posts' | 'videos' | 'shorts', hashId?: string, commentOffset?: number, maxComments?: number): ReturnType<SocialScanService['fetchSocialPostComments']> {
    return this.scanService.fetchSocialPostComments(platform, username, tabKey, hashId, commentOffset, maxComments);
  }

  fetchFollowers(platform: string, username: string): ReturnType<SocialScanService['fetchFollowers']> {
    return this.scanService.fetchFollowers(platform, username);
  }

  fetchFollowing(platform: string, username: string): ReturnType<SocialScanService['fetchFollowing']> {
    return this.scanService.fetchFollowing(platform, username);
  }

  fetchPlatformStealerLogs(username: string, domain: string): ReturnType<SocialScanService['fetchPlatformStealerLogs']> {
    return this.scanService.fetchPlatformStealerLogs(username, domain);
  }

  fetchStealerLogsByIdentity(query: string): ReturnType<SocialScanService['fetchStealerLogsByIdentity']> {
    return this.scanService.fetchStealerLogsByIdentity(query);
  }

  fetchWantedList(query: string): ReturnType<SocialScanService['fetchWantedList']> {
    return this.scanService.fetchWantedList(query);
  }

  fetchProfileMetadataTokens(tokens: string[], username: string, platform?: string): ReturnType<SocialScanService['fetchProfileMetadataTokens']> {
    return this.scanService.fetchProfileMetadataTokens(tokens, username, platform);
  }

  fetchExtensionStatus(): ReturnType<SocialScanService['fetchExtensionStatus']> {
    return this.scanService.fetchExtensionStatus();
  }

  initiateScan(username: string, opts: ScanJobOptions): void {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(username);
    if (opts.jobs().some(job => SocialNormalizationUtil.normalizeUsername(job.username) === normalizedUsername && (job.status === 'in_progress' || job.status === 'queued'))) {
      this.showNotification('scanning');
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
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs.filter(job => SocialNormalizationUtil.normalizeUsername(job.username) !== normalizedUsername)]));
    if (!shouldQueue) {
      this.runScan(newJob, this.scanService.performScan(newJob.username), opts);
    }
  }

  initiateImageScan(base64Image: string, fileName: string, opts: ScanJobOptions): void {
    const displayName = `Image Scan: ${fileName}`;
    const jobName = `${displayName} #${self.crypto.randomUUID().substring(0, 4)}`;
    const newJob: Job = { id: self.crypto.randomUUID(), username: jobName, displayName, status: 'in_progress', progress: 5, step: `Scanning ${fileName}` };
    opts.updateState(state => state.jobs.update(currentJobs => [newJob, ...currentJobs]));
    this.runScan(newJob, this.scanService.performImageScan(base64Image), opts);
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
      this.runScan(activeJob, this.scanService.performScan(activeJob.username), nextOpts);
      return;
    }
    this.startNextQueuedScan(nextOpts);
  }

  fetchPlatformData(opts: { platformResult: PlatformResult; stateKey: FetchStateKey; request$: Observable<any>; cancelMap: Map<string, Subject<void>>; destroyRef: ScanJobOptions['destroyRef']; updateState: UpdateStateFn; mergeMode?: FetchMergeMode; }): void {
    const { platformResult, stateKey, request$, cancelMap, destroyRef, updateState, mergeMode } = opts;
    const key = this.stateStore.getPlatformUniqueKey(platformResult);
    if (this.stateStore.isUserBusy(platformResult.keyUsername)) {
      this.showNotification('busy');
      return;
    }
    if (cancelMap.has(key)) {
      return;
    }
    this.stateStore.setFetching(stateKey, key, true);
    const cancel$ = new Subject<void>();
    cancelMap.set(key, cancel$);
    request$.pipe(takeUntil(cancel$), takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (response: any) => {
          const dataKey = Object.keys(response)[0];
          const data = response[dataKey];
          const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
          let updatedProfiles: PlatformResult[] | null = null;
          updateState(tabState => {
            tabState.scanResults.update(currentMap => {
              const newMap = new Map(currentMap);
              const userResults = newMap.get(platformResult.keyUsername)?.map(platform => this.isSamePlatformIdentity(platform, platformResult)
                ? { ...platform, ...this.buildFetchedPlatformData(platform, stateKey, data, !!hasData, mergeMode) }
                : platform);
              if (userResults) {
                newMap.set(platformResult.keyUsername, userResults);
                updatedProfiles = userResults;
              }
              return newMap;
            });
          });
          if (updatedProfiles) {
            this.saveSocialProfiles(platformResult.keyUsername, updatedProfiles, true).pipe(takeUntilDestroyed(destroyRef)).subscribe();
          }
        },
        complete: () => {
          this.stateStore.setFetching(stateKey, key, false);
          cancelMap.delete(key);
        },
        error: (error) => {
          if (this.isExtensionStateKey(stateKey)) {
            this.storeExtensionFetchError(platformResult, error, updateState, destroyRef);
          }
          this.stateStore.setFetching(stateKey, key, false);
          cancelMap.delete(key);
        }
      });
  }

  private storeExtensionFetchError(platformResult: PlatformResult, error: any, updateState: UpdateStateFn, destroyRef: ScanJobOptions['destroyRef']): void {
    const extensionError = this.normalizeExtensionFetchError(error, platformResult.platform);
    let updatedProfiles: PlatformResult[] | null = null;
    updateState(tabState => {
      tabState.scanResults.update(currentMap => {
        const newMap = new Map(currentMap);
        const userResults = newMap.get(platformResult.keyUsername)?.map(platform => this.isSamePlatformIdentity(platform, platformResult)
          ? { ...platform, extensionError }
          : platform);
        if (userResults) {
          newMap.set(platformResult.keyUsername, userResults);
          updatedProfiles = userResults;
        }
        return newMap;
      });
    });
    if (updatedProfiles) {
      this.saveSocialProfiles(platformResult.keyUsername, updatedProfiles, true).pipe(takeUntilDestroyed(destroyRef)).subscribe();
    }
  }

  private normalizeExtensionFetchError(error: any, fallbackPlatform: string): SocialExtensionFetchError {
    const result = error?.result && typeof error.result === 'object' ? error.result : {};
    const message = result?.message || error?.message || result?.error || 'Extension job failed.';
    return {
      error_code: result?.error_code || error?.error_code || null,
      message: String(message),
      login_url: this.safeHttpUrl(result?.login_url || error?.login_url),
      platform: result?.error_platform || result?.platform || error?.platform || fallbackPlatform || null,
    };
  }

  private safeHttpUrl(value: any): string | null {
    const url = String(value || '').trim();
    if (!url) {
      return null;
    }
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
    }
    catch {
      return null;
    }
  }

  cancelPlatformFetch(platformData: PlatformResult, stateKey: FetchStateKey, cancelMap: Map<string, Subject<void>>): void {
    const key = this.stateStore.getPlatformUniqueKey(platformData);
    cancelMap.get(key)?.next();
    this.stateStore.setFetching(stateKey, key, false);
  }

  cancelAllPlatformFetchesForUser(username: string, scanResults: Map<string, PlatformResult[]>, cancelHandlers: { profile: (platformData: PlatformResult) => void; posts: (platformData: PlatformResult) => void; videos: (platformData: PlatformResult) => void; shorts: (platformData: PlatformResult) => void; images: (platformData: PlatformResult) => void; followers: (platformData: PlatformResult) => void; following: (platformData: PlatformResult) => void; onlinePresence: (platformData: PlatformResult) => void; stealerLogs: (platformData: PlatformResult) => void; }): void {
    scanResults.get(username)?.forEach(platformData => {
      cancelHandlers.profile(platformData);
      cancelHandlers.posts(platformData);
      cancelHandlers.videos(platformData);
      cancelHandlers.shorts(platformData);
      cancelHandlers.images(platformData);
      cancelHandlers.followers(platformData);
      cancelHandlers.following(platformData);
      cancelHandlers.onlinePresence(platformData);
      cancelHandlers.stealerLogs(platformData);
    });
  }

  private hasRunningJob(jobs: Job[]): boolean {
    return jobs.some(job => job.status === 'in_progress');
  }

  private getQueuedJob(jobs: Job[]): Job | undefined {
    return jobs.find(job => job.status === 'queued');
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
    this.runScan(nextJob, this.scanService.performScan(nextJob.username), opts);
  }

  private getScanObserver(job: Job, opts: ScanJobOptions) {
    return {
      next: (event: ScanEvent) => {
        if (event.type === 'progress') {
          opts.updateState(tabState => tabState.jobs.update(jobs => jobs.map(currentJob => currentJob.id === job.id ? { ...currentJob, ...event.payload } : currentJob)));
          return;
        }
        if (event.type === 'complete') {
          const incomingPlatforms = event.payload.map(platform => ({ ...platform, keyUsername: job.username, resultSource: platform.resultSource ?? ('normal' as const) }));
          opts.updateState(tabState => {
            tabState.scanResults.update(currentMap => {
              const existing = currentMap.get(job.username) ?? [];
              return new Map(currentMap).set(job.username, [...existing, ...incomingPlatforms]);
            });
            tabState.activeUsername.set(job.username);
            tabState.jobs.update(jobs => jobs.map(currentJob => currentJob.id === job.id ? { ...currentJob, status: 'completed', progress: 100, step: 'Completed' } : currentJob));
          });
          opts.persistProfiles?.(job.username, incomingPlatforms);
          this.startNextQueuedScan(opts);
        }
      },
      error: () => {
        opts.updateState(tabState => tabState.jobs.update(jobs => jobs.map(currentJob => currentJob.id === job.id ? { ...currentJob, status: 'failed', step: 'Scan failed' } : currentJob)));
        opts.cancelScanSubjects.delete(job.id);
        this.startNextQueuedScan(opts);
      },
      complete: () => opts.cancelScanSubjects.delete(job.id)
    };
  }

  private runScan(job: Job, scan$: ReturnType<SocialScanService['performScan']>, opts: ScanJobOptions): void {
    const cancel$ = new Subject<void>();
    opts.cancelScanSubjects.set(job.id, cancel$);
    scan$
      .pipe(takeUntil(cancel$), takeUntilDestroyed(opts.destroyRef))
      .subscribe(this.getScanObserver(job, opts));
  }

  private getPlatformIdentityKey(platform: PlatformResult): string {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}`;
  }

  private isSamePlatformIdentity(left: PlatformResult, right: PlatformResult): boolean {
    return this.getPlatformIdentityKey(left) === this.getPlatformIdentityKey(right);
  }

  private buildFetchedPlatformData(platform: PlatformResult, stateKey: FetchStateKey, data: any, hasData: boolean, mergeMode?: FetchMergeMode): Partial<PlatformResult> {
    if (stateKey === 'extensionProfile' && data && typeof data === 'object' && ('profile' in data || 'posts' in data || 'images' in data)) {
      return {
        extensionProfileDetails: data.profile ?? null,
        extensionPosts: Array.isArray(data.posts) ? data.posts : [],
        extensionVideos: Array.isArray(data.videos) ? data.videos : [],
        extensionShorts: Array.isArray(data.shorts) ? data.shorts : [],
        extensionImages: this.normalizeFetchedImages(data.images),
        extensionFollowers: this.normalizeFetchedUsernames(data.followers),
        extensionFollowing: this.normalizeFetchedUsernames(data.following),
        extensionError: null,
      };
    }
    const propertyMap = { profile: 'profileDetails', posts: 'posts', videos: 'videos', shorts: 'shorts', platformImages: 'images', extensionProfile: 'extensionProfileDetails', extensionPosts: 'extensionPosts', followers: 'followers_list', following: 'following_list', onlinePresence: 'onlinePresence', stealerLogs: 'stealerLogs' };
    const propertyName = (propertyMap as any)[stateKey];
    if (mergeMode && this.isPostStateKey(stateKey)) {
      if (!hasData || !Array.isArray(data)) {
        return {};
      }
      const existing = Array.isArray((platform as any)[propertyName]) ? (platform as any)[propertyName] : [];
      const merged = this.mergePostItems(existing, data, mergeMode);
      const mergedData: Partial<PlatformResult> = { [propertyName]: merged } as Partial<PlatformResult>;
      if (stateKey === 'posts') {
        mergedData.post_connections = this.extractConnections(merged);
      }
      if (this.isExtensionStateKey(stateKey)) {
        mergedData.extensionError = null;
      }
      return mergedData;
    }
    if (mergeMode && stateKey === 'platformImages') {
      if (!hasData || !Array.isArray(data)) {
        return {};
      }
      const existing = Array.isArray((platform as any)[propertyName]) ? (platform as any)[propertyName] : [];
      const mergedImages = { [propertyName]: this.mergeImageItems(existing, data, mergeMode) } as Partial<PlatformResult>;
      return mergedImages;
    }
    const newData: Partial<PlatformResult> = { [propertyName]: hasData ? data : null } as Partial<PlatformResult>;
    if (stateKey === 'posts' || stateKey === 'extensionPosts') {
      newData.post_connections = hasData ? this.extractConnections(data) : null;
    }
    if (this.isExtensionStateKey(stateKey)) {
      newData.extensionError = null;
    }
    return newData;
  }

  private isPostStateKey(stateKey: FetchStateKey): stateKey is 'posts' | 'videos' | 'shorts' | 'extensionPosts' {
    return ['posts', 'videos', 'shorts', 'extensionPosts'].includes(stateKey);
  }

  private isExtensionStateKey(stateKey: FetchStateKey): boolean {
    return stateKey.startsWith('extension');
  }

  private normalizeFetchedImages(value: any): any[] {
    return Array.isArray(value)
      ? value.map((image: any) => ({
        image_url: image?.image_url || image?.media_url || image?.thumbnail || '',
        thumbnail: image?.thumbnail || image?.image_url || image?.media_url || '',
        title: image?.title || image?.caption || image?.text || 'Image result',
        source: image?.source || image?.source_url || '',
      })).filter((image: any) => image.image_url || image.thumbnail)
      : [];
  }

  private normalizeFetchedUsernames(value: any): string[] {
    const items = Array.isArray(value)
      ? value
      : Array.isArray(value?.followers)
        ? value.followers
        : Array.isArray(value?.following)
          ? value.following
          : [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of items) {
      const username = this.extractUsernameValue(item);
      const key = username.toLowerCase();
      if (!username || seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(username);
    }
    return result;
  }

  private extractUsernameValue(value: any): string {
    const rawValue = typeof value === 'object' && value !== null
      ? SocialNormalizationUtil.firstValue(value.username, value.user, value.handle, value.name, value.sender_name)
      : value;
    return String(rawValue || '').trim().replace(/^@+/, '');
  }

  private mergePostItems(existing: any[], incoming: any[], mergeMode: FetchMergeMode): any[] {
    if (mergeMode === 'update') {
      const incomingByKey = new Map(incoming.map(item => [this.getPostItemKey(item), item]));
      return existing.map(item => {
        const incomingItem = incomingByKey.get(this.getPostItemKey(item));
        return incomingItem ? this.mergePostUpdate(item, incomingItem) : item;
      });
    }
    const orderedItems = mergeMode === 'prepend' ? [...incoming, ...existing] : [...existing, ...incoming];
    const seen = new Set<string>();
    return orderedItems.filter(item => {
      const key = this.getPostItemKey(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getPostItemKey(post: any): string {
    return SocialNormalizationUtil.getPostItemKey(post);
  }

  private mergePostUpdate(existing: any, incoming: any): any {
    const existingCommentDetails = Array.isArray(existing?.comment_details) && existing.comment_details.length > 0 ? existing.comment_details : existing?.comment_items;
    const incomingCommentDetails = Array.isArray(incoming?.comment_details) && incoming.comment_details.length > 0 ? incoming.comment_details : incoming?.comment_items;
    const mergedCommentDetails = SocialNormalizationUtil.normalizeCommentDetails(existingCommentDetails, incomingCommentDetails);
    const mergedCommentItems = SocialNormalizationUtil.normalizeCommentItems(existing?.comment_items, incoming?.comment_items);
    const merged = { ...existing, ...incoming };
    if (mergedCommentDetails.length > 0) {
      merged.comment_details = mergedCommentDetails;
    }
    if (mergedCommentItems.length > 0) {
      merged.comment_items = mergedCommentItems;
    }
    return merged;
  }

  private mergeImageItems(existing: any[], incoming: any[], mergeMode: FetchMergeMode): any[] {
    const orderedItems = mergeMode === 'prepend' ? [...incoming, ...existing] : [...existing, ...incoming];
    const seen = new Set<string>();
    return orderedItems.filter(item => {
      const key = this.getImageItemKey(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getImageItemKey(image: any): string {
    const sourceTitleKey = image?.source || image?.title ? `${image?.source || ''}|${image?.title || ''}` : '';
    return String(image?.image_url || image?.thumbnail || image?.url || sourceTitleKey || JSON.stringify(image)).trim();
  }

  private extractConnections(posts: any): string[] | null {
    if (!Array.isArray(posts)) {
      return null;
    }
    const seen = new Set<string>();
    const result: string[] = [];
    for (const post of posts) {
      const connections = Array.isArray(post?.connections) ? post.connections : [];
      for (const connection of connections) {
        const trimmed = String(connection || '').trim();
        if (!trimmed) {
          continue;
        }
        const normalized = SocialNormalizationUtil.normalizeIdentity(trimmed);
        const key = normalized.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push(normalized);
      }
    }
    return result;
  }
}
