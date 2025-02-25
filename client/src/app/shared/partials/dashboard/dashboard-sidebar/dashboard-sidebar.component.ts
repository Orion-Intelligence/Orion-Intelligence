import {Component} from '@angular/core';
import {NgIf, NgOptimizedImage, NgClass} from '@angular/common';
import { EventEmitter, Output } from '@angular/core';

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
  activeDropdown: string = 'general_intelligence'; // ✅ Set 'general_intelligence' active by default

  toggleDropdown(item: string) {
    setTimeout(() => {
      this.activeDropdown = this.activeDropdown === item ? '' : item; // ✅ Use an empty string instead of null
    });
  }

  @Output() menuClosed = new EventEmitter<void>();

  closeMenu() {
    this.menuClosed.emit(); // Notify parent to remove .show-menu
  }
}
