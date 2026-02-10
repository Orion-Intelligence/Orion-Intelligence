import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';
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
  close = output<void>();

  expandedPlatform = signal<PlatformResult | null>(null);

  public getPlatformColor = getPlatformColor;
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  onClose() {
    this.close.emit();
  }

  onPlatformClick(platform: PlatformResult) {
    if (this.expandedPlatform() === platform) {
      this.expandedPlatform.set(null);
    } else {
      this.expandedPlatform.set(platform);
    }
  }

  getMetadataEntries(platform: PlatformResult): { key: string, value: any }[] {
    const metadata = platform.allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }
}
