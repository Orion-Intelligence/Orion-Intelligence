import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-social-stealerlog-section',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      data-testid="social-stealerlog-section"
      [routerLink]="['/dashboard/stealerlogs/iocs']"
      [queryParams]="{ user: searchIdentity() }"
      class="group flex min-h-[58px] w-full min-w-[220px] items-center gap-3 rounded-[10px] border border-rose-500/15 bg-[linear-gradient(145deg,rgba(244,63,94,0.10)_0%,rgba(87,165,235,0.045)_58%,var(--color-blue-820-light)_100%)] px-3 py-2.5 text-left shadow-[0_8px_18px_var(--color-shadow-light)] transition-colors hover:border-rose-400/30 hover:bg-[rgba(244,63,94,0.12)] md:w-[238px]"
      aria-label="Open Stealer Logs for this username"
      title="Open Stealer Logs"
    >
      <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] border border-rose-400/15 bg-rose-500/10">
        <img src="assets/images/sidebar/stealerlog.svg" alt="" class="ui-action-icon h-4 w-4 opacity-85" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[11px] font-semibold uppercase tracking-wide text-rose-300">Stealer Logs</span>
        <span class="mt-0.5 block truncate font-mono text-[11px] text-[var(--color-text4)]">{{ displayIdentity() }}</span>
      </span>
      <i class="bi bi-box-arrow-up-right flex-shrink-0 text-[12px] text-[var(--color-text4)] transition-colors group-hover:text-rose-300"></i>
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StealerlogSectionComponent {
  username = input.required<string>();

  searchIdentity = computed(() => this.normalizeIdentity(this.username()));
  displayIdentity = computed(() => {
    const identity = this.searchIdentity();
    return identity ? `@${identity}` : 'Open search';
  });

  private normalizeIdentity(value: string): string {
    return (value || '').trim().replace(/^@+/, '');
  }
}
