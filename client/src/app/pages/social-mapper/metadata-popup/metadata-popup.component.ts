import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-metadata-popup',
  templateUrl: './metadata-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class MetadataPopupComponent {
  data = input.required<PlatformResult>();
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  formatFollowers(count?: number): string {
    if (count === undefined) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  getMetadataEntries(): { key: string, value: any }[] {
    const metadata = this.data().allMetadata;
    if (!metadata) return [];
    // FIX: `Object.entries` returns `[key, value][]`. We need to map it to `{key, value}[]` to match the return type.
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  formatKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  }

  isUrl(value: any): boolean {
    return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
  }

  isImageUrl(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /\.(jpeg|jpg|gif|png|svg)(\?|$)/.test(value.toLowerCase());
  }
}
