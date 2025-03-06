import {Component, Input, Output, EventEmitter} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-sidebar-items',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, NgForOf],
  templateUrl: './dashboard-sidebar-items.component.html',
})
export class DashboardSidebarItemsComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() items: string[] = [];
  @Input() category: any;
  @Input() routePrefix: string = '';
  @Input() selectionStore: any;

  @Output() sectionSelected = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<string>();

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
  }
}
