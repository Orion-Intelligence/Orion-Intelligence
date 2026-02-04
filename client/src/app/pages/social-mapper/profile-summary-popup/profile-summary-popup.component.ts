
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-profile-summary-popup',
  templateUrl: './profile-summary-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class ProfileSummaryPopupComponent {
  username = input.required<string>();
  platforms = input.required<PlatformResult[]>();
  email = input<string | undefined>();
  close = output<void>();

  expandedPlatform = signal<PlatformResult | null>(null);

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

  formatFollowers(count?: number): string {
    if (count === undefined) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  trackByPlatform(index: number, platform: PlatformResult): string {
    return platform.platform;
  }
}
