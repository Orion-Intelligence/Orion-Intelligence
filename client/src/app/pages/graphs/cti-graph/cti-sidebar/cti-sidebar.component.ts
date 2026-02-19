import { Component, EventEmitter, Output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
    selector: 'app-cti-sidebar',
    standalone: true,
    imports: [SidebarComponent],
    template: `<graph-sidebar (filtersApplied)="filtersApplied.emit($event)" (collapsedChange)="collapsedChange.emit($event)"></graph-sidebar>`
})
export class CtiSidebarComponent {
    @Output()
    filtersApplied = new EventEmitter<{
        selectedType: string;
        singleInput: string;
        propertyType: string;
        propertyValue: string;
        maxEdge: number;
        maxDepth: number;
    }>();
    @Output()
    collapsedChange = new EventEmitter<boolean>();
}
