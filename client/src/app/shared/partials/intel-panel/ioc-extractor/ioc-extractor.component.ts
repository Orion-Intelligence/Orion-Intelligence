import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { CodeBlockComponent } from '../../code-block/code-block.component';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { NgxPrintModule } from 'ngx-print';
import { FormsModule } from '@angular/forms';
import { EmptyQueryComponent } from '../../empty-query/empty-query.component';
import { finalize, expand, switchMap, takeWhile } from 'rxjs/operators';
import { EMPTY, timer } from 'rxjs';
import {
  IocExtractionResult,
  IocItem,
  GroupedIoc,
  IocExtractResponse
} from '../../../model/ioc-extractor/ioc.extractor.model';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-ioc-extractor',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent,
    NgxPrintModule,
    NgOptimizedImage,
    TooltipDirective,
    FormsModule,
    EmptyQueryComponent
  ],
  templateUrl: './ioc-extractor.component.html',
  styleUrls: ['./ioc-extractor.component.css'],
  animations: [fadeInDashboardItem]
})
export class IocExtractorComponent {
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
  skeletonCards = Array.from({ length: 3 });
  progress = signal(0);
  currentStep = '';

  private readonly IOC_EXTRACT_ENDPOINT = 'ioc/extract';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  private readonly ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg']
  };

  private readonly IOC_LABELS: { [key: string]: { label: string; description: string } } = {
    m_domain: { label: 'Domain', description: 'Domain name detected in the file' },
    m_email: { label: 'Email Address', description: 'Email address found in the document' },
    m_phone_number: { label: 'Phone Number', description: 'Phone number extracted from content' },
    m_country: { label: 'Country', description: 'Country name mentioned' },
    m_location: { label: 'Location', description: 'Geographic location reference' },
    m_uk_nhs: { label: 'UK NHS Number', description: 'UK National Health Service identifier' },
    m_us_driver_license: { label: 'US Driver License', description: 'US driver license identifier' },
    m_username: { label: 'Username', description: 'Username or handle detected' },
    m_language: { label: 'Language', description: 'Language code identified' },
    m_ip: { label: 'IP Address', description: 'IP address found in content' },
    m_url: { label: 'URL', description: 'Web URL extracted' },
    m_hash: { label: 'Hash', description: 'File hash or cryptographic hash' },
    m_ssn: { label: 'SSN', description: 'Social Security Number' },
    m_credit_card: { label: 'Credit Card', description: 'Credit card number' }
  };

  constructor(private api: ApiService) {}

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.handleFileSelect(target.files[0]);
    }
  }

  private isFileTypeAllowed(file: File): boolean {
    const mimeType = (file.type || '').toLowerCase();
    if (Object.keys(this.ALLOWED_FILE_TYPES).includes(mimeType)) {
      return true;
    }
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
      this.errorMessage = `File size exceeds 10MB. Your file is ${this.formatFileSize(file.size)}.`;
      this.resetFileInput();
      this.isFetched = true;
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
  }

  removeFile(): void {
    this.resetFileInput();
    this.extractionResult = null;
    this.groupedIocs = [];
    this.hasError = false;
    this.errorMessage = '';
    this.isUnsupportedFileError = false;
    this.isFileSizeError = false;
    this.isFetched = false;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onUploadSubmit(): void {
    if (this.selectedFile && !this.isLoading) {
      this.uploadFile();
    }
  }

  uploadFile(): void {
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
        expand(res => {
          const isProcessing =
            res?.status === 'pending' ||
            res?.status === 'processing' ||
            res?.result?.status === 'pending' ||
            res?.result?.status === 'processing';

          return isProcessing
            ? timer(3000).pipe(
                switchMap(() =>
                  this.api.post<IocExtractResponse>(this.IOC_EXTRACT_ENDPOINT, formData, { headers })
                )
              )
            : EMPTY;
        }),
        takeWhile(res => {
          const isProcessing =
            res?.status === 'pending' ||
            res?.status === 'processing' ||
            res?.result?.status === 'pending' ||
            res?.result?.status === 'processing';
          return isProcessing;
        }, true),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: res => {
          if (
            res?.status === 'pending' ||
            res?.status === 'processing' ||
            res?.result?.status === 'pending' ||
            res?.result?.status === 'processing'
          ) {
            this.progress.set(res?.progress ?? res?.result?.progress ?? 50);
            this.currentStep = res?.step ?? res?.result?.step ?? 'Processing...';
            return;
          }

          this.isFetched = true;
          this.progress.set(100);

          if (!res?.result) {
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
    const categorized = new Map<string, any[]>();

    iocs.forEach(ioc => {
      Object.entries(ioc).forEach(([key, value]) => {
        const category = this.IOC_LABELS[key]?.label || this.formatIocType(key);
        if (!categorized.has(category)) {
          categorized.set(category, []);
        }
        categorized.get(category)!.push({
          type: key,
          value,
          display: value,
          description: this.IOC_LABELS[key]?.description || 'Indicator of compromise detected'
        });
      });
    });

    this.groupedIocs = Array.from(categorized.entries())
      .map(([name, items]) => ({
        name,
        total: items.length,
        items: items.filter(
          (item, index, self) => index === self.findIndex(t => t.value === item.value)
        )
      }))
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
        this.errorMessage = 'File too large (max 10MB).';
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

    const blob = new Blob(
      [JSON.stringify(this.extractionResult, null, 2)],
      { type: 'application/json' }
    );

    const a = document.createElement('a');
    const filename =
      this.extractionResult.original_filename?.replace(/[^a-z0-9.-]/gi, '_') ||
      'ioc-extraction';

    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  retry(): void {
    this.removeFile();
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

  trackByCategory = (_: number, c: GroupedIoc) => c.name;
  trackByItem = (i: number) => i;
}
