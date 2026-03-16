import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CameraInfo } from '../../../shared/model/network-intel/network-intel.model';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';

@Component({
  selector: 'app-geo-feed',
  standalone: true,
  imports: [CommonModule, DecimalPipe, PaginationComponent],
  templateUrl: './geo-feed.component.html',
})
export class GeoFeedComponent implements OnChanges {
  @Input() cameras: CameraInfo[] = [];
  @Input() loading = false;
  currentPage = 1;
  readonly pageSize = 10;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cameras']) {
      this.currentPage = 1;
    }
  }

  get pagedCameras(): CameraInfo[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.cameras.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.cameras.length / this.pageSize));
  }

  previewUrl(camera: CameraInfo): SafeResourceUrl | null {
    const url = this.rawPreviewUrl(camera);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }

  rawPreviewUrl(camera: CameraInfo): string | null {
    const candidates = [camera.stream_url, camera.url, camera.port ? `http://${camera.ip}:${camera.port}` : null]
      .filter((value): value is string => !!value);

    for (const value of candidates) {
      if (/^https?:\/\//i.test(value)) {
        return value;
      }
    }
    return null;
  }

  endpointLabel(camera: CameraInfo): string {
    return camera.stream_url || camera.url || (camera.port ? `${camera.ip}:${camera.port}` : camera.ip);
  }

  locationLabel(camera: CameraInfo): string {
    const parts = [camera.city, camera.country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Unknown location';
  }

  hasPreview(camera: CameraInfo): boolean {
    return !!this.rawPreviewUrl(camera);
  }

  trackCamera(index: number, camera: CameraInfo): string {
    return `${camera.ip}-${camera.port ?? 'na'}-${index}`;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }
}
