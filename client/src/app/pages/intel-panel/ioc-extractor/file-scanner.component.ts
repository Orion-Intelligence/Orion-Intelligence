import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { NgxPrintModule } from 'ngx-print';
import { FormsModule } from '@angular/forms';
import { finalize, expand, switchMap, takeWhile } from 'rxjs/operators';
import { EMPTY, timer } from 'rxjs';
import { IocExtractionResult, IocItem, GroupedIoc, ApkScanResult, SummaryItem } from '../../../shared/model/ioc-extractor/ioc.extractor.model';
import { ApiService } from '../../../shared/services/api.service';
import { ALLOWED_FILE_TYPES, APK_SCAN_ENDPOINT, IOC_EXTRACT_ENDPOINT, IOC_LABELS, MAX_FILE_SIZE_APK, MAX_FILE_SIZE_IOC } from './file-scanner.constants';
@Component({
  selector: 'app-ioc-extractor',
  standalone: true,
  imports: [
    CommonModule,
    NgxPrintModule,
    NgOptimizedImage,
    TooltipDirective,
    FormsModule,
  ],
  templateUrl: './file-scanner.component.html',
  animations: [fadeInDashboardItem],
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class FileScannerComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  type = 'filescan';
  title = 'File Analysis';
  description = 'Upload a file to extract Indicators of Compromise (IOCs) or analyze APK';
  accept = '.pdf,.txt,.png,.jpg,.jpeg';
  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';
  isLoading = false;
  isFetched = false;
  hasError = false;
  errorMessage = '';
  isUnsupportedFileError = false;
  isFileSizeError = false;
  extractionResult: IocExtractionResult | null = null;
  apkResult: any = null;
  groupedIocs: GroupedIoc[] = [];
  progress = signal(0);
  currentStep = '';
  isScrolled = signal(false);
  copiedValue = signal<string | null>(null);
  trackByCategory = (_: number, c: any) => c.name;
  trackByItem = (i: number) => i;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {
    this.route.data.subscribe(data => {
      this.type = data['type'] ?? this.type;
      this.title = data['title'] ?? this.title;
      this.description = data['description'] ?? this.description;
      this.accept = this.type === 'apk' ? '.apk' : '.pdf,.txt,.png,.jpg,.jpeg';
    });
  }

  onWindowScroll(): void {
    const scrolled = window.scrollY > 10;
    if (scrolled !== this.isScrolled()) {
      this.isScrolled.set(scrolled);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.handleFileSelect(target.files[0]);
    }
  }

  private isFileTypeAllowed(file: File): boolean {
    const name = file.name.toLowerCase().trim();
    const mime = (file.type || '').toLowerCase();
    const isApk = name.endsWith('.apk') || mime === 'application/vnd.android.package-archive';
    if (this.type === 'apk') {
      return isApk;
    }
    if (isApk) {
      return false;
    }
    return Object.keys(ALLOWED_FILE_TYPES).includes(mime) ||
          Object.values(ALLOWED_FILE_TYPES).flat().some(ext => name.endsWith(ext));
  }

  handleFileSelect(file: File): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isUnsupportedFileError = false;
    this.isFileSizeError = false;
    const modeIsApk = this.type === 'apk';
    if (!this.isFileTypeAllowed(file)) {
      this.hasError = true;
      this.isUnsupportedFileError = true;
      this.errorMessage = `Unsupported file format: ${file.name}`;
      this.resetFileInput();
      this.isFetched = true;
      return;
    }
    const maxSize = modeIsApk ? MAX_FILE_SIZE_APK : MAX_FILE_SIZE_IOC;
    if (file.size > maxSize) {
      this.hasError = true;
      this.isFileSizeError = true;
      this.errorMessage = `File size exceeds ${modeIsApk ? '30MB' : '1MB'}. Your file is ${this.formatFileSize(file.size)}.`;
      this.resetFileInput();
      this.isFetched = true;
      return;
    }
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { file: encodeURIComponent(file.name) },
      queryParamsHandling: 'merge'
    }).catch(() => { });
    this.scanFile(modeIsApk);
  }

  private scanFile(isApk: boolean): void {
    if (!this.selectedFile) {
      this.hasError = true;
      this.errorMessage = 'Please select a file to upload.';
      this.isFetched = true;
      return;
    }
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const endpoint = isApk ? APK_SCAN_ENDPOINT : IOC_EXTRACT_ENDPOINT;
    this.isLoading = true;
    this.isFetched = false;
    this.hasError = false;
    this.errorMessage = '';
    this.extractionResult = null;
    this.apkResult = null;
    this.groupedIocs = [];
    this.progress.set(0);
    this.currentStep = isApk ? 'Analyzing APK...' : 'Uploading file...';
    this.api
      .post<any>(endpoint, formData)
      .pipe(expand(res => (res?.status === 'pending' || res?.status === 'processing')
        ? timer(3000).pipe(switchMap(() => this.api.post<any>(endpoint, formData)))
        : EMPTY), takeWhile(res => res?.status === 'pending' || res?.status === 'processing', true), finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          if (res?.status === 'pending' || res?.status === 'processing') {
            const p = res?.progress ?? res?.result?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) {
              this.progress.set(p);
            }
            const st = res?.step ?? res?.result?.step;
            if (typeof st === 'string' && st) {
              this.currentStep = st;
            }
            return;
          }
          this.isFetched = true;
          this.progress.set(100);
          if (!res?.result) {
            this.hasError = true;
            this.errorMessage = 'No valid result received from server.';
            return;
          }
          if (isApk) {
            this.apkResult = res.result;
            this.groupedIocs = this.processApkToIocFormat(res.result);
          }
          else {
            this.extractionResult = res.result;
            this.processIocs(res.result.iocs || []);
          }
        },
        error: err => {
          this.isFetched = true;
          this.hasError = true;
          this.handleError(err);
        }
      });
  }

  private processApkToIocFormat(apk: ApkScanResult): GroupedIoc[] {
    const categorized = new Map<string, {
          key: string;
          items: any[];
      }>();
    if (apk.network?.sample_urls?.length > 0) {
      const key = 'm_url';
      if (!categorized.has(key)) {
        categorized.set(key, { key, items: [] });
      }
      apk.network.sample_urls.forEach(url => {
              categorized.get(key)!.items.push({
                type: key,
                value: url,
                display: url,
                description: IOC_LABELS[key]?.description || 'URL found in APK'
              });
      });
    }
    if (apk.permissions?.dangerous_list?.length > 0) {
      const key = 'm_permission';
      if (!categorized.has(key)) {
        categorized.set(key, { key, items: [] });
      }
      apk.permissions.dangerous_list.forEach(perm => {
              categorized.get(key)!.items.push({
                type: key,
                value: perm,
                display: perm,
                description: IOC_LABELS[key]?.description || 'Dangerous permission'
              });
      });
    }
    if (apk.tampering?.suspected && apk.tampering.reasons?.length > 0) {
      const key = 'm_tampering';
      if (!categorized.has(key)) {
        categorized.set(key, { key, items: [] });
      }
      apk.tampering.reasons.forEach(reason => {
              categorized.get(key)!.items.push({
                type: key,
                value: reason,
                display: reason,
                description: IOC_LABELS[key]?.description || 'Tampering indicator'
              });
      });
    }
    if (apk.package) {
      const key = 'm_package';
      this.appendCategorizedItem(categorized, key, apk.package, 'Package name');
    }
    return this.buildGroupedIocs(categorized);
  }

  private processIocs(iocs: IocItem[]): void {
    const categorized = new Map<string, {
          key: string;
          items: any[];
      }>();
    iocs.forEach(ioc => {
      Object.entries(ioc).forEach(([key, value]) => {
        this.appendCategorizedItem(categorized, key, value, 'Detected indicator');
      });
    });
    this.groupedIocs = this.buildGroupedIocs(categorized);
  }

  private appendCategorizedItem( categorized: Map<string, { key: string; items: any[] }>, key: string, value: any, fallbackDescription: string ): void {
    if (!categorized.has(key)) {
      categorized.set(key, { key, items: [] });
    }
      categorized.get(key)!.items.push({
        type: key,
        value,
        display: value,
        description: IOC_LABELS[key]?.description || fallbackDescription
      });
  }

  private buildGroupedIocs( categorized: Map<string, { key: string; items: any[]; }> ): GroupedIoc[] {
    return Array.from(categorized.entries())
      .map(([_, meta]) => {
        const uniqueItems = meta.items.filter((item, index, self) => index === self.findIndex(t => t.value === item.value));
        return {
          name: IOC_LABELS[meta.key]?.label || this.formatIocType(meta.key),
          total: uniqueItems.length,
          items: uniqueItems,
        };
      })
      .filter(c => c.items.length > 0);
  }

  private formatIocType(key: string): string {
    return key
      .replace(/^m_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private handleError(err: any): void {
    const status = err?.status;
    switch (status) {
      case 413:
        this.errorMessage = 'File too large.';
        this.isFileSizeError = true;
        break;
      default:
        this.errorMessage = err?.error?.detail || err?.message || 'Upload failed.';
    }
  }

  exportReport(): void {
    if (!this.extractionResult && !this.apkResult) {
      return;
    }
    const payload = this.apkResult
      ? { ...this.apkResult, scan_mode: 'apk', exported_at: new Date().toISOString() }
      : {
        file_info: {
          original_filename: this.extractionResult!.original_filename,
          file_type: this.extractionResult!.file_type,
          extracted_text_length: this.extractionResult!.extracted_text_length,
          status: this.extractionResult!.status
        },
        total_iocs: this.getTotalIocCount(),
        ioc_categories: this.groupedIocs.map(cat => ({
          category: cat.name,
          count: cat.total,
          items: cat.items.map(item => item.value)
        })),
        raw_iocs: this.extractionResult!.iocs
      };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const filenameBase = (this.apkResult?.original_filename || this.extractionResult?.original_filename || 'report')
      .replace(/[^a-z0-9.-]/gi, '_');
    const mode = this.apkResult ? 'apk' : 'ioc';
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `${filenameBase}-${mode}-report-${dt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
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
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatNumber(num: number): string {
    return num?.toLocaleString() || '0';
  }

  getTotalIocCount(): number {
    return this.groupedIocs.reduce((sum, cat) => sum + cat.total, 0);
  }

  getSummaryStats(): SummaryItem[] {
    const fileName = this.extractionResult?.original_filename || this.apkResult?.original_filename || this.fileName || '-';
    const fileType = this.apkResult ? 'APK' : (this.extractionResult?.file_type || 'Unknown').toUpperCase();
    const status = this.extractionResult?.status || this.apkResult?.status || 'completed';
    const textLength = this.extractionResult?.extracted_text_length || 0;
    const stats: SummaryItem[] = [
      { label: 'Filename', value: fileName },
      { label: 'File Type', value: fileType },
      { label: 'Total Findings', value: this.getTotalIocCount().toString() },
      { label: 'Status', value: status }
    ];
    if (this.extractionResult && !this.apkResult) {
      stats.splice(2, 0, {
        label: 'Extracted Text',
        value: `${this.formatNumber(textLength)} chars`
      });
    }
    return stats;
  }

  copyValue(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.copiedValue.set(value);
      setTimeout(() => this.copiedValue.set(null), 1500);
    });
  }
}
