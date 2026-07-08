import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-graph-loading',
  standalone: true,
  template: `
    <div class="fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,_var(--color-blue-850),_var(--color-blue-830))]">
      <div class="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,_rgba(148,163,184,0.18)_1px,_transparent_1px)] [background-size:1.5rem_1.5rem]"></div>
      <div class="relative flex h-full items-center justify-center px-6">
        <div class="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-blue-800)]/70 p-8 text-center shadow-2xl backdrop-blur-md">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300/20 bg-slate-200/10">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-300/25 border-t-sky-300"></div>
          </div>
          <h2 class="text-lg font-semibold text-[var(--color-text1)]">{{ title() }}</h2>
          <p class="mt-2 text-sm text-[var(--color-text4)]">{{ subtitle() }}</p>
          @if (actionLabel()) {
            <button type="button" class="mt-5 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-blue-720)] px-4 py-2 text-sm font-medium text-[var(--color-text1)] transition hover:bg-[var(--color-blue-710)]" (click)="actionTriggered.emit(undefined)">
              {{ actionLabel() }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphLoadingComponent {
  title = input('Loading Graph');
  subtitle = input('Preparing graph view.');
  actionLabel = input('');
  actionTriggered = output<undefined>();
}
