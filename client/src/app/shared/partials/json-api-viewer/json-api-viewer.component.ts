import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonViewerComponent } from './json-viewer/json-viewer.component';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
@Component({
    selector: 'app-json-api-viewer',
    standalone: true,
    imports: [CommonModule, JsonViewerComponent, JsonViewerComponent, TooltipDirective],
    templateUrl: './json-api-viewer.component.html',
})
export class JsonApiViewerComponent {
    @Input()
    jsonData: any;
    isExpanded = false;
    toggleContent(): void {
        this.isExpanded = !this.isExpanded;
    }
}
