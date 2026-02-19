import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { LowerPipe } from '../../../pipes/lower.pipe';
import { sidebarItemTooltips } from '../../../constants/shared-enums';
@Component({
    selector: 'app-dashboard-sidebar-collapsed',
    standalone: true,
    imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, NgForOf, TooltipDirective, LowerPipe],
    templateUrl: './dashboard-sidebar-collapsed.component.html',
})
export class SidebarSectionComponent {
    @Input()
    title = '';
    @Input()
    icon = '';
    @Input()
    items: string[] = [];
    @Input()
    category: any;
    @Input()
    routePrefix = '';
    @Input()
    selectionStore: any;
    @Input()
    tooltip = '';
    @Output()
    sectionSelected = new EventEmitter<any>();
    @Output()
    optionSelected = new EventEmitter<string>();
    selectSection() {
        this.sectionSelected.emit(this.category);
    }
    selectOption(item: string) {
        this.optionSelected.emit(item);
    }
    protected readonly itemTooltips = sidebarItemTooltips;
}
