import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  standalone: true, // Ensure standalone component if applicable
  imports: [FormsModule, NgOptimizedImage, RouterLink], // Import FormsModule for ngModel support
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  searchQuery: string = '';
  mSearchCallbackSaveSearch: string = 'safe';
  activeTab: string = 'results';  // Default active tab

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
