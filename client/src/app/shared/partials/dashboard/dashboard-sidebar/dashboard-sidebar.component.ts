import { Component } from '@angular/core';
import {NgIf, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [
    NgOptimizedImage,
    NgIf
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.css'
})
export class DashboardSidebarComponent {
 activeDropdown: string | null = null;

  toggleDropdown(item: string) {
    this.activeDropdown = this.activeDropdown === item ? null : item;
  }
}
