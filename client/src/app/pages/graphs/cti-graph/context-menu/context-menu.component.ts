import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-graph-context-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div id="customContextMenu" class="hidden fixed z-[1000] w-64 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-sm shadow-2xl focus:outline-none">
    <div class="px-3 py-2 border-b border-slate-700/70">
      <p class="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-400">Node Actions</p>
      <p class="mt-1 mb-0 truncate text-xs text-slate-500">{{ nodeId }}</p>
    </div>
    <div class="p-2">
      <button *ngIf="canExpand" (click)="expand.emit()" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-indigo-600/30 hover:text-white">
        <i class="bi bi-arrows-expand w-5 h-5 text-slate-400 transition-colors group-hover:text-indigo-300"></i>
        <span class="flex-grow">Expand</span>
        <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-indigo-300"></i>
      </button>
      <button *ngIf="canCollapse" (click)="collapse.emit()" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700/70 hover:text-white">
        <i class="bi bi-arrows-collapse w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-200"></i>
        <span class="flex-grow">Collapse</span>
        <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-slate-300"></i>
      </button>
      <div *ngIf="canExpand || canCollapse" class="my-2 h-px bg-slate-700/70"></div>
      <button *ngIf="showOpenCti" (click)="openCti.emit()" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-sky-200 transition-colors hover:bg-sky-500/20 hover:text-sky-100">
        <i class="bi bi-box-arrow-up-right w-5 h-5 text-sky-300 transition-colors group-hover:text-sky-200"></i>
        <span class="flex-grow">Open CTI</span>
        <i class="bi bi-chevron-right text-xs text-sky-300/70 transition-colors group-hover:text-sky-200"></i>
      </button>
      <button *ngIf="showCopyLabel" (click)="copyLabel.emit($event)" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700/70 hover:text-white">
        <i class="bi bi-clipboard w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-200"></i>
        <span class="flex-grow">Copy Label</span>
        <i class="bi bi-chevron-right text-xs text-slate-500 transition-colors group-hover:text-slate-300"></i>
      </button>
      <button *ngIf="showOpenReport" (click)="openReport.emit()" class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200">
        <i class="bi bi-file-earmark-text w-5 h-5 text-red-400 transition-colors group-hover:text-red-300"></i>
        <span class="flex-grow">Open Report</span>
        <i class="bi bi-chevron-right text-xs text-red-400/70 transition-colors group-hover:text-red-300"></i>
      </button>
    </div>
  </div>
  `
})
export class GraphContextMenuComponent {
    @Input() nodeId = '';
    @Input() canExpand = false;
    @Input() canCollapse = false;
    @Input() showOpenCti = true;
    @Input() showCopyLabel = true;
    @Input() showOpenReport = true;
    @Output() expand = new EventEmitter<void>();
    @Output() collapse = new EventEmitter<void>();
    @Output() openCti = new EventEmitter<void>();
    @Output() copyLabel = new EventEmitter<MouseEvent>();
    @Output() openReport = new EventEmitter<void>();
}
