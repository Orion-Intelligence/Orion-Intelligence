import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';  // Import FormsModule

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NgOptimizedImage
  ]
})
export class DashboardHeaderComponent {
  mSearchCallbackRelevantSearchType = 'persona'; // Example value
  mSearchCallbackQuery = '';
  mUsernameQuery = '';
  mSearchCallbackSaveSearch = 'safe';

  // Function to generate static asset URLs dynamically
  getStaticUrl(path: string): string {
    return `/assets/${path}`;
  }
}
