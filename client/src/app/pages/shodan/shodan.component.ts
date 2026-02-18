import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { Category } from '../../shared/constants/pages';

interface ScanProgress {
  percent: number;
  status: string;
  message: string;
}

interface PortInfo {
  port: number;
  service: string;
  banner?: string;
  protocol_verified: boolean;
  state: string;
  cpe?: string;
  risk_flags?: string[];
  confidence: number;
  tls?: any;
  ssh_fingerprint?: any;
  camera?: any;
  misconfigurations?: string[];
  vulnerabilities?: any[];
}

interface ScanResult {
  ip: string;
  hostnames: string[];
  country?: string;
  city?: string;
  organization?: string;
  isp?: string;
  asn?: string;
  cloud_provider?: string;
  cloud_region?: string;
  cloud_service?: string;
  hosting_type?: string;
  open_ports: number[];
  vulnerabilities: any[];
  misconfigurations: string[];
  cameras: any[];
  ports: PortInfo[];
  web_technologies?: string[];
  web_server?: string;
  title?: string;
  hsts?: boolean;
}

interface ScanResponse {
  status: string;
  count: number;
  message: string;
  results: ScanResult[];
  result?: {
    status?: string;
    progress?: number;
  };
  progress?: number;
}

@Component({
  selector: 'app-shodan',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './shodan.component.html',
  styleUrls: ['./shodan.component.css']
})
export class ShodanComponent implements OnInit, OnDestroy {
  protected readonly category = Category;

  searchQuery: string = '';
  isValidIP: boolean = true;
  errorMessage: string = '';

  scanResults: ScanResult | null = null;
  expandedRows: Set<number> = new Set();

  loading: boolean = false;
  scanProgress: ScanProgress = {
    percent: 0,
    status: '',
    message: ''
  };

  stats = {
    scanned: 0,
    openPorts: 0,
    vulnerabilities: 0,
    cameras: 0
  };

