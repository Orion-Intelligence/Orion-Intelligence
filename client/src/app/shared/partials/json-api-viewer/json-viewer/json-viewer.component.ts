import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-viewer.component.html'
})
export class JsonViewerComponent implements OnInit {
  expandedMap = new Map<string, boolean>();
  excludedPaths = new Set([ '_title:trocador.app', 'm_meta_description', 'm_content', 'm_important_content' ]);

  @Input() json: any;
  @Input() level = 0;
  @Input() parentPath = '';
  @Input() showRootBraces = false;

  ngOnInit(): void {
    this.initExpansionState(this.json, this.parentPath);
  }

  initExpansionState(obj: any, path: string): void {
    const shouldCollapse = [...this.excludedPaths].some(ex => path.endsWith(ex));
    if (this.isObject(obj)) {
      this.expandedMap.set(path, !shouldCollapse);
      for (const key of Object.keys(obj)) {
        const nextPath = this.pathKey(path, key);
        this.initExpansionState(obj[key], nextPath);
      }
    }
    else {
      this.expandedMap.set(path, !shouldCollapse);
    }
  }

  pathKey(parent: string, key: string): string {
    return parent ? `${parent}.${key}` : key;
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isCollapsible(value: any): boolean {
    return this.isObject(value);
  }

  toggle(path: string): void {
    const current = this.expandedMap.get(path);
    this.expandedMap.set(path, !current);
  }

  isExpanded(path: string): boolean {
    return this.expandedMap.get(path) ?? false;
  }

  keys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }
    return Object.keys(obj);
  }

  depthMargin(level: number): number {
    if (level <= 0) {
      return 0;
    }
    if (level === 1 || level === 2) {
      return 20;
    }
    return level * 20;
  }

  openToken(value: any): string {
    return this.isArray(value) ? '[' : '{';
  }

  closeToken(value: any): string {
    return this.isArray(value) ? ']' : '}';
  }

  collapsedSummary(value: any): string {
    if (!this.isObject(value)) {
      return '';
    }
    if (this.isArray(value)) {
      return `${value.length} item${value.length === 1 ? '' : 's'}`;
    }
    const count = Object.keys(value || {}).length;
    return `${count} key${count === 1 ? '' : 's'}`;
  }

  formatPrimitive(value: any): string {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    return String(value);
  }

  primitiveClass(value: any): string {
    if (value === null) {
      return 'text-[var(--color-text4)]';
    }
    if (typeof value === 'string') {
      return 'text-[var(--color-text1)]';
    }
    if (typeof value === 'boolean') {
      return 'text-[#d97706]';
    }
    return 'text-[var(--color-text1)]';
  }

  primitiveSummary(value: any): string {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return 'string';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    return 'value';
  }
}
