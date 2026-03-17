import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  private expandedCameraList: CameraInfo[] = [];

  currentPage = 1;
  readonly pageSize = 10;

  @Input() cameras: CameraInfo[] = [];
  @Input() loading = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cameras']) {
      this.currentPage = 1;
      this.expandedCameraList = this.expandCameras(this.cameras);
      this.resetPreviewState();
    }
  }

  ngOnDestroy(): void {
    this.clearPreviewTimeouts();
  }

  get pagedCameras(): CameraInfo[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.expandedCameraList.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.expandedCameraList.length / this.pageSize));
  }

  previewUrl(camera: CameraInfo): SafeUrl | null {
    const url = this.rawPreviewUrl(camera);
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }

  rawPreviewUrl(camera: CameraInfo): string | null {
    const candidates = [
      camera.stream_url,
      camera.url,
      ...this.snapshotUrls(camera),
      ...this.cameraPathUrls(camera),
      ...this.cameraBaseUrls(camera)
    ]
      .filter((value): value is string => !!value);

    for (const value of candidates) {
      if (/^https?:\/\//i.test(value)) {
        return value;
      }
    }
    return null;
  }

  endpointLabel(camera: CameraInfo): string {
    const port = this.cameraPort(camera);
    const path = this.cameraPath(camera);
    return path && port ? `${camera.ip}:${port}${path}` : this.rawPreviewUrl(camera) || camera.ip;
  }

  locationLabel(camera: CameraInfo): string {
    const parts = [camera.city, camera.country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Unknown location';
  }

  hasPreview(camera: CameraInfo): boolean {
    if (this.shouldSuppressSnapshot(camera)) {
      return false;
    }
    return !!this.rawPreviewUrl(camera);
  }

  hasEndpoint(camera: CameraInfo): boolean {
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
    return `${camera.ip}-${this.cameraPort(camera) ?? 'na'}-${index}`;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  private resetPreviewState(): void {
    this.clearPreviewTimeouts();
    this.previewState.clear();

    for (const camera of this.expandedCameraList) {
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

  primaryCamera(camera: CameraInfo): NonNullable<CameraInfo['cameras']>[number] | null {
    return camera.cameras?.find(item => item?.camera_path || item?.port || item?.is_camera) || null;
  }

  cameraPort(camera: CameraInfo): number | null {
    return camera.port || this.primaryCamera(camera)?.port || this.extractPort(camera.ports) || null;
  }

  cameraBrand(camera: CameraInfo): string | null {
    return camera.brand || this.primaryCamera(camera)?.brand || null;
  }

  cameraModel(camera: CameraInfo): string | null {
    return camera.model || this.primaryCamera(camera)?.model_hint || this.cameraBrand(camera) || null;
  }

  cameraPath(camera: CameraInfo): string | null {
    return camera.camera_path || this.primaryCamera(camera)?.camera_path || this.preferredCameraPath(camera) || null;
  }

  cameraStatus(camera: CameraInfo): number | null {
    return this.primaryCamera(camera)?.path_status ?? null;
  }

  detectionMethod(camera: CameraInfo): string | null {
    return this.primaryCamera(camera)?.['detection_method'] || null;
  }

  private expandCameras(cameras: CameraInfo[]): CameraInfo[] {
    return cameras.flatMap(camera => {
      const nestedCameras = camera.cameras?.filter(item => item?.is_camera) || [];

      if (!nestedCameras.length) {
        return [camera];
      }

      return nestedCameras.map(item => ({
        ...camera,
        port: item.port ?? camera.port,
        brand: item.brand || camera.brand,
        model: item.model_hint || camera.model,
        camera_path: item.camera_path || camera.camera_path,
        cameras: [item],
      }));
    });
  }

  private snapshotUrls(camera: CameraInfo): string[] {
    const ports = this.cameraPorts(camera);
    if (!ports.length) {
      return [];
    }
    const path = this.preferredSnapshotPath(camera);
    const brand = (this.cameraBrand(camera) || '').toLowerCase();

    if (path && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(path)) {
      return ports.map(port => `http://${camera.ip}:${port}${path}`);
    }

    if (brand.includes('axis') || path?.includes('viewer_index.shtml')) {
      return ports.map(port => `http://${camera.ip}:${port}/axis-cgi/jpg/image.cgi`);
    }

    return ports.map(port => path ? `http://${camera.ip}:${port}${path}` : `http://${camera.ip}:${port}`);
  }

  private preferredCameraPath(camera: CameraInfo): string | null {
    const paths = camera.camera_paths || [];
    return paths[0] || null;
  }

  private preferredSnapshotPath(camera: CameraInfo): string | null {
    const paths = camera.camera_paths || [];
    const imagePath = paths.find(path => /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(path));
    if (imagePath) {
      return imagePath;
    }
    const camPath = paths.find(path => /\/cam_\d+(?:\.jpg)?(?:\?|$)/i.test(path));
    if (camPath) {
      return camPath.endsWith('.jpg') ? camPath : `${camPath}.jpg`;
    }
    return this.cameraPath(camera);
  }

  private cameraPathUrls(camera: CameraInfo): string[] {
    const ports = this.cameraPorts(camera);
    const paths = camera.camera_paths || [];
    if (!ports.length || !paths.length) {
      return [];
    }
    return ports.flatMap(port => paths.map(path => `http://${camera.ip}:${port}${path}`));
  }

  private cameraBaseUrls(camera: CameraInfo): string[] {
    return this.cameraPorts(camera).map(port => `http://${camera.ip}:${port}`);
  }

  private cameraPorts(camera: CameraInfo): number[] {
    const nestedPorts = camera.cameras?.map(item => item.port).filter((port): port is number => typeof port === 'number') || [];
    const explicitPorts = (camera.ports || []).map(port => typeof port === 'number' ? port : port?.port).filter((port): port is number => typeof port === 'number');
    const primaryPort = this.cameraPort(camera);
    return Array.from(new Set([...(primaryPort ? [primaryPort] : []), ...nestedPorts, ...explicitPorts]));
  }

  private shouldSuppressSnapshot(camera: CameraInfo): boolean {
    const brand = (this.cameraBrand(camera) || '').toLowerCase();
    if (!brand.includes('webcamxp')) {
      return false;
    }
    const snapshotPath = this.preferredSnapshotPath(camera);
    return !snapshotPath || !/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(snapshotPath);
  }
}
