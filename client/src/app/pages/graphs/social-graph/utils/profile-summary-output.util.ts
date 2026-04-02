import { output } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';

export function createPlatformFetchOutputs() {
  return {
    fetchProfile: output<PlatformResult>(),
    fetchPosts: output<PlatformResult>(),
    fetchFollowers: output<PlatformResult>(),
    fetchFollowing: output<PlatformResult>(),
    fetchPlatformImages: output<PlatformResult>(),
  };
}

export function createPlatformCancelOutputs() {
  return {
    cancelFetchProfile: output<PlatformResult>(),
    cancelFetchPosts: output<PlatformResult>(),
    cancelFetchFollowers: output<PlatformResult>(),
    cancelFetchFollowing: output<PlatformResult>(),
    cancelFetchPlatformImages: output<PlatformResult>(),
  };
}
