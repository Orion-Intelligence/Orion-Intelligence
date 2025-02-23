import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-side-bar',
  templateUrl: './dashboard-side-bar.component.html',
  imports: [
    NgOptimizedImage,
    CommonModule
  ],
  styleUrls: ['./dashboard-side-bar.component.css']
})
export class DashboardSideBarComponent {
 activeDropdown: string | null = null;

  toggleDropdown(item: string) {
    this.activeDropdown = this.activeDropdown === item ? null : item;
  }
}
