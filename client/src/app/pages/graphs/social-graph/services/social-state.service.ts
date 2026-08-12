import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { Job, ManageProfilesModalData, PlatformResult, SocialGraphState, SocialStoredProfile } from '../../../../shared/model/social/social-scan.models';
import type { DeleteConfirmationData, FetchStateKey, FetchTabKey, NotificationData, NotificationType } from '../models/social-graph.models';
import { SocialNormalizationUtil } from '../utils/social-normalization.util';

@Injectable({ providedIn: 'root' })
export class SocialStateService {
  private notificationTimeout: any;
  private readonly graphStateRef: SocialGraphState = this.createGraphState();
  private readonly storedProfileCache = new Map<string, PlatformResult[]>();
  private readonly jobs = computed(() => this.graphStateRef.jobs());
  private readonly scanResults = computed(() => this.graphStateRef.scanResults());
  private readonly scannedUsernames = computed(() => Array.from(this.graphStateRef.scanResults().keys()));
  private readonly profile = signal<Record<string, boolean>>({});
  private readonly posts = signal<Record<string, boolean>>({});
  private readonly videos = signal<Record<string, boolean>>({});
  private readonly shorts = signal<Record<string, boolean>>({});
  private readonly platformImages = signal<Record<string, boolean>>({});
  private readonly extensionProfile = signal<Record<string, boolean>>({});
  private readonly extensionPosts = signal<Record<string, boolean>>({});
  private readonly extensionShorts = signal<Record<string, boolean>>({});
  private readonly followers = signal<Record<string, boolean>>({});
  private readonly following = signal<Record<string, boolean>>({});
  private readonly onlinePresence = signal<Record<string, boolean>>({});
  private readonly stealerLogs = signal<Record<string, boolean>>({});
  private readonly fetchStates: Record<FetchStateKey, WritableSignal<Record<string, boolean>>> = { profile: this.profile, posts: this.posts, videos: this.videos, shorts: this.shorts, platformImages: this.platformImages, extensionProfile: this.extensionProfile, extensionPosts: this.extensionPosts, extensionShorts: this.extensionShorts, followers: this.followers, following: this.following, onlinePresence: this.onlinePresence, stealerLogs: this.stealerLogs };

  readonly graphState: SocialGraphState = this.graphStateRef;
  readonly notification = signal<NotificationData | null>(null);
  readonly deleteConfirmationData = signal<DeleteConfirmationData | null>(null);
  readonly deleteUsername = signal<string | null>(null);
  readonly manageProfilesModalData = signal<ManageProfilesModalData | null>(null);
  readonly highlightedNodeId = signal<string | null>(null);
  readonly activeUsername = computed(() => {
    const usernames = this.scannedUsernames();
    const selectedUsername = this.graphState.activeUsername();
    if (selectedUsername) {
      const matchingUsername = usernames.find(username => username.toLowerCase() === selectedUsername.toLowerCase());
      if (matchingUsername) {
        return matchingUsername;
      }
    }
    return usernames[0] ?? null;
  });

  setActiveUserIndex(index: number): void {
    const usernames = this.scannedUsernames();
    const boundedIndex = Math.min(Math.max(index, 0), Math.max(usernames.length - 1, 0));
    this.graphState.activeUsername.set(usernames[boundedIndex] ?? null);
  }

  isActiveUser(username: string): boolean {
    const activeUsername = this.activeUsername();
    return !!activeUsername && activeUsername.toLowerCase() === username.toLowerCase();
  }

  openDeleteConfirmation(username: string): void {
    const job = this.jobs().find(j => j.username === username);
    this.deleteUsername.set(username);
    this.deleteConfirmationData.set({
      message: `Are you sure you want to delete the profile for ${job?.displayName || username}? This will remove all associated data and cannot be undone.`,
    });
  }

  closeDeleteConfirmation(): void {
    this.deleteConfirmationData.set(null);
    this.deleteUsername.set(null);
  }

  openManageProfilesModal(username: string): void {
    const results = this.scanResults().get(username);
    if (!results) {
      return;
    }
    const hasStoredSelection = results.some(platform => platform.isSelected);
    const platforms = results.map(platform => ({
      ...platform,
      isSelected: hasStoredSelection ? platform.isSelected : platform.status !== 'informational',
    }));
    this.manageProfilesModalData.set({ username, platforms });
  }

  closeManageProfilesModal(): void {
    this.manageProfilesModalData.set(null);
  }

  showNotification(type: NotificationType): void {
    clearTimeout(this.notificationTimeout);
    const notifications: Record<NotificationType, Omit<NotificationData, 'type'>> = {
      scanning: { message: 'A scan for this user is already in progress.', icon: 'bi bi-hourglass-split', style: 'bg-orange-500/90 text-white border border-orange-400' },
      busy: { message: 'An operation is already in progress for this user.', icon: 'bi bi-hourglass-split', style: 'bg-orange-500/90 text-white border border-orange-400 animate-pulse' }
    };
    this.notification.set({ type, ...notifications[type] });
    this.notificationTimeout = setTimeout(() => this.notification.set(null), 3000);
  }

