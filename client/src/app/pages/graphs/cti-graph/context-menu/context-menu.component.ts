import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-graph-context-menu',
  standalone: true,
  imports: [],
  template: `
  <div id="customContextMenu" data-left="0" data-top="0" data-testid="cti-context-menu" class="ui-graph-flyout hidden fixed z-[1000] w-64 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-sm shadow-2xl focus:outline-none animate-[social-mapper-slide-down_0.12s_ease-out_forwards] [body.light-theme_&]:border-[var(--color-border)] [body.light-theme_&]:bg-[var(--color-blue-820-light)]">
    <div class="px-3 py-2 border-b border-slate-700/70 [body.light-theme_&]:border-[var(--color-border)]">
      <p class="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-400 [body.light-theme_&]:text-[var(--color-text4)]">Node Actions</p>
      <p class="mt-1 mb-0 truncate text-xs text-slate-500 [body.light-theme_&]:text-[var(--color-text4)]">{{ nodeId() }}</p>
    </div>
    <div class="p-2">
      @if (canExpand()) {
        <button data-testid="cti-context-expand" (click)="expand.emit(undefined)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-indigo-600/30 hover:text-white [body.light-theme_&]:text-[var(--color-text2)] [body.light-theme_&]:hover:bg-[var(--color-blue-720)] [body.light-theme_&]:hover:text-[var(--color-text1)]">
          <i class="bi bi-arrows-expand w-5 h-5 text-slate-400 transition-colors group-hover:text-indigo-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
          <span class="flex-grow">Expand</span>
          <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-indigo-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
        </button>
      }
      @if (canCollapse()) {
        <button data-testid="cti-context-collapse" (click)="collapse.emit(undefined)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700/70 hover:text-white [body.light-theme_&]:text-[var(--color-text2)] [body.light-theme_&]:hover:bg-[var(--color-blue-720)] [body.light-theme_&]:hover:text-[var(--color-text1)]">
          <i class="bi bi-arrows-collapse w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-200 [body.light-theme_&]:text-[var(--color-text4)]"></i>
          <span class="flex-grow">Collapse</span>
          <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-slate-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
        </button>
      }
      @if (canExpand() || canCollapse()) {
        <div class="my-2 h-px bg-slate-700/70 [body.light-theme_&]:bg-[var(--color-border)]"></div>
      }
      @if (showOpenCti()) {
        <button data-testid="cti-context-open-cti" (click)="openCti.emit(undefined)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-sky-200 transition-colors hover:bg-sky-500/20 hover:text-sky-100 [body.light-theme_&]:text-[var(--color-text2)] [body.light-theme_&]:hover:bg-[var(--color-blue-720)] [body.light-theme_&]:hover:text-[var(--color-text1)]">
          <i class="bi bi-box-arrow-up-right w-5 h-5 text-sky-300 transition-colors group-hover:text-sky-200 [body.light-theme_&]:text-[var(--color-text4)]"></i>
          <span class="flex-grow">Open CTI</span>
          <i class="bi bi-chevron-right text-xs text-sky-300/70 transition-colors group-hover:text-sky-200 [body.light-theme_&]:text-[var(--color-text4)]"></i>
        </button>
      }
      @if (showCopyLabel()) {
        <button data-testid="cti-context-copy-label" (click)="copyLabel.emit($event)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700/70 hover:text-white [body.light-theme_&]:text-[var(--color-text2)] [body.light-theme_&]:hover:bg-[var(--color-blue-720)] [body.light-theme_&]:hover:text-[var(--color-text1)]">
          <i class="bi bi-clipboard w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-200 [body.light-theme_&]:text-[var(--color-text4)]"></i>
          <span class="flex-grow">Copy Label</span>
          <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-slate-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
        </button>
      }
      @if (showOpenReport()) {
        <button data-testid="cti-context-open-report" (click)="openReport.emit(undefined)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 [body.light-theme_&]:text-[var(--color-text2)] [body.light-theme_&]:hover:bg-[var(--color-blue-720)] [body.light-theme_&]:hover:text-[var(--color-text1)]">
          <i class="bi bi-file-earmark-text w-5 h-5 text-red-400 transition-colors group-hover:text-red-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
          <span class="flex-grow">Open Report</span>
          <i class="bi bi-chevron-right text-xs text-red-400/70 transition-colors group-hover:text-red-300 [body.light-theme_&]:text-[var(--color-text4)]"></i>
        </button>
      }
    </div>
  </div>
  `
})
export class GraphContextMenuComponent {
  readonly nodeId = input('');
  readonly canExpand = input(false);
  readonly canCollapse = input(false);
  readonly showOpenCti = input(true);
  readonly showCopyLabel = input(true);
  readonly showOpenReport = input(true);
  readonly expand = output<undefined>();
  readonly collapse = output<undefined>();
  readonly openCti = output<undefined>();
  readonly copyLabel = output<MouseEvent>();
  readonly openReport = output<undefined>();
}
