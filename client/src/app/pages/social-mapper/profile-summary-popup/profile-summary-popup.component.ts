import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, SocialImage } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl } from '../../../shared/utils/formatters';

@Component({
  selector: 'app-profile-summary-popup',
  templateUrl: './profile-summary-popup.component.html',
  styleUrls: ['./profile-summary-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class ProfileSummaryPopupComponent {
  username = input.required<string>();
  platforms = input.required<PlatformResult[]>();
  email = input<string | undefined>();
  images = input<SocialImage[] | undefined>();
  fetchingState = input.required<{ [platformNodeId: string]: boolean }>();
  isFetchingImages = input<boolean>(false);
  isFetchingPosts = input.required<{ [platformNodeId: string]: boolean }>();
  isScanInProgress = input<boolean>(false);

  close = output<void>();
  fetchProfile = output<PlatformResult>();
  fetchImages = output<string>();
  fetchPosts = output<PlatformResult>();
  rescan = output<string>();

  expandedPlatformName = signal<string | null>(null);

  public getPlatformColor = getPlatformColor;
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  onClose() {
    this.close.emit();
  }

  onPlatformClick(platform: PlatformResult) {
    if (this.expandedPlatformName() === platform.platform) {
      this.expandedPlatformName.set(null);
    } else {
      this.expandedPlatformName.set(platform.platform);
    }
  }

  getMetadataEntries(platform: PlatformResult): { key: string, value: any }[] {
    const metadata = platform.allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  getProfileDetailEntries(platform: PlatformResult): { key: string, value: any }[] {
    const details = platform.profileDetails;
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }
}