  private readonly IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  private scanSubscription?: Subscription;
  private cancelSubject = new Subject<boolean>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Initialize component
  }

  ngOnDestroy(): void {
    this.cancelScan();
  }

  onInputChange(): void {
    const trimmed = this.searchQuery.trim();

    if (!trimmed) {
      this.isValidIP = true;
      this.errorMessage = '';
      return;
    }

    if (!this.IP_REGEX.test(trimmed)) {
      this.isValidIP = false;
      this.errorMessage = 'Invalid IP format';
    } else {
      this.isValidIP = true;
      this.errorMessage = '';
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isValidIP = true;
    this.errorMessage = '';
  }

  onSearch(): void {
    const ip = this.searchQuery.trim();

    if (!ip) {
      this.errorMessage = 'Please enter an IP address';
      this.isValidIP = false;
      return;
    }

    if (!this.IP_REGEX.test(ip)) {
      this.errorMessage = 'Invalid IP format';
      this.isValidIP = false;
      return;
    }

    this.isValidIP = true;
    this.errorMessage = '';
    this.loading = true;
    this.expandedRows.clear();
    this.scanResults = null;
    this.scanProgress = { percent: 0, status: '', message: 'Initializing scan...' };

    this.cancelScan();
    this.scanSubscription = this.scanIP(ip);
  }

  scanIP(ip: string): Subscription {
    const call = () => this.http.post<ScanResponse>('api/scan', { ip });

    const getStatus = (res: ScanResponse) => (res?.result?.status || res?.status) as any;

    const enhanced = (res: ScanResponse) => {
      const progress = (res as any)?.progress || res?.result?.progress;
      if (progress != null && typeof progress === 'number') {
        this.scanProgress.percent = Math.min(99, progress);
        this.updateProgressMessage(progress);
      }

      if (res.status === 'success' && res.results && res.results.length > 0) {
        this.scanResults = res.results[0];
        this.updateStats(this.scanResults);
        this.loading = false;
        this.scanProgress.percent = 100;
        this.scanProgress.status = 'done';
        this.scanProgress.message = 'Scan complete!';
      }
    };

    const build = (cancel$: Subject<boolean>) =>
      this.poll<ScanResponse>(call, getStatus, enhanced, cancel$, 2000);

    return this.runTask<ScanResponse>(build);
  }

  private poll<T>(
    call: () => any,
    getStatus: (res: T) => string,
    enhanced: (res: T) => void,
    cancel$: Subject<boolean>,
    interval: number = 2000
  ): Subscription {
    const poll$ = new Subject<T>();

    const doPoll = () => {
      call().subscribe({
        next: (response: T) => {
          enhanced(response);
          const status = getStatus(response);

          if (status === 'success' || status === 'completed' || status === 'done') {
            poll$.next(response);
            poll$.complete();
          } else if (status === 'error' || status === 'failed') {
            poll$.error(new Error('Scan failed'));
          } else {
            setTimeout(() => doPoll(), interval);
          }
        },
        error: (error: any) => {
          poll$.error(error);
        }
      });
    };

    doPoll();

    cancel$.subscribe(() => {
      poll$.complete();
    });

    return poll$.subscribe({
      error: (error: any) => {
        console.error('Scan error:', error);
        this.errorMessage = 'Scan failed. Please try again.';
        this.isValidIP = false;
        this.loading = false;
      }
    });
  }

  private runTask<T>(
    build: (cancel$: Subject<boolean>) => Subscription
  ): Subscription {
    this.cancelSubject = new Subject<boolean>();
    return build(this.cancelSubject);
  }

  private cancelScan(): void {
    if (this.scanSubscription) {
      this.cancelSubject.next(true);
      this.scanSubscription.unsubscribe();
    }
  }

  private updateProgressMessage(percent: number): void {
    const statusMap: { [key: number]: { status: string; message: string } } = {
      5: { status: 'queued', message: 'Initializing scan...' },
      10: { status: 'resolving_ip', message: 'Resolving IP information...' },
      30: { status: 'analyzing_services', message: 'Analyzing services...' },
      40: { status: 'scanning_ports', message: 'Scanning ports...' },
      80: { status: 'filtering_results', message: 'Filtering results...' },
      90: { status: 'aggregating_results', message: 'Aggregating data...' }
    };

    const nearestKey = Object.keys(statusMap)
      .map(Number)
      .reduce((prev, curr) =>
        Math.abs(curr - percent) < Math.abs(prev - percent) ? curr : prev
      );

    const status = statusMap[nearestKey];
    if (status) {
      this.scanProgress.status = status.status;
      this.scanProgress.message = status.message;
    }
  }

  private updateStats(result: ScanResult): void {
    this.stats.scanned = 1;
    this.stats.openPorts = result.open_ports?.length || 0;
    this.stats.vulnerabilities = result.vulnerabilities?.length || 0;
    this.stats.cameras = result.cameras?.length || 0;
  }

  toggleRow(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  getRiskBadge(port: PortInfo): { class: string; label: string } {
    const risks = port.risk_flags || [];

    if (risks.includes('exposed_camera') || risks.includes('exposed_admin_or_db_port')) {
      return { class: 'scanner-badge--high', label: 'High' };
    }
    if (risks.includes('weak_cipher_algorithm') || risks.includes('obsolete_tls_version')) {
      return { class: 'scanner-badge--medium', label: 'Medium' };
    }
    if (risks.includes('strong_tls') || risks.includes('modern_tls')) {
      return { class: 'scanner-badge--low', label: 'Low' };
    }
    return { class: 'scanner-badge--info', label: 'Info' };
  }

  truncate(text: string | undefined, maxLength: number): string {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  refreshScan(): void {
    if (this.searchQuery.trim()) {
      this.onSearch();
    }
  }

  exportResults(): void {
    if (!this.scanResults) return;

    const dataStr = JSON.stringify(
      {
        status: 'success',
        count: 1,
        results: [this.scanResults]
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${this.searchQuery.trim()}-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  get hasResults(): boolean {
    return this.scanResults !== null && this.scanResults.ports.length > 0;
  }

  get showClearButton(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  get showProgress(): boolean {
    return this.loading;
  }

  get showEmptyState(): boolean {
    return !this.loading && !this.hasResults;
  }

  get showResults(): boolean {
    return !this.loading && this.hasResults;
  }

  hasExpandedContent(port: PortInfo): boolean {
    return !!(port.tls || port.ssh_fingerprint || port.camera || port.banner || port.cpe ||
              (port.misconfigurations && port.misconfigurations.length > 0));
  }
}
