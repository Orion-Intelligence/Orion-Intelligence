import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'app-json-viewer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './json-viewer.component.html'
})
export class JsonViewerComponent implements OnInit {
    @Input()
    json: any;
    @Input()
    level = 0;
    @Input()
    parentPath = '';
    expandedMap = new Map<string, boolean>();
    excludedPaths = new Set([
        '_title:trocador.app',
        'm_meta_description',
        'm_content',
        'm_important_content'
    ]);
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
    isCollapsible(value: any): boolean {
        return this.isObject(value) || (typeof value === 'string' && value.length > 1);
    }
    toggle(path: string): void {
        const current = this.expandedMap.get(path);
        this.expandedMap.set(path, !current);
    }
    isExpanded(path: string): boolean {
        return this.expandedMap.get(path) ?? false;
    }
    keys(obj: any): string[] {
        return Object.keys(obj);
    }
}
