import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl } from '../../../shared/utils/formatters';

@Component({
  selector: 'app-metadata-popup',
  templateUrl: './metadata-popup.component.html',
  styleUrls: ['./metadata-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class MetadataPopupComponent {
  data = input.required<PlatformResult>();
  isFetching = input<boolean>(false);
  isFetchingPosts = input<boolean>(false);
  isScanInProgress = input<boolean>(false);
  close = output<void>();
  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();

  public getPlatformColor = getPlatformColor;
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  onClose() {
    this.close.emit();
  }

  getMetadataEntries(): { key: string, value: any }[] {
    const metadata = this.data().allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  getProfileDetailEntries(): { key: string, value: any }[] {
    const details = this.data().profileDetails;
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }
}