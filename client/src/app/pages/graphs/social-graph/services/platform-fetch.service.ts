import { DestroyRef, Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FetchingStateService } from './fetching-state.service';
import { PlatformResult, TabState } from '../../../../shared/model/social/social-scan.models';
import { SocialMapperStateService } from './social-mapper-state.service';
import { GraphOrchestratorService } from './graph-orchestrator.service';
type UpdateStateFn = (updater: (state: TabState) => void, shouldScheduleSave?: boolean) => void;
type FetchStateKey = 'profile' | 'posts' | 'platformImages' | 'followers' | 'following';
@Injectable({ providedIn: 'root' })
export class PlatformFetchService {
    private getPlatformIdentityKey(platform: PlatformResult): string {
        return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}`;
    }
    private isSamePlatformIdentity(left: PlatformResult, right: PlatformResult): boolean {
        return this.getPlatformIdentityKey(left) === this.getPlatformIdentityKey(right);
    }
    private updateUIPopups(state: SocialMapperStateService, p: PlatformResult, data: Partial<PlatformResult>): void {
        const selectedPlatform = state.selectedPlatformData();
        if (selectedPlatform && this.isSamePlatformIdentity(selectedPlatform, p)) {
            state.selectedPlatformData.update(current => current ? { ...current, ...data } : null);
        }
        if (state.summaryPopupData()?.username === p.keyUsername) {
            state.summaryPopupData.update(current => {
                if (!current) {
                    return null;
                }
                return { ...current, platforms: current.platforms.map(platform => this.isSamePlatformIdentity(platform, p) ? { ...platform, ...data } : platform) };
            });
        }
        const followerPopupPlatform = state.followerScanPopupData()?.platform;
        if (followerPopupPlatform && this.isSamePlatformIdentity(followerPopupPlatform, p)) {
            state.followerScanPopupData.update(current => current ? { platform: { ...current.platform, ...data } } : null);
        }
    }
    fetchData(opts: {
        platformResult: PlatformResult;
        stateKey: FetchStateKey;
        request$: Observable<any>;
        cancelMap: Map<string, Subject<void>>;
        fetchingState: FetchingStateService;
        destroyRef: DestroyRef;
        updateState: UpdateStateFn;
        state: SocialMapperStateService;
        graphOrchestrator: GraphOrchestratorService;
        activeTabState: () => TabState | undefined;
    }): void {
        const { platformResult, stateKey, request$, cancelMap, fetchingState, destroyRef, updateState, state, graphOrchestrator, activeTabState } = opts;
        const key = fetchingState.getPlatformUniqueKey(platformResult);
        if (fetchingState.isUserBusy(platformResult.keyUsername)) {
            state.showNotification('busy');
            return;
        }
        if (cancelMap.has(key)) {
            return;
        }
        fetchingState.setFetching((fetchingState as any)[stateKey], key, true);
        const cancel$ = new Subject<void>();
        cancelMap.set(key, cancel$);
        request$.pipe(takeUntil(cancel$), takeUntilDestroyed(destroyRef))
            .subscribe({
            next: (response: any) => {
                const propertyMap = { profile: 'profileDetails', posts: 'posts', platformImages: 'images', followers: 'followers_list', following: 'following_list' };
                const dataKey = Object.keys(response)[0];
                const data = response[dataKey];
                const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
                const newData = { [(propertyMap as any)[stateKey]]: hasData ? data : null };
                updateState(tabState => {
                    tabState.scanResults.update(currentMap => {
                        const newMap = new Map(currentMap);
                        const userResults = newMap.get(platformResult.keyUsername)?.map(p => this.isSamePlatformIdentity(p, platformResult) ? { ...p, ...newData } : p);
                        if (userResults) {
                            newMap.set(platformResult.keyUsername, userResults);
                        }
                        return newMap;
                    });
                });
                this.updateUIPopups(state, platformResult, newData);
                if (stateKey === 'followers' || stateKey === 'following') {
                    const tabState = activeTabState();
                    if (tabState) {
                        graphOrchestrator.updateUserConnections(tabState).then();
                    }
                }
            },
            error: () => { },
            complete: () => {
                fetchingState.setFetching((fetchingState as any)[stateKey], key, false);
                cancelMap.delete(key);
            }
        });
    }
    cancelFetch(p: PlatformResult, stateKey: FetchStateKey, cancelMap: Map<string, Subject<void>>, fetchingState: FetchingStateService): void {
        const key = fetchingState.getPlatformUniqueKey(p);
        cancelMap.get(key)?.next();
        fetchingState.setFetching((fetchingState as any)[stateKey], key, false);
    }
    cancelAllFetchesForUser(username: string, scanResults: Map<string, PlatformResult[]>, cancelHandlers: {
        profile: (p: PlatformResult) => void;
        posts: (p: PlatformResult) => void;
        images: (p: PlatformResult) => void;
        followers: (p: PlatformResult) => void;
        following: (p: PlatformResult) => void;
    }): void {
        scanResults.get(username)?.forEach(p => {
            cancelHandlers.profile(p);
            cancelHandlers.posts(p);
            cancelHandlers.images(p);
            cancelHandlers.followers(p);
            cancelHandlers.following(p);
        });
    }
}
