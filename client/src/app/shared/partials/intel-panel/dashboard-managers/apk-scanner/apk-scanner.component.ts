import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { TooltipDirective } from '../../../../directive/tooltip-directive.directive';
import { NgxPrintModule } from 'ngx-print';
import { FormsModule } from '@angular/forms';
import { EMPTY, timer } from 'rxjs';
import { expand, finalize, switchMap, takeWhile } from 'rxjs/operators';
import { ApiService } from '../../../../services/api.service';

type ApkScanResult = {
  package: string;
  version: string;
  sdk: {
    min: number;
    target: number;
  };
  signed: boolean;
  debuggable: boolean;
  certificate: {
    issuer: string;
    sha256: string;
  };
  permissions: {
    total: number;
    dangerous: number;
    dangerous_list: string[];
  };
  network: {
    urls_found: number;
    cleartext: boolean;
    sample_urls: string[];
  };
  crypto: {
    weak_algorithms: string[];
  };
  tampering: {
    suspected: boolean;
    reasons: string[];
  };
  status: string;
  original_filename: string;
};

type ApkScanResponse = {
  status?: string;
  progress?: number;
  step?: string;
  result?: ApkScanResult;
};

type VulnerabilityItem = {
  id: string;
  category: string;
  severity: string;
  description: string;
};

type GroupedVuln = {
  name: string;
  total: number;
  items: VulnerabilityItem[];
};

type UiStat = { icon: string; label: string; value: string; accent: string };

