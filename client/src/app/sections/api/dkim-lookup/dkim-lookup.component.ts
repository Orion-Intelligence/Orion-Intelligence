import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';

@Component({
  selector: 'app-dkim-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dkim-lookup.component.html',
  styleUrls: ['./dkim-lookup.component.css']
})
export class DkimLookupComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pollTimers = new Set<ReturnType<typeof setTimeout>>();

  activeTab: 'domain' | 'raw' = 'domain';
  domain: string = '';
  selector: string = '';
  loading: boolean = false;
  discovering: boolean = false;
  queryTriggered: boolean = false;
  result: any = null;
  errorMessage: string = '';
  discoveredSelectors: string[] = [];
  rawEmailText: string = '';
  rawLoading: boolean = false;
  rawResult: any = null;
  rawErrorMessage: string = '';

  constructor(private api: ApiService) {
    this.destroyRef.onDestroy(() => {
      this.pollTimers.forEach(timer => {
        clearTimeout(timer);
      });
    });
  }

  private schedulePoll(callback: () => void): void {
    const timer = setTimeout(() => {
      this.pollTimers.delete(timer);
      callback();
    }, 2000);
    this.pollTimers.add(timer);
  }

  resetDomainResults(): void {
    this.result = null;
    this.discoveredSelectors = [];
    this.errorMessage = '';
  }

  statusTone(status?: string): 'neutral' | 'negative' {
    return status && /fail|invalid|error|no .* record/i.test(status) ? 'negative' : 'neutral';
  }

  switchTab(tab: 'domain' | 'raw'): void {

    this.activeTab = tab;

    this.errorMessage = '';
    this.rawErrorMessage = '';
  }

  discoverSelectors(isPoll: boolean = false): void {
    if (!isPoll && (this.loading || this.discovering)) {
      return;
    }

    if (!isPoll) {

      if (!this.domain.trim()) {

        this.errorMessage =
            'Please enter a Domain to find selectors.';

        return;
      }

      this.discovering = true;
      this.errorMessage = '';
      this.discoveredSelectors = [];
      this.result = null;
    }

    const payload = {

      text: {

        domain: this.domain.trim(),

        selector: ''

      }

    };

    this.api.post('dkim/check',
      payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({

      next: (res: any) => {

        if (
          res &&
            res.status === 'pending'
        ) {

          this.schedulePoll(() => {

            this.discoverSelectors(true);

          });

          return;
        }

        this.discovering = false;

        const data =
            res?.result ??
            res;

        if (
          data &&
            data.status === 'success' &&
            data.selectors
        ) {

          this.discoveredSelectors =
              data.selectors;

          if (
            this.discoveredSelectors.length === 0
          ) {

            this.errorMessage =
                'No historical selectors found for this domain.';
          }

          return;
        }

        this.errorMessage =
            data?.error_message ??
            'Failed to discover selectors.';
      },

      error: (err: any) => {

        this.discovering = false;

        this.errorMessage =
            err?.error?.detail ??
            err?.error?.error_message ??
            'An error occurred while finding selectors.';
      }

    });
  }

  selectSelector(sel: string): void {

    this.selector = sel;
    this.result = null;
  }

  analyzeText( event?: Event, isPoll: boolean = false ): void {
    if (!isPoll && (this.loading || this.discovering)) {
      return;
    }

    if (event) {
      event.preventDefault();
    }

    if (!isPoll) {

      if (
        !this.domain.trim() ||
          !this.selector.trim()
      ) {

        this.errorMessage =
            'Please enter both Domain and Selector.';

        return;
      }

      this.loading = true;
      this.queryTriggered = true;

      this.result = null;
      this.errorMessage = '';
    }

    const payload = {

      text: {

        domain: this.domain.trim(),

        selector: this.selector.trim()

      }

    };

    this.api.post('dkim/check',
      payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({

      next: (res: any) => {

        if (
          res &&
            res.status === 'pending'
        ) {

          this.schedulePoll(() => {

            this.analyzeText(undefined,
              true);

          });

          return;
        }

        this.loading = false;

        const data =
            res?.result ??
            res;

        if (
          data &&
            data.status === 'success'
        ) {

          this.result = data;

          return;
        }

        this.errorMessage =
            data?.error_message ??
            'No valid DKIM record found.';
      },

      error: (err: any) => {

        this.loading = false;

        this.errorMessage =
            err?.error?.detail ??
            err?.error?.error_message ??
            'An error occurred while fetching DKIM record.';
      }

    });
  }

  analyzeRawEmail( event?: Event, isPoll: boolean = false ): void {
    if (!isPoll && this.rawLoading) {
      return;
    }

    if (event) {
      event.preventDefault();
    }

    if (!isPoll) {

      if (!this.rawEmailText.trim()) {

        this.rawErrorMessage =
            'Please paste raw email headers/content.';

        return;
      }

      this.rawLoading = true;
      this.rawResult = null;
      this.rawErrorMessage = '';
    }

    const payload = {

      text: {

        raw_email:
            this.rawEmailText.trim()

      }

    };

    this.api.post('dkim/check',
      payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({

      next: (res: any) => {





        if (
          res &&
            res.status === 'pending'
        ) {

          this.schedulePoll(() => {

            this.analyzeRawEmail(undefined,
              true);

          });

          return;
        }

        const jobResult =
            res?.result ??
            res;

        this.rawResult =
            jobResult?.data ??
            jobResult?.result ??
            jobResult;

        if (
          !this.rawResult ||
            (
              !this.rawResult.dkim &&
              !this.rawResult.spf &&
              !this.rawResult.dmarc
            )
        ) {

          this.rawErrorMessage =
              this.rawResult?.error_message ?? 'Failed to parse raw email forensics data.';
          this.rawResult = null;

          this.rawLoading = false;

          return;
        }

        this.rawLoading = false;
      },

      error: (err: any) => {



        this.rawLoading = false;

        this.rawErrorMessage =
            err?.error?.detail ??
            err?.error?.error_message ??
            'An error occurred during forensics analysis.';
      }

    });
  }
}
