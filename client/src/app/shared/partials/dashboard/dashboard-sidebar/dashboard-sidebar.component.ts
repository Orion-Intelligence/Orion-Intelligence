import { Component } from '@angular/core';
import { NgIf, NgOptimizedImage, NgClass } from '@angular/common';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass // ✅ Import NgClass to fix the error
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent {
  activeDropdown: string | null = null;

  toggleDropdown(item: string) {
    setTimeout(() => {
      this.activeDropdown = this.activeDropdown === item ? null : item;
    });
  }
}