  applyStoredSocialProfiles(documents: SocialStoredProfile[]): void {
    const normalizedDocuments = documents
      .map(document => SocialNormalizationUtil.normalizeStoredDocument(document))
      .filter(document => !!document.profile_username);

    this.graphState.jobs.update(currentJobs => {
      const runningJobs = currentJobs.filter(job => job.status === 'queued' || job.status === 'in_progress');
      const runningUsernames = new Set(runningJobs.map(job => SocialNormalizationUtil.normalizeUsername(job.username)));
      return [
        ...runningJobs,
        ...normalizedDocuments
          .filter(document => !runningUsernames.has(document.profile_username))
          .map(document => this.buildStoredJob(document)),
      ];
    });

    this.graphState.scanResults.update(currentMap => {
      const nextMap = new Map(currentMap);
      for (const document of normalizedDocuments) {
        const profiles = SocialNormalizationUtil.normalizeStoredProfiles(document);
        this.storedProfileCache.set(document.profile_username, profiles);
        nextMap.set(document.profile_username, profiles);
      }
      return nextMap;
    });

    if (!this.graphState.activeUsername() && normalizedDocuments[0]) {
      this.graphState.activeUsername.set(normalizedDocuments[0].profile_username);
    }
  }

  getStoredProfiles(profileUsername: string): PlatformResult[] | null {
    return this.storedProfileCache.get(SocialNormalizationUtil.normalizeUsername(profileUsername)) ?? null;
  }

  setStoredProfiles(profileUsername: string, profiles: PlatformResult[]): void {
    this.storedProfileCache.set(SocialNormalizationUtil.normalizeUsername(profileUsername), profiles);
  }

  cacheCurrentProfiles(profileUsername: string, fallbackProfiles: PlatformResult[]): void {
    const normalizedUsername = SocialNormalizationUtil.normalizeUsername(profileUsername);
    this.storedProfileCache.set(normalizedUsername, this.scanResults().get(profileUsername) ?? this.scanResults().get(normalizedUsername) ?? fallbackProfiles);
  }

  deleteStoredProfiles(profileUsername: string): void {
    this.storedProfileCache.delete(SocialNormalizationUtil.normalizeUsername(profileUsername));
  }

  setProfilesForUsername(username: string, profiles: PlatformResult[]): void {
    this.graphState.scanResults.update(currentMap => new Map(currentMap).set(username, profiles));
    this.graphState.activeUsername.set(username);
  }

  getPlatformUniqueKey(platformData: PlatformResult): string {
    return `platform-${platformData.keyUsername}|${platformData.platform}|${platformData.username}`;
  }

  isUserBusy(username: string): boolean {
    const userNodeIdPrefix = `platform-${username}|`;
    return Object.values(this.fetchStates).some(fetchState => Object.keys(fetchState()).some(key => key.startsWith(userNodeIdPrefix) && fetchState()[key]));
  }

  isTabLoading(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    const stateKey = this.getFetchStateKeyForTab(tabKey);
    const key = this.getPlatformUniqueKey(platformData);
    return !!this.fetchStates[stateKey]()[key];
  }

  setFetching(stateKey: FetchStateKey, key: string, isFetching: boolean): void {
    this.fetchStates[stateKey].update(state => ({ ...state, [key]: isFetching }));
  }

  private createGraphState(): SocialGraphState {
    return {
      homeMenuSearchTerm: signal(''),
      jobs: signal<Job[]>([]),
      scanResults: signal(new Map<string, PlatformResult[]>()),
      isHomeMenuCollapsed: signal(false),
      activeUsername: signal<string | null>(null),
    };
  }

  private buildStoredJob(document: SocialStoredProfile): Job {
    return {
      id: `stored-${document.profile_username}`,
      username: document.profile_username,
      status: 'completed',
      progress: 100,
      step: `${document.count ?? document.profiles.length} profiles`,
    };
  }

  private getFetchStateKeyForTab(tabKey: FetchTabKey): FetchStateKey {
    switch (tabKey) {
      case 'details':
        return 'profile';
      case 'connections':
        return 'posts';
      case 'extension':
      case 'extensionDetails':
        return 'extensionProfile';
      case 'extensionPosts':
        return 'extensionPosts';
      case 'extensionShorts':
        return 'extensionShorts';
      case 'images':
        return 'platformImages';
      case 'posts':
      case 'videos':
      case 'shorts':
      case 'followers':
      case 'following':
      case 'onlinePresence':
      case 'stealerLogs':
        return tabKey;
    }
  }
}
