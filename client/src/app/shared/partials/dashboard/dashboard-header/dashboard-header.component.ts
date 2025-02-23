import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';  // Import FormsModule

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css'],
  imports: [
    CommonModule,
    FormsModule,
  ]
})
export class DashboardHeaderComponent {
  mSearchCallbackRelevantSearchType = 'persona';
  mSearchCallbackQuery = '';
  mUsernameQuery = '';
  mSearchCallbackSaveSearch = 'safe';
}
