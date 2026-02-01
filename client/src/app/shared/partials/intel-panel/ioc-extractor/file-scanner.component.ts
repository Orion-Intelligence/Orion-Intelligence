import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { NgxPrintModule } from 'ngx-print';
import { FormsModule } from '@angular/forms';
import { finalize, expand, switchMap, takeWhile } from 'rxjs/operators';
import { EMPTY, timer } from 'rxjs';
import {
  IocExtractionResult,
  IocItem,
  GroupedIoc,
  IocExtractResponse
} from '../../../model/ioc-extractor/ioc.extractor.model';
import { ApiService } from '../../../services/api.service';

type UiStat = { icon: string; label: string; value: string; accent: string };

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
  styleUrls: ['./file-scanner.component.css'],
  animations: [fadeInDashboardItem],
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class FileScannerComponent {
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
  extractionResult: IocExtractionResult | null = null;
  groupedIocs: GroupedIoc[] = [];
  progress = signal(0);
  currentStep = '';

  isScrolled = signal(false);
  copiedValue = signal<string | null>(null);

  private readonly IOC_EXTRACT_ENDPOINT = 'ioc/extract';
  private readonly MAX_FILE_SIZE = 1024 * 1024;

  private readonly ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
  };

  private readonly IOC_LABELS: { [key: string]: { label: string; description: string; color?: string } } = {
    m_domain: { label: 'Domain', description: 'Domain name detected in the file', color: '#0EA5E9' },
    m_email: { label: 'Email Address', description: 'Email address found in the document', color: '#8B5CF6' },
    m_phone_number: { label: 'Phone Number', description: 'Phone number extracted from content', color: '#22C55E' },
    m_country: { label: 'Country', description: 'Country name mentioned', color: '#F97316' },
    m_location: { label: 'Location', description: 'Geographic location reference', color: '#6366F1' },
    m_uk_nhs: { label: 'UK NHS Number', description: 'UK National Health Service identifier', color: '#0EA5E9' },
    m_us_driver_license: { label: 'US Driver License', description: 'US driver license identifier', color: '#F97316' },
    m_username: { label: 'Username', description: 'Username or handle detected', color: '#8B5CF6' },
    m_language: { label: 'Language', description: 'Language code identified', color: '#22C55E' },
    m_ip: { label: 'IP Address', description: 'IP address found in content', color: '#0EA5E9' },
    m_url: { label: 'URL', description: 'Web URL extracted', color: '#6366F1' },
    m_hash: { label: 'Hash', description: 'File hash or cryptographic hash', color: '#EAB308' },
    m_ssn: { label: 'SSN', description: 'Social Security Number', color: '#F97316' },
    m_credit_card: { label: 'Credit Card', description: 'Credit card number', color: '#EF4444' }
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
      this.errorMessage = `File size exceeds 1MB. Your file is ${this.formatFileSize(file.size)}.`;
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
    }).catch(() => {});

    this.extractIocs();
  }

  private extractIocs(): void {
    if (!this.selectedFile) {
      this.hasError = true;
      this.errorMessage = 'Please select a file to upload.';
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
    this.extractionResult = null;
    this.groupedIocs = [];
    this.progress.set(0);
    this.currentStep = 'Uploading file...';

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
      .post<IocExtractResponse>(this.IOC_EXTRACT_ENDPOINT, formData, { headers })
      .pipe(
        expand(res =>
          (res?.status === 'pending' ||
           res?.status === 'processing' ||
           res?.result?.status === 'pending' ||
           res?.result?.status === 'processing')
            ? timer(3000).pipe(
                switchMap(() =>
                  this.api.post<IocExtractResponse>(this.IOC_EXTRACT_ENDPOINT, formData, { headers })
                )
              )
            : EMPTY
        ),
        takeWhile(
          res =>
            res?.status === 'pending' ||
            res?.status === 'processing' ||
            res?.result?.status === 'pending' ||
            res?.result?.status === 'processing',
          true
        ),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: IocExtractResponse) => {
          if (
            res?.status === 'pending' ||
            res?.status === 'processing' ||
            res?.result?.status === 'pending' ||
            res?.result?.status === 'processing'
          ) {
            const p = res?.progress ?? res?.result?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) this.progress.set(p);
            const st = res?.step ?? res?.result?.step;
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

          this.extractionResult = res.result;
          this.processIocs(res.result.iocs || []);
        },
        error: err => {
          this.isFetched = true;
          this.hasError = true;
          this.handleError(err);
        }
      });
  }

  private processIocs(iocs: IocItem[]): void {
    const categorized = new Map<string, { key: string; color: string; items: any[] }>();

    iocs.forEach(ioc => {
      Object.entries(ioc).forEach(([key, value]) => {
        const label = this.IOC_LABELS[key]?.label || this.formatIocType(key);
        const color = this.IOC_LABELS[key]?.color || '#0EA5E9';

        if (!categorized.has(label)) {
          categorized.set(label, { key, color, items: [] });
        }

        categorized.get(label)!.items.push({
          type: key,
          value,
          display: value,
          description: this.IOC_LABELS[key]?.description || 'Indicator of compromise detected'
        });
      });
    });

    this.groupedIocs = Array.from(categorized.entries())
      .map(([name, meta]) => ({
        name,
        total: meta.items.filter((item, index, self) => index === self.findIndex(t => t.value === item.value)).length,
        items: meta.items.filter((item, index, self) => index === self.findIndex(t => t.value === item.value)),
        color: meta.color
      }) as any)
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
      case 400:
        this.errorMessage = err?.error?.detail || 'Bad request.';
        break;
      case 413:
        this.errorMessage = 'File too large (max 1 MB).';
        this.isFileSizeError = true;
        break;
      case 504:
        this.errorMessage = 'Processing timeout.';
        break;
      case 500:
        this.errorMessage = err?.error?.detail || 'Server error.';
        break;
      default:
        this.errorMessage = err?.error?.detail || err?.message || 'Upload failed.';
    }
  }

  exportReport(): void {
    if (!this.extractionResult) return;

    const payload = {
      file_info: {
        original_filename: this.extractionResult.original_filename,
        file_type: this.extractionResult.file_type,
        extracted_text_length: this.extractionResult.extracted_text_length,
        status: this.extractionResult.status
      },
      total_iocs: this.getTotalIocCount(),
      ioc_categories: this.groupedIocs.map((cat: any) => ({
        category: cat.name,
        count: cat.total,
        items: cat.items.map((item: any) => item.value)
      })),
      raw_iocs: this.extractionResult.iocs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const filename =
      this.extractionResult.original_filename?.replace(/[^a-z0-9.-]/gi, '_') || 'ioc-extraction';
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    a.href = URL.createObjectURL(blob);
    a.download = `${filename}-ioc-report-${dt}.json`;
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatNumber(num: number): string {
    return num?.toLocaleString() || '0';
  }

  getTotalIocCount(): number {
    return this.extractionResult?.iocs?.length || 0;
  }

  getSummaryStats(): UiStat[] {
    if (!this.extractionResult) return [];
    const r = this.extractionResult;

    return [
      { icon: 'bi-file-earmark-text', label: 'Filename', value: r.original_filename || '-', accent: '#0EA5E9' },
      { icon: 'bi-code-slash', label: 'File Type', value: (r.file_type || '').toUpperCase(), accent: '#8B5CF6' },
      { icon: 'bi-body-text', label: 'Extracted Text', value: `${this.formatNumber(r.extracted_text_length)} chars`, accent: '#06B6D4' },
      { icon: 'bi-shield-exclamation', label: 'Total IOCs', value: `${this.getTotalIocCount()}`, accent: '#EAB308' },
      { icon: 'bi-check-circle', label: 'Status', value: r.status || '-', accent: '#22C55E' }
    ];
  }

  copyValue(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.copiedValue.set(value);
      setTimeout(() => this.copiedValue.set(null), 1500);
    });
  }

  trackByCategory = (_: number, c: any) => c.name;
  trackByItem = (i: number) => i;
}
