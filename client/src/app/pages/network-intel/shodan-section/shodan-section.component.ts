import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { IpDetail } from '../../../shared/model/network-intel/network-intel.model';
import { IpDetailComponent } from '../ip-detail/ip-detail.component';

@Component({
  selector: 'app-network-intel-shodan-section',
  standalone: true,
  imports: [CommonModule, IpDetailComponent],
  templateUrl: './shodan-section.component.html',
  animations: [fadeInDashboardItem],
})
export class ShodanSectionComponent {
  @Input() isScanning = false;
  @Input() progress = 0;
  @Input() currentStep = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() hasSearched = false;
  @Input() shodanResult: IpDetail | null = null;

  constructor(private router: Router) {}

  get isEmbeddedInConsolidated(): boolean {
    return this.router.url.includes('/consolidated');
  }

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Scanning in progress...';
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for scanner availability...';
    }
    return raw;
  }

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.shodanResult && !this.errorMessage && (this.isScanning || this.progress > 0);
  }

  get cameraPortCount(): number {
    return (this.shodanResult?.ports || []).filter((port: any) => port && (port.is_camera || port.device_type === 'camera')).length;
  }

  get hasCameraSignals(): boolean {
    return !!this.shodanResult?.is_camera || this.cameraPortCount > 0 || (this.shodanResult?.cameras?.length ?? 0) > 0;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }
}
