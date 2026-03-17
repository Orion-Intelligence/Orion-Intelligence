import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CameraInfo } from '../../../shared/model/network-intel/network-intel.model';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';

@Component({
  selector: 'app-geo-feed',
  standalone: true,
  imports: [CommonModule, DecimalPipe, PaginationComponent],
  templateUrl: './geo-feed.component.html',
})
export class GeoFeedComponent implements OnChanges, OnDestroy {
  private previewState = new Map<string, 'loading' | 'loaded' | 'failed'>();
  private previewTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  currentPage = 1;
  readonly pageSize = 10;

  @Input() cameras: CameraInfo[] = [];
  @Input() loading = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cameras']) {
      this.currentPage = 1;
      this.resetPreviewState();
    }
  }

  ngOnDestroy(): void {
    this.clearPreviewTimeouts();
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
    const nestedCamera = camera.cameras?.find(item => item?.camera_path || item?.port || item?.is_camera) || null;
    const cameraPath = camera.camera_path || nestedCamera?.camera_path || camera.camera_paths?.[0] || null;
    const port = camera.port || nestedCamera?.port || this.extractPort(camera.ports) || null;
    const derivedPathUrl = cameraPath && port ? `http://${camera.ip}:${port}${cameraPath}` : null;
    const derivedBaseUrl = port ? `http://${camera.ip}:${port}` : null;
    const candidates = [camera.stream_url, camera.url, derivedPathUrl, derivedBaseUrl]
      .filter((value): value is string => !!value);

    for (const value of candidates) {
      if (/^https?:\/\//i.test(value)) {
        return value;
      }
    }
    return null;
  }

  endpointLabel(camera: CameraInfo): string {
    return this.rawPreviewUrl(camera) || camera.ip;
  }

  locationLabel(camera: CameraInfo): string {
    const parts = [camera.city, camera.country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Unknown location';
  }

  hasPreview(camera: CameraInfo): boolean {
    return !!this.rawPreviewUrl(camera);
  }

  isPreviewFailed(camera: CameraInfo): boolean {
    return this.previewState.get(this.trackCamera(0, camera)) === 'failed';
  }

  isPreviewLoaded(camera: CameraInfo): boolean {
    return this.previewState.get(this.trackCamera(0, camera)) === 'loaded';
  }

  onPreviewLoad(camera: CameraInfo): void {
    const key = this.trackCamera(0, camera);
    this.previewState.set(key, 'loaded');
    const timeoutId = this.previewTimeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.previewTimeouts.delete(key);
    }
  }

  onPreviewError(camera: CameraInfo): void {
    const key = this.trackCamera(0, camera);
    this.previewState.set(key, 'failed');
    const timeoutId = this.previewTimeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.previewTimeouts.delete(key);
    }
  }

  trackCamera(index: number, camera: CameraInfo): string {
    return `${camera.ip}-${camera.port ?? 'na'}-${index}`;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  private resetPreviewState(): void {
    this.clearPreviewTimeouts();
    this.previewState.clear();

    for (const camera of this.cameras) {
      if (!this.hasPreview(camera)) {
        continue;
      }

      const key = this.trackCamera(0, camera);
      this.previewState.set(key, 'loading');
      this.previewTimeouts.set(key, setTimeout(() => {
        if (this.previewState.get(key) === 'loading') {
          this.previewState.set(key, 'failed');
        }
      }, 8000));
    }
  }

  private clearPreviewTimeouts(): void {
    for (const timeoutId of this.previewTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.previewTimeouts.clear();
  }

  private extractPort(ports?: Array<number | { port?: number }>): number | null {
    if (!ports?.length) {
      return null;
    }
    const first = ports[0];
    if (typeof first === 'number') {
      return first;
    }
    return first?.port ?? null;
  }
}
