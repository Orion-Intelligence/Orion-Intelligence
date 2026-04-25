import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMPTY, timer } from 'rxjs';
import { expand, finalize, switchMap, takeWhile } from 'rxjs/operators';
import { NgxPrintModule } from 'ngx-print';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ApiService } from '../../../shared/services/api.service';
import { APK_SCAN_ENDPOINT, IOC_EXTRACT_ENDPOINT, MAX_FILE_SIZE_APK } from './file-scanner.constants';

type ScannerResultItem = { label: string; value: string };
type ScannerResultSection = { title: string; items: ScannerResultItem[] };

@Component({
  selector: 'app-ioc-extractor',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    NgxPrintModule,
    NgOptimizedImage,
    TooltipDirective,
    FormsModule,
  ],
  templateUrl: './file-scanner.component.html'
})
export class FileScannerComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  type = 'filescan';
  title = 'File Analysis';
  description = 'Upload a file to extract Indicators of Compromise (IOCs) or analyze APK';
  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';
  isLoading = false;
  isFetched = false;
  hasError = false;
  errorMessage = '';
  isFileSizeError = false;
  scanResult: Record<string, any> | null = null;
  resultSections: ScannerResultSection[] = [];
  progress = signal(0);
  currentStep = '';
  copiedValue = signal<string | null>(null);

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {
    this.route.data.subscribe(data => {
      this.type = data['type'] ?? this.type;
      this.title = data['title'] ?? this.title;
      this.description = data['description'] ?? this.description;
    });
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files?.[0]) {
      this.handleFileSelect(inputElement.files[0]);
    }
  }

  handleFileSelect(file: File): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isFileSizeError = false;

    if (file.size > MAX_FILE_SIZE_APK) {
      this.hasError = true;
      this.isFileSizeError = true;
      this.errorMessage = `File size exceeds 30MB. Your file is ${this.formatFileSize(file.size)}.`;
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
    }).catch(() => void 0);
    this.scanFile(this.type === 'apk');
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
    this.resetResultState();
    this.isLoading = true;
    this.currentStep = isApk ? 'Analyzing APK...' : 'Uploading file...';

    const upload = () => this.api.post<any>(endpoint, formData);
    upload()
      .pipe(expand(res => (res?.status === 'pending' || res?.status === 'processing')
        ? timer(3000).pipe(switchMap(() => upload()))
        : EMPTY), takeWhile(res => res?.status === 'pending' || res?.status === 'processing', true), finalize(() => this.isLoading = false))
      .subscribe({
        next: res => this.handleScanResponse(res),
        error: err => {
          this.isFetched = true;
          this.hasError = true;
          this.handleError(err);
        }
      });
  }

  private handleScanResponse(res: any): void {
    if (res?.status === 'pending' || res?.status === 'processing') {
      const p = res?.progress ?? res?.result?.progress;
      if (typeof p === 'number' && Number.isFinite(p)) {
        this.progress.set(Math.max(0, Math.min(100, Math.round(p))));
      }
      const step = res?.step ?? res?.result?.step;
      if (typeof step === 'string' && step) {
        this.currentStep = step;
      }
      return;
    }

    this.isFetched = true;
    this.progress.set(100);
    if (res?.result == null) {
      this.hasError = true;
      this.errorMessage = 'No valid result received from server.';
      return;
    }
    this.applyServerResult(res.result);
  }

  private applyServerResult(result: unknown): void {
    const record = this.toRecord(result);
    this.scanResult = record || { value: result };
    this.resultSections = this.buildResultSections(result);
  }

  private resetResultState(): void {
    this.isFetched = false;
    this.hasError = false;
    this.errorMessage = '';
    this.isFileSizeError = false;
    this.scanResult = null;
    this.resultSections = [];
    this.progress.set(0);
    this.currentStep = '';
  }

  private buildResultSections(result: unknown): ScannerResultSection[] {
    const record = this.toRecord(result);
    if (!record) {
      return this.isVisible(result)
        ? [{ title: 'Result', items: [{ label: 'Value', value: this.stringifyValue(result) }] }]
        : [];
    }

    return Object.entries(record)
      .filter(([key, value]) => key !== 'type' && this.isVisible(value))
      .map(([key, value]) => ({
        title: this.formatLabelKey(key),
        items: this.flattenValue(value)
      }))
      .filter(section => section.items.length > 0);
  }

  private flattenValue(value: unknown, path: string[] = []): ScannerResultItem[] {
    if (!this.isVisible(value)) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => this.flattenValue(item, path.length ? path : [`Item ${index + 1}`]));
    }

    const record = this.toRecord(value);
    if (!record) {
      return [{
        label: this.formatLabelKey(path[path.length - 1] || 'Value'),
        value: this.stringifyValue(value)
      }];
    }

    return Object.entries(record)
      .flatMap(([key, child]) => this.flattenValue(child, [...path, key]))
      .filter((item, index, items) => index === items.findIndex(match => match.label === item.label && match.value === item.value));
  }

  exportReport(): void {
    if (!this.scanResult) {
      return;
    }
    const blob = new Blob([JSON.stringify({ ...this.scanResult, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const filenameBase = (this.getDisplayFileName() || 'report').replace(/[^a-z0-9.-]/gi, '_');
    const mode = this.getDisplayFileType().toLowerCase() || 'file';
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `${filenameBase}-${mode}-report-${dt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement?.click();
  }

  closeError(): void {
    this.hasError = false;
    this.errorMessage = '';
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

  private handleError(err: any): void {
    if (err?.status === 413) {
      this.errorMessage = `File size exceeds 30MB${this.fileSize ? `. Your file is ${this.fileSize}.` : '.'}`;
      this.isFileSizeError = true;
      return;
    }
    this.errorMessage = err?.error?.detail || err?.message || 'Upload failed.';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${Math.round((bytes / Math.pow(k, index)) * 100) / 100} ${sizes[index]}`;
  }

  isLastSectionRow(section: ScannerResultSection, index: number): boolean {
    const count = section.items.length;
    return index === count - 1 || (index === count - 2 && count % 2 === 0);
  }

  getDisplayFileName(): string {
    return this.getFirstString([
      this.scanResult?.['metadata']?.file_name,
      this.scanResult?.['metadata']?.metadata?.resourceName,
      this.scanResult?.['ioc']?.filename,
      this.scanResult?.['antivirus']?.file_name,
      this.scanResult?.['original_filename'],
      this.fileName
    ]) || 'file';
  }

  getDisplayFileType(): string {
    return this.getFirstString([
      this.scanResult?.['type'],
      this.scanResult?.['ioc']?.file_type
    ]) || 'file';
  }

  getDisplayMetricValue(): string {
    return this.resultSections.reduce((sum, section) => sum + section.items.length, 0).toLocaleString();
  }

  private formatLabelKey(key: string): string {
    return key
      .replace(/^m_/, '')
      .replace(/[:._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Value';
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value
        .filter(item => this.isVisible(item))
        .map(item => this.stringifyValue(item))
        .join(', ');
    }
    if (this.toRecord(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private getFirstString(values: unknown[]): string {
    const found = values.find(value => this.isVisible(value));
    if (Array.isArray(found)) {
      return this.stringifyValue(found[0]);
    }
    return found == null ? '' : String(found);
  }

  private toRecord(value: unknown): Record<string, any> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, any>
      : null;
  }

  private isVisible(value: unknown): boolean {
    if (value == null) {
      return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized !== '' && normalized !== 'null' && normalized !== 'undefined' && normalized !== 'not available';
    }
    if (Array.isArray(value)) {
      return value.some(item => this.isVisible(item));
    }
    const record = this.toRecord(value);
    if (record) {
      return Object.values(record).some(item => this.isVisible(item));
    }
    return true;
  }

  copyValue(value: string): void {
    void navigator.clipboard.writeText(value).then(() => {
      this.copiedValue.set(value);
      setTimeout(() => this.copiedValue.set(null), 1500);
    });
  }
}
