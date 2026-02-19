import { input, output } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';

export abstract class PlatformFetchActionsBase {
    isScanInProgress = input<boolean>(false);
    fetchProfile = output<PlatformResult>();
    fetchPosts = output<PlatformResult>();
    fetchFollowers = output<PlatformResult>();
    fetchFollowing = output<PlatformResult>();
    cancelFetchProfile = output<PlatformResult>();
    cancelFetchPosts = output<PlatformResult>();
    cancelFetchFollowers = output<PlatformResult>();
    cancelFetchFollowing = output<PlatformResult>();
}

export abstract class PlatformFetchWithImagesActionsBase extends PlatformFetchActionsBase {
    fetchPlatformImages = output<PlatformResult>();
    cancelFetchPlatformImages = output<PlatformResult>();
}
