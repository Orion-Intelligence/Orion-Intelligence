import { Component } from '@angular/core';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { EventEmitter, Output } from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {Pages} from '../../../../constants/pages';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent {
  activeDropdown: string = 'general_intelligence';

  constructor(private dashboardService: DashboardService) {}

  toggleDropdown(item: string) {
      this.activeDropdown = this.activeDropdown === item ? '' : item;
  }

  @Output() menuClosed = new EventEmitter<void>();

  closeMenu() {
    this.menuClosed.emit();
  }

  selectSection(section: string) {
    this.updateCurrentPage(section);
  }

  updateCurrentPage(page: string) {
    this.dashboardService.updatePage(page);
  }

  protected readonly Pages = Pages;
}
