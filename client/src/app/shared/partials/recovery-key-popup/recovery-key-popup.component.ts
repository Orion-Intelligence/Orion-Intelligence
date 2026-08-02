import { Component, HostListener, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-recovery-key-popup',
  imports: [TranslatePipe],
  template: `
    <div data-testid="recovery-key-popup-overlay" class="ui-graph-popup-overlay fixed inset-0 z-[1200] flex items-center justify-center p-4" (click)="close()">
      <section data-testid="recovery-key-popup" role="dialog" aria-modal="true" aria-labelledby="recovery-key-popup-title" class="ui-graph-popup-panel ui-popup-shell w-full max-w-[520px] overflow-hidden rounded-xl border border-[var(--color-border)] shadow-[0_30px_80px_rgba(2,6,23,0.65)]" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 id="recovery-key-popup-title" class="ui-popup-title text-[16px] font-semibold">{{ 'Recovery Key' | translate }}</h3>
            <p class="mt-0.5 text-[12px] leading-5 text-[var(--color-text4)]">{{ 'Save it now. It will not be shown again.' | translate }}</p>
          </div>
          <button type="button" class="ui-popup-close inline-flex h-9 w-9 shrink-0 items-center justify-center text-[18px]" [attr.aria-label]="'common.actions.close' | translate" (click)="close()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="px-5 py-5">
          <div class="break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-blue-700)] p-3 text-sm text-[var(--color-text1)]">{{ recoveryKey() }}</div>
          <div class="mt-5 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <button type="button" class="ui-btn ui-btn-secondary" (click)="copy()">{{ (copied ? 'Copied!' : 'Copy') | translate }}</button>
            <button type="button" class="ui-btn ui-btn-primary" (click)="close()">{{ 'Close' | translate }}</button>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class RecoveryKeyPopupComponent {
  readonly recoveryKey = input.required<string>();
  readonly closed = output<void>();
  copied = false;

  @HostListener('document:keydown.escape')
  close() {
    this.closed.emit();
  }

  copy() {
    void navigator.clipboard.writeText(this.recoveryKey()).then(() => this.copied = true);
  }
}