@Component({
  selector: 'app-apk-scanner',
  standalone: true,
  imports: [
    CommonModule,
    NgxPrintModule,
    NgOptimizedImage,
    TooltipDirective,
    FormsModule,
  ],
  templateUrl: './apk-scanner.component.html',
  styleUrls: ['./apk-scanner.component.css'],
  animations: [fadeInDashboardItem],
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class ApkScannerComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';
  isLoading = false;
  isFetched = false;
  hasError = false;
  errorMessage = '';
  isUnsupportedFileError = false;
  isFileSizeError = false;

  scanResult: ApkScanResult | null = null;
  groupedVulns: GroupedVuln[] = [];

  progress = signal(0);
  currentStep = '';
  isScrolled = signal(false);
  copiedValue = signal<string | null>(null);

  private readonly APK_SCAN_ENDPOINT = 'apk/scan';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  private readonly ALLOWED_FILE_TYPES = {
    'application/vnd.android.package-archive': ['.apk']
  };

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  onWindowScroll(): void {
    const scrolled = window.scrollY > 10;
    if (scrolled !== this.isScrolled()) this.isScrolled.set(scrolled);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.handleFileSelect(target.files[0]);
    }
  }

  private isFileTypeAllowed(file: File): boolean {
    const mimeType = (file.type || '').toLowerCase();
    if (Object.keys(this.ALLOWED_FILE_TYPES).includes(mimeType)) return true;

    const fileName = file.name.toLowerCase();
    const allowedExtensions = Object.values(this.ALLOWED_FILE_TYPES).flat();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
  }

  handleFileSelect(file: File): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isUnsupportedFileError = false;
    this.isFileSizeError = false;

    if (!this.isFileTypeAllowed(file)) {
      this.hasError = true;
      this.isUnsupportedFileError = true;
      this.errorMessage = `Unsupported file format: ${file.name}`;
      this.resetFileInput();
      this.isFetched = true;
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.hasError = true;
      this.isFileSizeError = true;
      this.errorMessage = `File size exceeds 50MB. Your file is ${this.formatFileSize(file.size)}.`;
      this.resetFileInput();
      this.isFetched = true;
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { apk: encodeURIComponent(file.name) },
      queryParamsHandling: 'merge'
    }).catch(() => {});

    this.scanApk();
  }

  private scanApk(): void {
    if (!this.selectedFile) {
      this.hasError = true;
      this.errorMessage = 'Please select an APK file to upload.';
      this.isFetched = true;
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isLoading = true;
    this.isFetched = false;
    this.hasError = false;
    this.errorMessage = '';
    this.isUnsupportedFileError = false;
    this.isFileSizeError = false;
    this.scanResult = null;
    this.groupedVulns = [];
    this.progress.set(0);
    this.currentStep = 'Uploading APK...';

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');

    if (!token) {
      this.hasError = true;
      this.errorMessage = 'Authentication token not found.';
      this.isLoading = false;
      this.isFetched = true;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` } as any;

    this.api
      .post<ApkScanResponse>(this.APK_SCAN_ENDPOINT, formData, { headers })
      .pipe(
        expand(res =>
          (res?.status === 'pending' || res?.status === 'processing')
            ? timer(3000).pipe(
                switchMap(() =>
                  this.api.post<ApkScanResponse>(this.APK_SCAN_ENDPOINT, formData, { headers })
                )
              )
            : EMPTY
        ),
        takeWhile(
          res => res?.status === 'pending' || res?.status === 'processing',
          true
        ),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: ApkScanResponse) => {
          if (res?.status === 'pending' || res?.status === 'processing') {
            const p = res?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) this.progress.set(p);
            const st = res?.step;
            if (typeof st === 'string' && st) this.currentStep = st;
            return;
          }

          this.isFetched = true;
          this.progress.set(100);

          const safe = !!(res && res.result);
          if (!safe) {
            this.hasError = true;
            this.errorMessage = 'No data received from server.';
            return;
          }

          this.scanResult = res.result!;
          this.processVulns();
        },
        error: err => {
          this.isFetched = true;
          this.hasError = true;
          this.handleError(err);
        }
      });
  }

  private processVulns(): void {
    if (!this.scanResult) {
      this.groupedVulns = [];
      return;
    }

    const vulns: VulnerabilityItem[] = [];

    if (this.scanResult.permissions.dangerous > 0) {
      this.scanResult.permissions.dangerous_list.forEach(perm => {
        vulns.push({
          id: `PERM-${perm}`,
          category: 'Permissions',
          severity: 'High',
          description: `Dangerous permission: ${perm}`
        });
      });
    }

    if (this.scanResult.crypto.weak_algorithms.length > 0) {
      this.scanResult.crypto.weak_algorithms.forEach(algo => {
        vulns.push({
          id: `CRYPTO-${algo}`,
          category: 'Cryptography',
          severity: 'Medium',
          description: `Weak cryptographic algorithm detected: ${algo}`
        });
      });
    }

    if (this.scanResult.network.cleartext) {
      vulns.push({
        id: 'NET-CLEARTEXT',
        category: 'Network Security',
        severity: 'Medium',
        description: 'Application allows cleartext (HTTP) traffic, which can be intercepted.'
      });
    }

    if (this.scanResult.network.sample_urls && this.scanResult.network.sample_urls.length > 0) {
      this.scanResult.network.sample_urls.forEach((url) => {
        vulns.push({
          id: url,
          category: 'Network Domains',
          severity: 'Info',
          description: `Embedded URL found in APK: ${url}`
        });
      });
    }

    if (this.scanResult.tampering.suspected) {
      this.scanResult.tampering.reasons.forEach((reason, idx) => {
        vulns.push({
          id: `TAMPER-${idx}`,
          category: 'Tampering',
          severity: 'High',
          description: reason
        });
      });
    }

    if (this.scanResult.debuggable) {
      vulns.push({
        id: 'DEBUG-ENABLED',
        category: 'Configuration',
        severity: 'High',
        description: 'Application is debuggable, allowing runtime inspection and modification.'
      });
    }

    const categoryMap = new Map<string, VulnerabilityItem[]>();
    vulns.forEach(v => {
      if (!categoryMap.has(v.category)) categoryMap.set(v.category, []);
      categoryMap.get(v.category)!.push(v);
    });

    this.groupedVulns = Array.from(categoryMap.entries())
      .map(([name, items]) => ({
        name,
        total: items.length,
        items
      }))
      .filter(group => group.items.length > 0);
  }

  private handleError(err: any): void {
    const status = err?.status;

    switch (status) {
      case 400:
        this.errorMessage = err?.error?.detail || 'Bad request.';
        break;
      case 413:
        this.errorMessage = 'APK too large (max 50 MB).';
        this.isFileSizeError = true;
        break;
      case 504:
        this.errorMessage = 'Analysis timeout.';
        break;
      case 500:
        this.errorMessage = err?.error?.detail || 'Server error.';
        break;
      default:
        this.errorMessage = err?.error?.detail || err?.message || 'Upload or analysis failed.';
    }
  }

  exportReport(): void {
    if (!this.scanResult) return;

    const payload = {
      apk_info: {
        package: this.scanResult.package,
        version: this.scanResult.version,
        sdk: this.scanResult.sdk,
        signed: this.scanResult.signed,
        debuggable: this.scanResult.debuggable,
        status: this.scanResult.status,
        original_filename: this.scanResult.original_filename,
        certificate: this.scanResult.certificate
      },
      permissions: {
        total: this.scanResult.permissions.total,
        dangerous: this.scanResult.permissions.dangerous,
        dangerous_list: this.scanResult.permissions.dangerous_list
      },
      network: {
        urls_found: this.scanResult.network.urls_found,
        cleartext: this.scanResult.network.cleartext,
        sample_urls: this.scanResult.network.sample_urls
      },
      crypto: this.scanResult.crypto,
      tampering: this.scanResult.tampering,
      total_vulnerabilities: this.getTotalVulnCount(),
      vulnerability_categories: this.groupedVulns.map(cat => ({
        category: cat.name,
        count: cat.total,
        items: cat.items.map(item => ({
          id: item.id,
          severity: item.severity,
          description: item.description
        }))
      })),
      raw_scan_result: this.scanResult
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const filename = (this.scanResult.package || 'apk-scan').replace(/[^a-z0-9.-]/gi, '_');
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    a.href = URL.createObjectURL(blob);
    a.download = `${filename}-vuln-report-${dt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('apkFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  closeError(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isUnsupportedFileError = false;
    this.isFileSizeError = false;
    this.isFetched = false;
  }

  private resetFileInput(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = '';
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getTotalVulnCount(): number {
    return this.groupedVulns.reduce((sum, group) => sum + group.total, 0);
  }

  getSummaryStats(): UiStat[] {
    if (!this.scanResult) return [];
    const r = this.scanResult;

    return [
      {
        icon: 'bi-box-seam',
        label: 'Package Name',
        value: r.package || '-',
        accent: '#0EA5E9'
      },
      {
        icon: 'bi-tag',
        label: 'Version',
        value: r.version || '-',
        accent: '#8B5CF6'
      },
      {
        icon: 'bi-phone',
        label: 'SDK Target',
        value: `${r.sdk?.target || '-'}`,
        accent: '#06B6D4'
      },

      {
        icon: 'bi-bug',
        label: 'Total Issues',
        value: `${this.getTotalVulnCount()}`,
        accent: '#EAB308'
      },
      {
        icon: 'bi-shield-lock',
        label: 'Signed',
        value: r.signed ? 'Yes' : 'No',
        accent: r.signed ? '#22C55E' : '#EF4444'
      }
    ];
  }

  copyValue(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.copiedValue.set(value);
      setTimeout(() => this.copiedValue.set(null), 1500);
    });
  }

  trackByCategory = (_: number, c: GroupedVuln) => c.name;
  trackByItem = (i: number) => i;
}
