import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
@Injectable({ providedIn: 'root' })
export class FetchingStateService {
  profile = signal<{
        [key: string]: boolean;
    }>({});
  posts = signal<{
        [key: string]: boolean;
    }>({});
  platformImages = signal<{
        [key: string]: boolean;
    }>({});
  followers = signal<{
        [key: string]: boolean;
    }>({});
  following = signal<{
        [key: string]: boolean;
    }>({});
  userImages = computed(() => {
    const platformState = this.platformImages();
    const userState: {
            [username: string]: boolean;
        } = {};
    for (const key in platformState) {
      if (platformState[key] && key.startsWith('platform-')) {
        const username = key.substring('platform-'.length).split('|')[0];
        userState[username] = true;
      }
    }
    return userState;
  });

  isUserBusy(username: string): boolean {
    if (this.userImages()[username]) {
      return true;
    }
    const userNodeIdPrefix = `platform-${username}|`;
    const states = [
      this.profile(),
      this.posts(),
      this.platformImages(),
      this.followers(),
      this.following(),
    ];
    return states.some(state => Object.keys(state).some(key => key.startsWith(userNodeIdPrefix) && state[key]));
  }

  getPlatformUniqueKey(p: PlatformResult): string {
    return `platform-${p.keyUsername}|${p.platform}|${p.username}`;
  }

  setFetching( stateSignal: WritableSignal<{ [key: string]: boolean; }>, key: string, isFetching: boolean ) {
    stateSignal.update(s => ({ ...s, [key]: isFetching }));
  }
}
