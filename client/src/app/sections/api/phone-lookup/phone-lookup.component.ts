import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, timer } from 'rxjs';
import { expand, finalize, switchMap, takeWhile } from 'rxjs/operators';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ApiService } from '../../../shared/services/api.service';

@Component({
  selector: 'app-phone-lookup',
  standalone: true,
  imports: [FormsModule, NgClass, TranslatePipe],
  animations: [fadeInDashboardItem],
  templateUrl: './phone-lookup.component.html'
})
export class PhoneLookupComponent implements OnInit {
  query = '';
  loading = false;
  queryTriggered = false;
  errorMessage = '';
  result: any = null;
  progress = 0;
  currentStep = '';

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('q')?.trim();
    if (q) {
      this.query = q;
      this.analyzeText(null);
    }
  }

  analyzeText(event: Event | null): void {
    if (event) {
      event.preventDefault();
    }
    const value = this.query.trim();
    if (!value) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value },
      queryParamsHandling: 'merge',
      replaceUrl: true
    }).then();

    this.loading = true;
    this.queryTriggered = true;
    this.result = null;
    this.errorMessage = '';
    this.progress = 5;
    this.currentStep = 'Initializing scan...';

    const payload = { text: { query: value } };
    const scanReq = () => this.api.post<any>('phone/universal_search', payload);

    scanReq().pipe(expand(res => (res?.status === 'pending' || res?.status === 'processing' ? timer(3000).pipe(switchMap(() => scanReq())) : EMPTY)), takeWhile(res => res?.status === 'pending' || res?.status === 'processing', true), finalize(() => {
      this.loading = false;
    })).subscribe({
      next: res => {
        this.handleScanResponse(res);
      },
      error: err => {
        this.errorMessage = err?.error?.detail || err?.message || 'OSINT Analysis failed.';
      }
    });
  }

  private handleScanResponse(res: any): void {
    if (res?.status === 'pending' || res?.status === 'processing') {
      this.progress = res?.progress || 10;
      this.currentStep = res?.step?.replace(/_/g, ' ') || 'Extracting Intelligence...';
      return;
    }

    if (res?.status === 'error') {
      this.errorMessage = res.message || res.error_message || 'Scan failed to retrieve data.';
      return;
    }

    this.progress = 100;
    this.result = res?.result || res;
  }
}
